from pydantic_settings import BaseSettings
from decouple import config

class Settings(BaseSettings):
    db_user: str = config('DB_USER', default='postgres')
    db_password: str = config('DB_PASSWORD', default='')
    db_host: str = config('DB_HOST', default='localhost')
    db_port: int = config('DB_PORT', default=9876, cast=int)
    db_name: str = config('DB_NAME', default='postgres')
    secret_key: str = config('SECRET_KEY', default='dev-secret-key-change-in-production')
    algorithm: str = config('ALGORITHM', default='HS256')
    access_token_expire_minutes: int = config('ACCESS_TOKEN_EXPIRE_MINUTES', default=60, cast=int)
    refresh_token_expire_days: int = config('REFRESH_TOKEN_EXPIRE_DAYS', default=7, cast=int)
    max_login_attempts: int = config('MAX_LOGIN_ATTEMPTS', default=5, cast=int)
    lockout_duration_minutes: int = config('LOCKOUT_DURATION_MINUTES', default=15, cast=int)
    csrf_secret_key: str = config('CSRF_SECRET_KEY', default='dev-csrf-key-change-in-production')
    frontend_url: str = config('FRONTEND_URL', default='http://localhost:3000')
    redis_url: str = config('REDIS_URL', default='')
    environment: str = config('ENVIRONMENT', default='development')
    
    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    @property
    def is_production(self) -> bool:
        return self.environment == 'production'

settings = Settings()