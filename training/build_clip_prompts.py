"""
MobileCLIP 제로샷 라우터 — 클래스 프롬프트 정의 및 텍스트 임베딩 사전 계산

실행 위치: macOS (텍스트 인코더가 필요하므로)
결과물:    class_embeddings.json  (앱에 번들할 파일, ~80KB)

사전 준비
---------
pip install coremltools numpy open_clip_torch
huggingface-cli download apple/coreml-mobileclip \
    mobileclip_s0_text.mlpackage --local-dir ./models

주의: 텍스트 인코더(85MB)는 이 스크립트에서만 쓰고 앱에는 넣지 않는다.
앱에는 이미지 인코더(~23MB) + 이 스크립트가 만든 JSON(~80KB)만 들어간다.
"""

import json
import numpy as np

# ─────────────────────────────────────────────────────────────────────
# 프롬프트 작성 원칙
#
# 1. 기능이 아니라 "겉모습"을 쓴다.
#    CLIP은 이미지 캡션으로 학습됐다. 사람이 사진 설명으로 쓸 법한 문장이어야 한다.
#    ✗ "a document used for professional networking"
#    ✓ "a photo of a business card"
#
# 2. 우리 내부 용어를 쓰지 않는다.
#    ✗ "device_display"  ✓ "a blood pressure monitor showing numbers"
#
# 3. 클래스당 여러 문장을 쓰고 임베딩을 평균한다 (프롬프트 앙상블).
#    단일 문장보다 안정적이다.
#
# 4. 네거티브(우리 클래스가 아닌 것)를 넉넉히 넣는다.
#    트래픽의 60%+ 가 여기다. 네거티브가 부실하면 전부 억지 분류된다.
# ─────────────────────────────────────────────────────────────────────

