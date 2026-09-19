# tools/

## `build_catalog.py`

`docs/SnapAct_클래스별액션_검토.xlsx` → `Sources/SnapActKit/Resources/actions.json`

```bash
make catalog          # 재생성 (packages/SnapActKit 에서)
make catalog-check    # 엑셀이 JSON보다 새로우면 실패
```

`make build` 가 `catalog-check` 를 먼저 돕니다. 스프레드시트를 고치고 재생성을
잊은 채 빌드하면, 코드가 아니라 **데이터가** 조용히 옛 것이 되기 때문입니다.
신선도는 mtime 이 아니라 엑셀 내용의 sha256 으로 판정합니다 — 파일을 열었다
닫기만 해도 mtime 은 바뀝니다.

## 동사 추출은 보수적입니다

`주 액션` / `부 액션` 열은 한글 표시 텍스트이고, 동사가 괄호 안에 있을 때만
(`연락처 추가 (create_contact)`) 뽑습니다. **괄호가 없으면 추측하지 않고**
`unmapped.csv` 에 남깁니다 — 여기서 동사를 잘못 찍으면 남의 캘린더에 잘못된
일을 하는 버튼이 됩니다.

`주 액션` 은 단일 항목이라 `·` 로 쪼개지 않습니다. `부 액션` 만 `·` 구분
목록입니다.

## `unmapped.csv` 를 채우는 방법

`verb` 열을 채우는 것이 아니라, **엑셀 원본의 해당 셀에 괄호로 동사를 적고**
다시 생성하세요. CSV 는 "무엇이 비어 있는가"를 보여주는 리포트이지 입력이
아닙니다. 입력을 두 곳에 두면 갈라집니다.

## `requirements.txt`

`openpyxl` 하나뿐입니다. 카탈로그만 다시 만들 사람이 1GB 짜리 학습 스택을
받지 않아도 되게 일부러 분리했습니다.
