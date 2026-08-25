from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    google_application_credentials: str = ""
    google_application_credentials_json: str = ""
    # L5c only (see claude_analysis.py's header) — the last-resort cloud LLM
    # rung, reached only when cheaper layers can't resolve a photo.
    anthropic_api_key: str = ""
    # Structured field extraction from a clearly-photographed card/receipt
    # isn't a task that needs frontier-model reasoning, and Sonnet's extra
    # latency (3-5s server-side alone, before the phone's own upload time)
    # was the actual complaint -- Haiku is built for exactly this kind of
    # fast, cheap, well-defined extraction and should cut that meaningfully.
    # Override via CLAUDE_MODEL if quality ever needs to trade back up.
    claude_model: str = "claude-haiku-4-5-20251001"
    api_shared_secret: str = ""

    apple_team_id: str = "S8G28N4M49"
    pass_type_identifier: str = "pass.com.snapact.app"
    pass_cert_p12_path: str = ""
    pass_cert_p12_password: str = ""

    jwt_secret: str = ""
    google_oauth_client_id: str = ""
    google_oauth_client_secret: str = ""

    db_server: str = ""
    db_name: str = ""
    db_user: str = ""
    db_password: str = ""

    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""

    # Web-only checkout (never in-app — see payments.py's header) for token
    # top-ups. stripe_webhook_secret is set after the endpoint is deployed
    # and registered in the Stripe dashboard, so it's blank until then.
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    web_base_url: str = "https://snapsist.app"

    # Abuse/cost protection. The mobile app's API_SHARED_SECRET ships inside
    # the public JS bundle, so it can't be treated as a real secret — anyone
    # can extract it and script calls straight to the API. These limits are
    # the actual backstop against a runaway Vision bill until real
    # per-account auth + quotas are required.
    analyze_rate_limit_per_hour: int = 30
    auth_rate_limit_per_hour: int = 10
    daily_real_analyze_cap: int = 300

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def db_enabled(self) -> bool:
        return bool(self.db_server and self.db_name and self.db_user and self.db_password)

    @property
    def r2_enabled(self) -> bool:
        return bool(self.r2_account_id and self.r2_access_key_id and self.r2_secret_access_key and self.r2_bucket_name)

    @property
    def vision_enabled(self) -> bool:
        return bool(self.google_application_credentials or self.google_application_credentials_json)

    @property
    def claude_enabled(self) -> bool:
        return bool(self.anthropic_api_key)

    @property
    def wallet_enabled(self) -> bool:
        return bool(self.pass_cert_p12_path) and Path(self.pass_cert_p12_path).is_file()

    @property
    def google_oauth_enabled(self) -> bool:
        return bool(self.google_oauth_client_id and self.google_oauth_client_secret)

    @property
    def stripe_enabled(self) -> bool:
        return bool(self.stripe_secret_key)


settings = Settings()
