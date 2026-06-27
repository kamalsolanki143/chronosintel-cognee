from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ChronosIntel"
    environment: str = "development"
    database_url: str = "sqlite:///./chronosintel.db"
    frontend_url: str = "http://localhost:5173"
    upload_dir: str = "/storage/uploads"
    processed_dir: str = "/storage/processed"
    report_dir: str = "/storage/reports"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
