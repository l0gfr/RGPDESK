#!/usr/bin/env python3
"""Operator-only static RGPDESK activation. Never starts or modifies Zen backups.
Pinned CI archive, strict extraction, Apache preflight, rollback and HTTPS proof.
Run only the reviewed script with four pinned hexadecimal arguments.
"""
import fcntl
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import time
import zipfile

BASE = Path('/var/backups/rgpdesk')
CONFIG = Path('/etc/apache2/sites-available/rgpdesk.fr.conf')
ENABLED = Path('/etc/apache2/sites-enabled/rgpdesk.fr.conf')
RELEASES = Path('/var/www/rgpdesk/releases')
INCOMING_ROOT = Path('/home/bluetouff')

def sha(data):
    return hashlib.sha256(data).hexdigest()


def protected_directory(path):
    for candidate in (path, *path.parents):
        info = candidate.lstat()
        if not stat.S_ISDIR(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o022:
            raise ValueError('Repertoire privilegie non protege : ' + str(candidate))


def regular_bytes(path, limit=5_000_000, protected=True):
    if protected:
        protected_directory(path.parent)
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd, 'rb') as stream:
        info = os.fstat(stream.fileno())
        if (not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_size > limit
                or protected and (info.st_uid != 0 or info.st_mode & 0o022)):
            raise ValueError('Fichier non regulier, non protege ou trop grand')
        data = stream.read(limit + 1)
        if len(data) > limit:
            raise ValueError('Lecture trop grande')
        return data


def run(args, timeout=60):
    result = subprocess.run(args, stdin=subprocess.DEVNULL, capture_output=True,
                            timeout=timeout, check=False)
    if result.returncode != 0:
        # Captured stderr can contain private paths; never print it or file contents.
        raise ValueError('Commande en echec : ' + Path(args[0]).name + ' ; aucun nouvel essai')
    return result.stdout


def write_new(path, data, mode=0o600):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, mode)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
        stream.flush()
        os.fsync(stream.fileno())


