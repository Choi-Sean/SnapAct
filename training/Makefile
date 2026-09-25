# 게이트 모델 학습 — 테스트 진입점
# 모두 training/ 안에서 실행합니다.  예:  cd training && make smoke
#
# 인터프리터는 리포 루트의 공용 .venv 를 씁니다 (training/.venv 가 아닙니다).
# 루트에 두면 에디터·IDE 가 자동으로 잡고, 카탈로그 도구와 학습 코드가
# 같은 환경을 공유합니다. 의존성 정의는 여전히 training/requirements.txt 이고
# 루트 requirements.txt 가 그것을 -r 로 합칩니다.
REPO_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/..)
VENV := $(REPO_ROOT)/.venv
PY := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

.PHONY: help setup check-venv fixture smoke guards eval clean

help:
	@echo "make setup    루트 .venv 생성 + 의존성 설치"
	@echo "make smoke    픽스처 생성 -> 평가 실행 (데이터 없이 배관 검증)"
	@echo "make guards   코드로 강제하는 가드 22개 검증"
	@echo "make eval     실제 검증셋으로 평가  (CKPT=... DATA=... 지정)"
	@echo "make clean    픽스처/실행 산출물 삭제"

setup:
	cd $(REPO_ROOT) && $(MAKE) setup

check-venv:
	@test -x $(PY) || { echo "루트 .venv 가 없습니다. 리포 루트에서 'make setup' 을 먼저 실행하세요."; exit 1; }

fixture: check-venv
	$(PY) tools/make_fixture.py

smoke: fixture
	$(PY) eval_gate.py --checkpoint runs/fixture.pt --data data/fixture/val --out runs/eval_fixture

guards: check-venv
	$(PY) tools/check_guards.py

CKPT ?= runs/best.pt
DATA ?= data/real/val
eval: check-venv
	$(PY) eval_gate.py --checkpoint $(CKPT) --data $(DATA) --out runs/eval

clean:
	rm -rf data/fixture runs
