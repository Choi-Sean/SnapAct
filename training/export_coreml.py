#!/usr/bin/env python3
"""Export a trained checkpoint to .mlpackage + weights JSON.  [구현 예정 — 세션 3]

Two artifacts, both for the partner's Xcode target:
  1. .mlpackage with preprocessing (normalization) folded into the model, so
     the Swift side hands over a plain image and gets 5 numbers back.
  2. Weights JSON, so the head can be run via Accelerate/BNNS instead, which
     sidesteps Core ML toolchain version mismatches.

Also regenerates the interface doc (input size, output order, recommended
thresholds from the sweep, fail-closed rule).
"""