CLASSES = {
    # ── A. 정보 보관 ─────────────────────────────────────────────
    "business_card": [
        "a business card with a person's name and job title",
        "a name card showing a phone number and an email address",
        "a small card with a company name and a person's position",
    ],
    "wifi_credentials": [
        "a photo of a sign showing a wifi network name and password",
        "a small card on a cafe table with wifi login information",
        "handwritten wifi password on a note",
    ],
    "appliance_nameplate": [
        "a close-up of a model number label on an appliance",
        "a metal rating plate with serial number on a machine",
        "a silver sticker with product model and voltage information",
    ],
    "care_tag": [
        "a close-up of a clothing care label with washing symbols",
        "a fabric tag sewn inside a garment showing laundry instructions",
    ],
    "book_cover": [
        "a photo of a book cover",
        "the front cover of a book with title and author name",
    ],

    # ── B. 할 일 발생 ────────────────────────────────────────────
    "bill_invoice": [
        "a photo of a utility bill",
        "an invoice showing an amount due and a payment deadline",
        "a printed bill with a bank account number for payment",
    ],
    "event_flyer": [
        "a photo of an event poster",
        "a concert flyer showing a date, time and venue",
        "a printed invitation card for an event",
    ],
    "appointment_slip": [
        "a small printed appointment card from a clinic",
        "a hospital appointment slip showing a date and time",
    ],
    "parking_restriction": [
        "a street parking sign showing restricted hours",
        "a no parking sign with days and times written on it",
        "a parking regulation sign on a pole",
    ],
    "medication": [
        "a photo of a pharmacy medication package with dosage instructions",
        "a prescription drug envelope with printed directions",
        "a medicine box showing how many times a day to take it",
    ],
    "delivery_notice": [
        "a delivery notice slip left by a courier",
        "a shipping label with a tracking number and barcode",
    ],
    "schedule_table": [
        "a printed timetable with rows and columns of times",
        "a weekly class schedule grid",
        "a work shift roster table",
    ],
    "ticket_boarding_pass": [
        "a photo of a printed event ticket",
        "an airline boarding pass with seat and gate number",
    ],
    "gift_card_voucher": [
        "a paper voucher printed with a redemption code and an expiry date",
        "a store coupon showing a discount amount and valid until date",
    ],
    "warranty_doc": [
        "a printed warranty certificate for a product",
    ],
    "plant_care_tag": [
        "a small plastic plant label stuck in a pot with care instructions",
    ],

    # ── C. 증빙 축적 ─────────────────────────────────────────────
    "receipt": [
        "a photo of a paper receipt",
        "a long narrow printed store receipt with prices",
        "a crumpled cash register receipt on a table",
    ],
    "device_display": [
        "a close-up of a blood pressure monitor showing numbers",
        "a digital scale display showing a weight reading",
        "a glucose meter screen with a number on it",
        "a medical device with a seven segment digital readout",
    ],
    "nutrition_label": [
        "a close-up of a nutrition facts label on food packaging",
        "a nutrition information table printed on a package",
    ],
    "document_general": [
        "a printed page with neat typed paragraphs",
        "a formal typed letter on white paper",
    ],
    "workout_display": [
        "a treadmill console screen showing distance and calories",
        "an exercise machine display with workout statistics",
    ],

    # ── D. 이해 필요 ─────────────────────────────────────────────
    "error_screen": [
        "a screen showing an error message",
        "a computer screen displaying an error code",
        "an appliance display showing a fault code",
    ],
    "menu": [
        "a photo of a restaurant menu",
        "a printed food menu with dish names and prices",
    ],
    "foreign_sign": [
        "a photo of a sign with text in a foreign language",
        "a public information sign with written instructions",
    ],
    "transit_sign": [
        "a bus stop sign showing route numbers",
        "a subway station sign with line information",
    ],
    "business_hours": [
        "a sign on a shop door showing opening hours",
        "a printed list of business hours by day of the week",
    ],
    "instruction_manual": [
        "a page from an instruction manual with numbered steps",
        "an assembly guide page with diagrams",
    ],

    # ── E. 구매 검토 ─────────────────────────────────────────────
    "price_tag": [
        "a close-up of a price tag on a store shelf",
        "a retail price label showing cost per unit",
    ],
    "product_packaging": [
        "a photo of a product package on a shelf",
        "a consumer product box with brand name",
    ],
    "wine_label": [
        "a close-up of a wine bottle label",
    ],

    # ── 노트 / 학습 ──────────────────────────────────────────────
    "handwritten_note": [
        "a page covered in handwriting with uneven lines",
        "a whiteboard with marker writing and sketches",
        "handwritten cursive notes in a notebook",
    ],
    "lecture_slide": [
        "a photo of a projected presentation slide",
        "a lecture slide on a screen in a classroom",
    ],
    "code_screenshot": [
        "a screenshot of source code in a text editor",
        "a terminal window showing code",
    ],

    # ── 스크린샷 계열 ────────────────────────────────────────────
    # EXIF 스크린샷 플래그와 조합해서 쓴다. CLIP 단독 판정은 약하다.
    "profile_screenshot": [
        "a profile page screenshot showing a person's name and bio",
        "a contact profile screen with a username and profile picture",
    ],
    "booking_screenshot": [
        "a screenshot of a reservation confirmation",
        "a hotel or flight booking confirmation screen",
    ],
    "chat_screenshot": [
        "a text conversation with multiple speech bubbles",
        "a chat log of messages exchanged between two people",
    ],
    "payment_screenshot": [
        "a screenshot of a money transfer confirmation",
        "a mobile banking payment completion screen",
    ],
}

# ─────────────────────────────────────────────────────────────────────
# 네거티브 — 우리 클래스가 아닌 것
#
# 이게 부실하면 반려동물 사진이 명함으로 분류된다.
# 실제 사진첩 분포를 생각해서 넉넉히 넣는다.
# ─────────────────────────────────────────────────────────────────────

