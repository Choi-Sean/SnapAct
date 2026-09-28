# SnapAct — 리포 공용 진입점
#
# 영역별 진짜 작업은 각 디렉터리의 Makefile 에 있습니다. 여기는 공용 Python
# 환경을 만들고, 어디서 무엇을 돌리는지 한 곳에서 보이게 하는 역할입니다.

PYTHON312 ?= /opt/homebrew/bin/python3.12
VENV := $(CURDIR)/.venv
PY := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

.PHONY: help setup verify clean-venv training kit

help:
	@echo "make setup      루트 .venv (Python 3.12) 생성 + 전체 의존성 설치"
	@echo "make verify     환경 점검 — 인터프리터·주요 패키지·Swift 툴체인"
	@echo ""
	@echo "영역별:"
	@echo "  cd training          && make help   게이트 모델 학습·평가"
	@echo "  cd packages/SnapActKit && make help SnapActKit 빌드·테스트"

setup:
	@test -x $(PYTHON312) || { echo "python3.12 를 찾지 못했습니다: $(PYTHON312)"; \
		echo "brew install python@3.12 하거나 PYTHON312=... 로 경로를 넘기세요."; exit 1; }
	$(PYTHON312) -m venv $(VENV)
	$(PIP) install -q --upgrade pip
	$(PIP) install -r requirements.txt
	@echo ""
	@echo "완료. $(PY)"

verify:
	@printf "python      : "; $(PY) --version 2>/dev/null || echo "없음 — make setup 먼저"
	@printf "packages    : "; $(PY) -c "import torch,torchvision,coremltools,openpyxl,numpy; \
		print('torch',torch.__version__,'| coremltools',coremltools.__version__,'| openpyxl',openpyxl.__version__)" 2>/dev/null \
		| tail -1 || echo "불완전 — make setup 먼저"
	@printf "torch mps   : "; $(PY) -c "import torch;print('사용 가능' if torch.backends.mps.is_available() else '사용 불가')" 2>/dev/null || echo "-"
	@$(MAKE) -s -C packages/SnapActKit doctor 2>/dev/null || echo "swift       : packages/SnapActKit 점검 실패"

# 1.1GB 이상을 지웁니다. 되돌리려면 make setup.
clean-venv:
	rm -rf $(VENV)
