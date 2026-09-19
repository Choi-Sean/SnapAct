# 게이트 모델 학습 — 테스트 진입점
# 모두 training/ 안에서 실행합니다.  예:  cd training && make smoke

PY := .venv/bin/python
PIP := .venv/bin/pip

.PHONY: help setup fixture smoke guards eval clean

help:
	@echo "make setup    venv 생성 + 의존성 설치"
	@echo "make smoke    픽스처 생성 -> 평가 실행 (데이터 없이 배관 검증)"
	@echo "make guards   코드로 강제하는 3가지 가드 검증"
	@echo "make eval     실제 검증셋으로 평가  (CKPT=... DATA=... 지정)"
	@echo "make clean    픽스처/실행 산출물 삭제"

setup:
	python3.12 -m venv .venv
	$(PIP) install -q --upgrade pip
	$(PIP) install -r requirements.txt
	@echo "완료. .venv/bin/python 사용"

fixture:
	$(PY) tools/make_fixture.py

smoke: fixture
	$(PY) eval_gate.py --checkpoint runs/fixture.pt --data data/fixture/val --out runs/eval_fixture

guards:
	$(PY) tools/check_guards.py

CKPT ?= runs/best.pt
DATA ?= data/real/val
eval:
	$(PY) eval_gate.py --checkpoint $(CKPT) --data $(DATA) --out runs/eval

clean:
	rm -rf data/fixture runs