NEGATIVES = {
    "neg_food": [
        "a photo of a plate of food",
        "a close-up of a meal on a table",
        "a photo of a drink in a cup",
    ],
    "neg_person": [
        "a photo of a person",
        "a selfie",
        "a group photo of people smiling",
    ],
    "neg_animal": [
        "a photo of a dog",
        "a photo of a cat",
        "a photo of a pet animal",
    ],
    "neg_scenery": [
        "a landscape photograph",
        "a photo of a building exterior",
        "a photo of the sky and clouds",
        "a photo of a street scene",
    ],
    "neg_object": [
        "a photo of an everyday object",
        "a photo of furniture in a room",
        "a photo of a vehicle",
    ],
    "neg_plant": [
        "a photo of a plant",
        "a photo of flowers",
    ],
    "neg_screenshot_other": [
        "a screenshot of a video playing",
        "a screenshot of a news article body text",
        "a screenshot of a game screen",
        "a screenshot of a phone home screen with app icons",
    ],
    "neg_card_other": [
        # business_card 오분류 방지에 가장 중요한 네거티브
        "a plastic membership card with a barcode and no contact information",
        "a transit card showing only a logo and a card number",
        "a loyalty point card with a magnetic stripe",
    ],
}

# ─────────────────────────────────────────────────────────────────────
# CLIP만으로는 원리적으로 못 가르는 쌍 — OCR 이후 텍스트로 정정한다
# ─────────────────────────────────────────────────────────────────────

NEEDS_OCR_ARBITRATION = {
    "receipt": ["bill_invoice"],          # 과거 날짜 vs 미래 날짜 + 계좌번호
    "bill_invoice": ["receipt"],
    "document_general": ["warranty_doc", "instruction_manual"],
    "device_display": ["workout_display"],
    "appointment_slip": ["booking_screenshot"],
}

# 스크린샷 플래그(EXIF)로 보정되는 클래스
SCREENSHOT_BIASED = [
    "profile_screenshot", "booking_screenshot", "chat_screenshot",
    "payment_screenshot", "code_screenshot", "error_screen",
    "neg_screenshot_other",
]


def _get_tokenizer():
    """
    CLIP BPE 토크나이저를 확보한다. MobileCLIP은 표준 CLIP 어휘를 쓰므로
    아래 중 무엇을 써도 결과가 같다. 설치돼 있는 것을 자동으로 고른다.
    반환: list[str] -> np.ndarray (N x 77, int32)
    """
    # 1) open_clip
    try:
        import open_clip
        tok = open_clip.get_tokenizer("ViT-B-16")
        def run(prompts):
            return tok(prompts).numpy().astype(np.int32)
        print("토크나이저: open_clip")
        return run
    except ImportError:
        pass

    # 2) transformers
    try:
        from transformers import CLIPTokenizerFast
        tok = CLIPTokenizerFast.from_pretrained("openai/clip-vit-base-patch16")
        def run(prompts):
            out = tok(prompts, padding="max_length", max_length=77,
                      truncation=True, return_tensors="np")
            return out["input_ids"].astype(np.int32)
        print("토크나이저: transformers")
        return run
    except ImportError:
        pass

    # 3) clip-anytorch / OpenAI clip
    try:
        import clip as openai_clip
        def run(prompts):
            return openai_clip.tokenize(prompts).numpy().astype(np.int32)
        print("토크나이저: clip")
        return run
    except ImportError:
        pass

    raise SystemExit(
        "CLIP 토크나이저가 없습니다. 아래 중 하나를 설치하세요.\n"
        "  pip install open_clip_torch      (권장, torch 이미 있으면 가벼움)\n"
        "  pip install transformers         (vocab을 HF에서 받음)\n"
        "  pip install clip-anytorch"
    )


