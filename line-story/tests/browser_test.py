#!/usr/bin/env python3
"""Compatibility entry point for the shared Node/Playwright browser regression."""
import os
import shutil
import subprocess
import sys
from pathlib import Path

node = os.environ.get('CODEX_PRIMARY_RUNTIME_NODE') or shutil.which('node')
if not node:
    raise SystemExit('Node.js is required. Run node tests/browser.test.cjs after installing Playwright.')
args = [a for a in sys.argv[1:] if a != '--motion']
if '--inline' in args:
    raise SystemExit('This regression uses actual file:// files. Omit --inline; no in-memory substitution is used.')
raise SystemExit(subprocess.call([node, str(Path(__file__).with_name('browser.test.cjs')), *args]))

