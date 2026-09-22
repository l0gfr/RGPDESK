#!/usr/bin/env python3
"""Read-only verification of an extracted RGPDESK release. No dependencies."""
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys


def verify(root, commit):
    if not re.fullmatch(r"[a-f0-9]{40}", commit):
        raise ValueError("Invalid expected commit")
    root = Path(os.path.abspath(root))
    if root.is_symlink() or not root.is_dir():
        raise ValueError("Invalid release root")
    for parent in root.parents:
        if parent.is_symlink():
            raise ValueError("Symlink in release ancestors")
    actual = {}
    for base, directories, filenames in os.walk(root, followlinks=False):
        for name in directories + filenames:
            path = Path(base) / name
            info = path.lstat()
            if stat.S_ISLNK(info.st_mode) or not (stat.S_ISREG(info.st_mode) or stat.S_ISDIR(info.st_mode)):
                raise ValueError("Non-regular release entry")
            if info.st_nlink != 1 and stat.S_ISREG(info.st_mode):
                raise ValueError("Hard link in release")
            if info.st_size > 5_000_000:
                raise ValueError("Oversized release entry")
            if name in filenames:
                actual[path.relative_to(root).as_posix()] = path.read_bytes()
    if len(actual) > 200 or sum(map(len, actual.values())) > 20_000_000:
        raise ValueError("Oversized release inventory")
    manifest = json.loads(actual["manifest.json"])
    if manifest["format"] != "rgpdesk-static-release-v1" or manifest["commit"] != commit or manifest["dirtyWorktree"] is not False:
        raise ValueError("Unexpected or uncommitted release")
    allowed = re.compile(r"(?:site/(?:index\.html|app/privacy/(?:index\.html|verify/index\.html|confidentialite/index\.html)|_astro/[A-Za-z0-9_.-]+\.(?:js|css|woff2?|svg|png|webp)|(?:LICENSE|NOTICE|THIRD_PARTY_NOTICES|TRADEMARKS)\.txt|robots\.txt|release\.json)|apache/(?:rgpdesk\.fr\.conf|rgpdesk-bootstrap\.conf)|verify-release\.py)")
    expected = set()
    for item in manifest["files"]:
        name = item["path"]
        if not allowed.fullmatch(name) or name in expected:
            raise ValueError("Unexpected or duplicate inventory entry")
        expected.add(name)
        content = actual[name]
        if len(content) != item["bytes"] or hashlib.sha256(content).hexdigest() != item["sha256"]:
            raise ValueError("Release integrity mismatch")
    if set(actual) != expected | {"manifest.json", "SHA256SUMS"}:
        raise ValueError("Incomplete or extra release files")
    required = {"site/index.html", "site/app/privacy/index.html", "site/app/privacy/verify/index.html", "site/app/privacy/confidentialite/index.html", "site/LICENSE.txt", "site/NOTICE.txt", "site/THIRD_PARTY_NOTICES.txt", "site/TRADEMARKS.txt", "site/robots.txt", "site/release.json", "apache/rgpdesk.fr.conf", "apache/rgpdesk-bootstrap.conf", "verify-release.py"}
    if not required <= expected:
        raise ValueError("Missing required release files")
    sums = {}
    for line in actual["SHA256SUMS"].decode("ascii").splitlines():
        checksum, name = line.split("  ", 1)
        if name in sums or not re.fullmatch(r"[a-f0-9]{64}", checksum):
            raise ValueError("Invalid checksum inventory")
        sums[name] = checksum
    if set(sums) != expected | {"manifest.json"}:
        raise ValueError("Incomplete checksum inventory")
    if any(hashlib.sha256(actual[name]).hexdigest() != checksum for name, checksum in sums.items()):
        raise ValueError("Checksum mismatch")
    status = json.loads(actual["site/release.json"])
    if status["product"] != "RGPDESK" or status["commit"] != commit or status["dirtyWorktree"] is not False:
        raise ValueError("Public release metadata mismatch")
    print(f"RGPDESK release verified: {commit}, {len(expected)} files")


if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            raise ValueError("Usage: verify-release.py EXTRACTED_DIRECTORY EXPECTED_COMMIT")
        verify(sys.argv[1], sys.argv[2])
    except (ValueError, KeyError, TypeError, OSError):
        print("RGPDESK release verification failed", file=sys.stderr)
        sys.exit(1)
