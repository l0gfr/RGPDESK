"""Safety tests run on temporary files only; no privileged command is executed."""
import importlib.util
import io
from pathlib import Path
import stat
import sys
import tempfile
import unittest
from unittest.mock import patch
import warnings
import zipfile

sys.dont_write_bytecode = True

spec = importlib.util.spec_from_file_location('update', Path(__file__).resolve().parents[1] / 'deploy/rgpdesk/update-release.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def zip_bytes(entries):
    stream = io.BytesIO()
    with warnings.catch_warnings():
        warnings.simplefilter('ignore', UserWarning)
        with zipfile.ZipFile(stream, 'w') as archive:
            for name, data in entries:
                archive.writestr(name, data)
    return stream.getvalue()


class DeploymentSafety(unittest.TestCase):
    def test_arguments_are_pinned_digests_only(self):
        good = ['a' * 40, 'b' * 64, 'c' * 40, 'd' * 64]
        self.assertEqual(m.arguments(good), good)
        for values in [[], good + ['extra'], ['../etc', *good[1:]], [good[0], '$(id)', *good[2:]], [good[0], good[1], good[0], good[3]]]:
            with self.assertRaises(ValueError):
                m.arguments(values)

    def test_reader_refuses_symlinks_hardlinks_and_limits(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / 'file'
            p.write_bytes(b'abc')
            self.assertEqual(m.regular_bytes(p, protected=False), b'abc')
            with self.assertRaises(ValueError):
                m.regular_bytes(p, limit=2, protected=False)
            link = Path(directory) / 'link'
            link.symlink_to(p)
            with self.assertRaises(OSError):
                m.regular_bytes(link, protected=False)
            link.unlink()
            link.hardlink_to(p)
            with self.assertRaises(ValueError):
                m.regular_bytes(p, protected=False)

    def test_extraction_refuses_traversal_duplicates_symlinks_and_bounds(self):
        symbolic = zipfile.ZipInfo('site/link')
        symbolic.create_system = 3
        symbolic.external_attr = (stat.S_IFLNK | 0o777) << 16
        samples = [zip_bytes([(name, b'x')]) for name in ['../escape', '/absolute', 'site/../x', 'site//x', 'site\\x']]
        samples += [zip_bytes([('file', b'a'), ('file', b'b')]), zip_bytes([(symbolic, b'/etc/private')]), zip_bytes([('file', b'x' * 5_000_001)])]
        for data in samples:
            with tempfile.TemporaryDirectory() as directory:
                with self.assertRaises(ValueError):
                    m.extract_release(data, Path(directory))
                self.assertEqual(list(Path(directory).iterdir()), [])

    def test_extraction_and_config_replacement_preserve_exact_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            m.extract_release(zip_bytes([('site/index.html', b'public')]), root)
            self.assertEqual((root / 'site/index.html').read_bytes(), b'public')
            with patch.object(m, 'CONFIG', root / 'site.conf'):
                m.install_config(b'old config')
                m.install_config(b'new config')
                self.assertEqual(m.CONFIG.read_bytes(), b'new config')
                m.install_config(b'old config')
                self.assertEqual(m.CONFIG.read_bytes(), b'old config')

    def test_unprotected_directory_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory)
            p.chmod(0o777)
            with self.assertRaises(ValueError):
                m.protected_directory(p)

    def test_backup_status_never_starts_a_service_or_borg_and_does_not_mask_activation(self):
        for result in [b'ActiveState=active\nUnitFileState=enabled\nResult=exit-code\nExecMainStatus=1\n', b'ActiveState=inactive\n']:
            with patch.object(m, 'run', return_value=result) as run, patch('sys.stdout', new=io.StringIO()) as output:
                m.backup_status()
                self.assertIn('A CONTROLER', output.getvalue())
                for call in run.call_args_list:
                    command = call.args[0]
                    self.assertEqual(command[:2], ['/usr/bin/systemctl', 'show'])
                    self.assertNotIn('start', command)
        with patch.object(m, 'run', side_effect=ValueError('unavailable')), patch('sys.stdout', new=io.StringIO()) as output:
            m.backup_status()
            self.assertIn('controle separe requis', output.getvalue())

    def test_http_failure_restores_previous_vhost_without_starting_backup(self):
        commit, previous = 'a' * 40, 'b' * 40
        data = zip_bytes([('site/release.json', b'{"commit":"' + commit.encode() + b'","dirtyWorktree":false}'), ('apache/rgpdesk.fr.conf', b'new vhost'), ('verify-release.py', b'# verifier fixture')])
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for path in ['backups', 'releases/' + previous, 'available', 'enabled', 'incoming/rgpdesk-' + commit]:
                (root / path).mkdir(parents=True)
            (root / 'available/rgpdesk.fr.conf').write_bytes(b'old vhost')
            (root / 'enabled/rgpdesk.fr.conf').symlink_to('../sites-available/rgpdesk.fr.conf')
            (root / ('releases/' + previous + '/release.json')).write_text('{"commit":"' + previous + '","dirtyWorktree":false}')
            (root / ('incoming/rgpdesk-' + commit + '/rgpdesk-release.zip')).write_bytes(data)
            def command(args, **_kwargs):
                if Path(args[0]).name == 'curl':
                    raise ValueError('HTTPS failed')
                return b''
            with patch.multiple(m, BASE=root/'backups', RELEASES=root/'releases', CONFIG=root/'available/rgpdesk.fr.conf', ENABLED=root/'enabled/rgpdesk.fr.conf', INCOMING_ROOT=root/'incoming'), patch.object(m, 'protected_directory'), patch.object(m.os, 'getuid', return_value=0), patch.object(m, 'run', side_effect=command) as run:
                original = m.regular_bytes
                with patch.object(m, 'regular_bytes', side_effect=lambda p, **kw: original(p, protected=False)):
                    with self.assertRaisesRegex(ValueError, 'HTTPS failed'):
                        m.activate(commit, m.sha(data), previous, m.sha(b'old vhost'))
                self.assertEqual(m.CONFIG.read_bytes(), b'old vhost')
                commands = [call.args[0] for call in run.call_args_list]
                self.assertEqual(commands.count(['/usr/bin/systemctl', 'reload', 'apache2']), 2)
                self.assertFalse(any('zen-backup.service' in command for command in commands))
                self.assertEqual(list((root/'backups').glob('update.*/previous-apache.conf'))[0].read_bytes(), b'old vhost')


if __name__ == '__main__':
    unittest.main()
