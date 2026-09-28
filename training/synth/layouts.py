"""Template interface + dummy templates.  [인터페이스만 정의 — 실제 템플릿은 직접 제작 예정]

A template describes WHERE things go on a document, not what they say. The
generator fills the slots with random text/photos, then augment.py distorts
the whole rendered image.

    @dataclass
    class Slot:
        box: tuple[int, int, int, int]   # x, y, w, h in template pixel space
        kind: Literal["text", "photo", "barcode", "logo", "mrz"]
        font_scale: float = 1.0

    @dataclass
    class Template:
        name: str              # e.g. "kr_drivers_license_v1"
        gate_class: str        # must be one of gate.classes.BLOCKING_CLASSES
        size: tuple[int, int]
        background: str        # path under synth/templates/
        slots: list[Slot]

Dummy templates below keep the pipeline runnable end-to-end today; replacing
them changes no other file.
"""