def build_embeddings(text_encoder_path: str, out_path: str):
    import coremltools as ct

    model = ct.models.MLModel(text_encoder_path)
    tokenize = _get_tokenizer()

    all_groups = {**CLASSES, **NEGATIVES}
    output = {}

    for name, prompts in all_groups.items():
        vectors = []
        for p in prompts:
            tokens = tokenize([p])  # 1 x 77 int32
            result = model.predict({"text": tokens})
            vec = np.array(result["final_emb_1"]).reshape(-1)
            vec = vec / np.linalg.norm(vec)
            vectors.append(vec)

        # 프롬프트 앙상블: 평균 후 재정규화
        mean = np.mean(vectors, axis=0)
        mean = mean / np.linalg.norm(mean)

        output[name] = {
            "embedding": [round(float(x), 6) for x in mean],
            "isNegative": name.startswith("neg_"),
            "promptCount": len(prompts),
            "needsOCRArbitration": NEEDS_OCR_ARBITRATION.get(name, []),
            "screenshotBiased": name in SCREENSHOT_BIASED,
        }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({
            "model": "mobileclip_s0",
            "dim": len(next(iter(output.values()))["embedding"]),
            "classes": output,
        }, f, ensure_ascii=False)

    n_pos = sum(1 for v in output.values() if not v["isNegative"])
    n_neg = len(output) - n_pos
    print(f"저장: {out_path}")
    print(f"클래스 {n_pos}개 + 네거티브 {n_neg}개")


def evaluate(embeddings_path: str, image_encoder_path: str, photo_dir: str):
    """
    본인 사진으로 제로샷 정확도를 빠르게 확인한다.
    photo_dir 구조:  photo_dir/<클래스명>/*.jpg
    """
    import coremltools as ct
    from PIL import Image
    import os

    with open(embeddings_path, encoding="utf-8") as f:
        data = json.load(f)
    names = list(data["classes"].keys())
    matrix = np.array([data["classes"][n]["embedding"] for n in names])

    img_model = ct.models.MLModel(image_encoder_path)

    correct = total = 0
    for label in os.listdir(photo_dir):
        d = os.path.join(photo_dir, label)
        if not os.path.isdir(d):
            continue
        for fn in os.listdir(d):
            if not fn.lower().endswith((".jpg", ".jpeg", ".png", ".heic")):
                continue
            img = Image.open(os.path.join(d, fn)).convert("RGB").resize((256, 256))
            result = img_model.predict({"image": img})
            vec = np.array(result["final_emb_1"]).reshape(-1)
            vec = vec / np.linalg.norm(vec)

            scores = matrix @ vec
            order = np.argsort(-scores)
            top = names[order[0]]

            total += 1
            correct += (top == label)
            mark = "O" if top == label else "X"
            print(f"{mark} {label:24s} → {top:24s} {scores[order[0]]:.3f}  "
                  f"(2위 {names[order[1]]} {scores[order[1]]:.3f})")

    print(f"\n정확도 {correct}/{total} = {correct/total:.1%}" if total else "사진 없음")


if __name__ == "__main__":
    import sys
    from pathlib import Path

    # 경로는 이 파일 위치 기준으로 고정한다. 예전에는 cwd 상대 경로라
    # 리포 루트에서만 돌았고, 그 탓에 스크립트 사본이 여러 벌 생겼다.
    REPO = Path(__file__).resolve().parents[1]
    RESOURCES = REPO / "packages/SnapActKit/Sources/SnapActKit/Resources"

    # 이미지 인코더는 앱에 번들되므로 패키지 Resources 안에 있고,
    # 텍스트 인코더(81MB)는 이 스크립트에서만 쓰므로 models/ 에 남아
    # git 에서 제외된다. 둘이 다른 곳에 있는 것이 그 구분을 구조로 만든다.
    IMAGE_ENCODER = RESOURCES / "mobileclip_s0_image.mlpackage"
    TEXT_ENCODER = REPO / "models/mobileclip_s0_text.mlpackage"
    EMBEDDINGS = RESOURCES / "class_embeddings.json"

    if len(sys.argv) > 1 and sys.argv[1] == "eval":
        evaluate(str(EMBEDDINGS), str(IMAGE_ENCODER), sys.argv[2])
    else:
        if not TEXT_ENCODER.exists():
            sys.exit(
                f"텍스트 인코더가 없습니다: {TEXT_ENCODER}\n"
                "git 에 넣지 않는 파일입니다. 아래로 받으세요:\n"
                "  huggingface-cli download apple/coreml-mobileclip "
                "mobileclip_s0_text.mlpackage --local-dir ./models"
            )
        build_embeddings(str(TEXT_ENCODER), str(EMBEDDINGS))
