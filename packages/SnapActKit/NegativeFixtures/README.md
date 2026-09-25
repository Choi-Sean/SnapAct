# NegativeFixtures/

빌드에 포함되지 않는 스니펫들입니다. SPM 은 `Sources/` 와 `Tests/` 아래만
컴파일하므로 이 디렉터리는 무시됩니다.

`CompileGuardTests` 가 각 파일을 `swiftc -typecheck` 로 따로 컴파일해서,
`mustFail_*` 는 **실패해야** 통과하고 `mustCompile_*` 는 **성공해야** 통과합니다.

`mustCompile_` 양성 대조군이 핵심입니다. 없으면 swiftc 호출이 틀렸을 때
모든 파일이 "컴파일 실패"해서 테스트가 공허하게 전부 통과합니다.
