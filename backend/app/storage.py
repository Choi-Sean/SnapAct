import boto3
from botocore.client import Config

from .config import settings


def get_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def upload_image(key: str, image_bytes: bytes, content_type: str = "image/jpeg") -> None:
    get_client().put_object(
        Bucket=settings.r2_bucket_name,
        Key=key,
        Body=image_bytes,
        ContentType=content_type,
    )


def get_image(key: str) -> tuple[bytes, str]:
    """Returns (bytes, content_type)."""
    obj = get_client().get_object(Bucket=settings.r2_bucket_name, Key=key)
    return obj["Body"].read(), obj.get("ContentType", "image/jpeg")


def delete_image(key: str) -> None:
    get_client().delete_object(Bucket=settings.r2_bucket_name, Key=key)


def presigned_get_url(key: str, expires_in: int = 3600) -> str:
    """A time-limited URL the client can fetch directly, bypassing our backend's
    own bandwidth for the actual image bytes. The bucket itself stays private."""
    return get_client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.r2_bucket_name, "Key": key},
        ExpiresIn=expires_in,
    )
