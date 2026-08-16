from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    google_application_credentials: str = ""
    claude_model: str = "claude-sonnet-5"
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

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def db_enabled(self) -> bool:
        return bool(self.db_server and self.db_name and self.db_user and self.db_password)

    @property
    def r2_enabled(self) -> bool:
        return bool(self.r2_account_id and self.r2_access_key_id and self.r2_secret_access_key and self.r2_bucket_name)

    @property
    def vision_enabled(self) -> bool:
        return bool(self.google_application_credentials)

    @property
    def claude_enabled(self) -> bool:
        return bool(self.anthropic_api_key)

    @property
    def wallet_enabled(self) -> bool:
        return bool(self.pass_cert_p12_path) and Path(self.pass_cert_p12_path).is_file()

    @property
    def google_oauth_enabled(self) -> bool:
        return bool(self.google_oauth_client_id and self.google_oauth_client_secret)


settings = Settings()
