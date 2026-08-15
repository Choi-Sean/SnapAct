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

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def vision_enabled(self) -> bool:
        return bool(self.google_application_credentials)

    @property
    def claude_enabled(self) -> bool:
        return bool(self.anthropic_api_key)

    @property
    def wallet_enabled(self) -> bool:
        return bool(self.pass_cert_p12_path) and Path(self.pass_cert_p12_path).is_file()


settings = Settings()
