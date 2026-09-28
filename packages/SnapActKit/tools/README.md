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

## 동사가 정해지는 두 경로

1. **엑셀 셀의 괄호** — `연락처 추가 (create_contact)`.
   한 셀에 둘이면 `(create_event + create_reminder)` 처럼 `+` 로 잇습니다.
2. **`verb_aliases.json`** — 괄호가 없는 표시 텍스트를 동사로 옮기는 대응표.

둘이 갈라지지 않는 이유: **엑셀은 "어떤 클래스에 어떤 액션이 붙는가"를 정하고,
별칭 파일은 "그 표시 텍스트가 어느 API 인가"만 정합니다.** 서로 다른 사실입니다.
"금액 복사"·"모델명 복사"·"코드 복사"는 전부 같은 `copy_text` 라서, 셀마다 적으면
같은 사실을 14번 쓰게 됩니다.

### 별칭은 패턴이 아니라 정확한 문자열입니다

정규식 12개면 111셀 중 85개를 덮었지만 **최소 4건이 틀렸습니다**:

| 표시 텍스트 | 패턴의 답 | 실제 |
|---|---|---|
| `캘린더 일정 + 사전 알림` | `create_reminder` | `create_event` + `create_reminder` |
| `개별 항목 선택 추가` | `save_note` | `create_event` (일정 다중 생성) |
| `잔액 조회 링크` | `search` | `open_url` |
| `1회 제공량 환산` | `convert_currency` | 통화가 아니라 영양 계산 |

정확 표는 처음 보는 문자열에 조용히 오답을 내는 대신 미매핑으로 떨어뜨립니다.
그쪽이 여기서 원하는 실패 방식입니다 — 동사를 잘못 찍으면 남의 캘린더에 잘못된
일을 하는 버튼이 됩니다.

### `·` 규칙

`부 액션` 은 `·` 구분 목록이지만, **공백이 있을 때만** 구분자입니다.
`서점·도서관 검색` 은 하나의 액션이고 `서점` + `도서관 검색` 이 아닙니다.
`주 액션` 은 단일 항목이라 아예 쪼개지 않습니다.

## `unmapped.csv`

남은 미결정 항목의 리포트입니다. `proposed` 열에 선택지가 있습니다.
**CSV 를 고치지 마세요** — 결정하면 `verb_aliases.json` 의 `open` 에서
`approved` 로 옮기고 다시 생성합니다. 입력은 한 곳입니다.

## `requirements.txt`

`openpyxl` 하나뿐입니다. 카탈로그만 다시 만들 사람이 1GB 짜리 학습 스택을
받지 않아도 되게 일부러 분리했습니다.
