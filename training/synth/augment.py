"""Augmentation chain applied to rendered templates.  [구현 예정 — 세션 1, 3단계]

Required chain (all of these, order roughly as listed):
  perspective  — held in the hand, not flat on a scanner
  occlusion    — fingers over a corner. DO NOT DROP THIS: a hand-held card
                 almost always has a covered corner, and a model trained only
                 on un-occluded cards learns the corner as a feature
  lighting     — fluorescent cast, backlight, hard shadow across the surface
  blur         — handshake motion blur
  rotation
  background   — composited onto desk / floor / hand
  jpeg         — compression artifacts, last, so it degrades everything above
"""