def install_config(data):
    fd, temporary = tempfile.mkstemp(prefix='.rgpdesk-', dir=CONFIG.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
            os.fchmod(stream.fileno(), 0o644)
        os.replace(temporary, CONFIG)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def extract_release(data, destination):
    # The exact CI digest is checked before calling this bounded extractor.
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        entries = archive.infolist()
        seen = set()
        if len(entries) > 250 or sum(item.file_size for item in entries) > 20_000_000:
            raise ValueError('Archive hors limites')
        for item in entries:
            name = item.filename.rstrip('/') if item.is_dir() else item.filename
            mode = item.external_attr >> 16
            if (not name or '\\' in name or '\x00' in name or name.startswith('/')
                    or any(part in ('', '.', '..') for part in name.split('/'))
                    or name in seen or item.flag_bits & 1 or item.file_size > 5_000_000
                    or stat.S_IFMT(mode) not in (0, stat.S_IFDIR, stat.S_IFREG)):
                raise ValueError('Entree ZIP refusee')
            seen.add(name)
        for item in entries:
            target = destination / item.filename
            if item.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                write_new(target, archive.read(item))


def arguments(values):
    if len(values) != 4:
        raise ValueError('Quatre arguments requis : commit, archive SHA256, ancien commit, ancien vhost SHA256')
    for value, size in zip(values, [40, 64, 40, 64]):
        if not re.fullmatch('[a-f0-9]{' + str(size) + '}', value):
            raise ValueError('Argument non hexadecimal ou longueur incorrecte')
    if values[0] == values[2]:
        raise ValueError('Ancienne et nouvelle version identiques')
    return values


def activate(commit, zip_sha, old_commit, old_config_sha):
    for directory in [BASE, RELEASES, CONFIG.parent, ENABLED.parent]:
        protected_directory(directory)
    release = RELEASES / commit
    if release.exists() or release.is_symlink():
        raise ValueError('Release deja presente : aucun ecrasement')
    if not ENABLED.is_symlink() or os.readlink(ENABLED) != '../sites-available/rgpdesk.fr.conf':
        raise ValueError('Activation Apache inattendue')
    old = regular_bytes(CONFIG)
    if sha(old) != old_config_sha:
        raise ValueError('Configuration courante modifiee : mise a jour refusee')
    live = json.loads(regular_bytes(RELEASES / old_commit / 'release.json'))
    if live.get('commit') != old_commit or live.get('dirtyWorktree') is not False:
        raise ValueError('Release precedente inattendue')
    run(['/usr/sbin/apache2ctl', 'configtest'])
    candidate = regular_bytes(INCOMING_ROOT / ('rgpdesk-' + commit) / 'rgpdesk-release.zip', protected=False)
    if sha(candidate) != zip_sha:
        raise ValueError('Empreinte de l archive CI incorrecte')
    work = Path(tempfile.mkdtemp(prefix='update.', dir=BASE))
    write_new(work / 'release.zip', candidate)
    write_new(work / 'previous-apache.conf', old)
    extracted = work / 'verified'
    extracted.mkdir()
    extract_release(candidate, extracted)
    run(['/usr/bin/python3', '-I', str(extracted / 'verify-release.py'), str(extracted), commit])
    shutil.copytree(extracted / 'site', release)
    for directory, _dirs, files in os.walk(release):
        os.chmod(directory, 0o755)
        for name in files:
            os.chmod(Path(directory) / name, 0o644)
    try:
        install_config(regular_bytes(extracted / 'apache/rgpdesk.fr.conf'))
        run(['/usr/sbin/apache2ctl', 'configtest'])
        run(['/usr/bin/systemctl', 'reload', 'apache2'])
        served = json.loads(run(['/usr/bin/curl', '--noproxy', '*', '--resolve', 'rgpdesk.fr:443:127.0.0.1',
                                 '--fail', '--silent', '--show-error', '--max-time', '20', 'https://rgpdesk.fr/release.json']))
        if served.get('commit') != commit or served.get('dirtyWorktree') is not False:
            raise ValueError('Version HTTPS inattendue')
    except BaseException:
        install_config(old)
        run(['/usr/sbin/apache2ctl', 'configtest'])
        run(['/usr/bin/systemctl', 'reload', 'apache2'])
        print('Ancien vhost retabli. Release candidate conservee sans activation.', flush=True)
        raise
    write_new(work / 'activation.json', (json.dumps({'commit': commit, 'previousCommit': old_commit,
               'backupPolicy': 'existing-zen-schedule', 'backupStarted': False}) + '\n').encode())
    print('RGPDESK active : ' + commit + '. Retour arriere protege : ' + str(work), flush=True)
    return work


def backup_status():
    # Read-only metadata, separate from site activation. No Borg process, SSH or backup start.
    try:
        timer = run(['/usr/bin/systemctl', 'show', 'zen-backup.timer', '-p', 'ActiveState', '-p', 'UnitFileState'], timeout=10).decode()
        service = run(['/usr/bin/systemctl', 'show', 'zen-backup.service', '-p', 'Result', '-p', 'ExecMainStatus'], timeout=10).decode()
        scheduled = 'ActiveState=active' in timer and 'UnitFileState=enabled' in timer
        succeeded = 'Result=success' in service and 'ExecMainStatus=0' in service
        print('Sauvegarde Zen planifiee : ' + ('active' if scheduled else 'A CONTROLER') +
              '. Dernier lancement : ' + ('termine sans erreur declaree' if succeeded else 'A CONTROLER') +
              '. Aucun backup lance par ce deploiement.', flush=True)
    except Exception:
        print('Site active. Etat de la sauvegarde planifiee indisponible ; controle separe requis.', flush=True)


def main():
    values = arguments(sys.argv[1:])
    if os.geteuid() != 0 or os.uname().nodename.split('.')[0] != 'zen':
        raise ValueError('Execution reservee a l operateur root sur Zen')
    os.umask(0o077)
    protected_directory(Path('/run'))
    fd = os.open('/run/rgpdesk-deploy.lock', os.O_WRONLY | os.O_CREAT | os.O_NOFOLLOW | os.O_NONBLOCK, 0o600)
    with os.fdopen(fd, 'wb') as lock:
        info = os.fstat(lock.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_uid != 0 or info.st_mode & 0o022:
            raise ValueError('Verrou de deploiement non protege')
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        started = time.monotonic()
        activate(*values)
        print('Activation et verification locale : ' + str(round(time.monotonic() - started, 1)) + ' s.', flush=True)
    backup_status()
    print('Verification HTTPS externe encore requise.', flush=True)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        detail = str(error) if type(error) is ValueError else type(error).__name__
        print('ARRET : ' + detail + '. Aucun nouvel essai automatique.', file=sys.stderr)
        raise SystemExit(1)
