import hashlib
import io
import json
import uuid
import zipfile
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.serialization import Encoding, pkcs12
from cryptography.hazmat.primitives.serialization.pkcs7 import PKCS7SignatureBuilder, PKCS7Options

from .config import settings

ASSETS_DIR = Path(__file__).parent / "wallet_assets"
CERTS_DIR = Path(__file__).parent / "certs"


def _pass_json() -> dict:
    return {
        "formatVersion": 1,
        "passTypeIdentifier": settings.pass_type_identifier,
        "teamIdentifier": settings.apple_team_id,
        "organizationName": "Snapsist",
        "description": "Snapsist 데모 패스",
        "serialNumber": str(uuid.uuid4()),
        "backgroundColor": "rgb(37,99,235)",
        "foregroundColor": "rgb(255,255,255)",
        "labelColor": "rgb(255,255,255)",
        "generic": {
            "primaryFields": [{"key": "name", "label": "NAME", "value": "John Smith"}],
            "secondaryFields": [{"key": "title", "label": "TITLE", "value": "Product Manager"}],
            "auxiliaryFields": [{"key": "org", "label": "ORG", "value": "Snapsist Inc."}],
            "backFields": [{"key": "note", "label": "Note", "value": "Snapsist 데모로 생성된 Wallet 패스입니다."}],
        },
        "barcodes": [
            {
                "message": "snapsist-demo-pass",
                "format": "PKBarcodeFormatQR",
                "messageEncoding": "iso-8859-1",
            }
        ],
    }


def _sign_manifest(manifest_bytes: bytes) -> bytes:
    p12_path = Path(settings.pass_cert_p12_path)
    private_key, cert, _ = pkcs12.load_key_and_certificates(
        p12_path.read_bytes(), settings.pass_cert_p12_password.encode("utf-8")
    )
    wwdr_cert = x509.load_der_x509_certificate((CERTS_DIR / "AppleWWDRCAG4.cer").read_bytes())

    return (
        PKCS7SignatureBuilder()
        .set_data(manifest_bytes)
        .add_signer(cert, private_key, hashes.SHA256())
        .add_certificate(wwdr_cert)
        .sign(Encoding.DER, [PKCS7Options.DetachedSignature, PKCS7Options.Binary])
    )


def build_pkpass() -> bytes:
    if not settings.wallet_enabled:
        raise RuntimeError(
            "Pass Type ID 인증서가 설정되지 않았어요 (PASS_CERT_P12_PATH / PASS_CERT_P12_PASSWORD)."
        )

    files = {
        "pass.json": json.dumps(_pass_json()).encode("utf-8"),
        "icon.png": (ASSETS_DIR / "icon.png").read_bytes(),
        "icon@2x.png": (ASSETS_DIR / "icon@2x.png").read_bytes(),
        "icon@3x.png": (ASSETS_DIR / "icon@3x.png").read_bytes(),
        "logo.png": (ASSETS_DIR / "logo.png").read_bytes(),
        "logo@2x.png": (ASSETS_DIR / "logo@2x.png").read_bytes(),
    }

    manifest = {name: hashlib.sha1(content).hexdigest() for name, content in files.items()}
    manifest_bytes = json.dumps(manifest).encode("utf-8")
    signature = _sign_manifest(manifest_bytes)

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, content in files.items():
            zf.writestr(name, content)
        zf.writestr("manifest.json", manifest_bytes)
        zf.writestr("signature", signature)

    return buf.getvalue()
