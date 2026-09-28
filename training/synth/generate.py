#!/usr/bin/env python3
"""Render templates x random content x augmentation into data/synth/.
[구현 예정 — 세션 1, 3단계]

Writes only the four blocking classes. `safe` is deliberately NOT synthesized:
a rendered "safe" image teaches the model to separate our renderer from real
photography, which is the opposite of what the safe class is for. Safe
negatives are real photos only — see data/README.md.
"""
