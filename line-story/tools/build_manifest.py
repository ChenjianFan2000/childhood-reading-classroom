#!/usr/bin/env python3
"""Rebuild the deterministic release manifest after data, docs and QA settle."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'scripts/lesson-data.js'
lesson = json.loads(source.read_text().split('window.LINE_LESSON = ', 1)[1].strip().removesuffix(';'))
allowed_roots = {'assets', 'scripts', 'styles', 'tests', 'tools'}
files = {}
for item in sorted(ROOT.rglob('*')):
    if not item.is_file():
        continue
    rel = item.relative_to(ROOT)
    if item.name == 'manifest.json' or '__pycache__' in rel.parts or item.suffix == '.pyc':
        continue
    if len(rel.parts) > 1 and rel.parts[0] not in allowed_roots:
        continue
    raw = item.read_bytes()
    files[rel.as_posix()] = {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
manifest = {'version': lesson['version'], 'lesson_sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'files': files}
(ROOT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(f'{len(files)} release files recorded')
