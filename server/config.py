import os
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

@dataclass
class OpenAIConfig:
    api_key: str
    model: str = "gpt-4"
    temperature: float = 0.7
    max_tokens: int = 2048
    timeout: int = 30

@dataclass
class NLWebConfig:
    server_host: str = "0.0.0.0"
    server_port: int = 5000
    vector_db: str = "memory"
    embedding_model: str = "text-embedding-ada-002"
    mcp_enabled: bool = True

@dataclass
class ErrorHandlingConfig:
    retry_attempts: int = 3
    timeout: int = 30
    backoff_strategy: str = "exponential"
    enable_fallback: bool = True

class Config:
    def __init__(self):
        # OpenAI Configuration
        self.openai = OpenAIConfig(
            api_key=os.getenv("OPENAI_API_KEY", ""),
            model=os.getenv("OPENAI_MODEL", "gpt-4"),
            temperature=float(os.getenv("OPENAI_TEMPERATURE", "0.7")),
            max_tokens=int(os.getenv("OPENAI_MAX_TOKENS", "2048")),
            timeout=int(os.getenv("OPENAI_TIMEOUT", "30"))
        )
        
        # NLWeb Configuration  
        self.nlweb = NLWebConfig(
            server_host=os.getenv("NLWEB_HOST", "0.0.0.0"),
            server_port=int(os.getenv("NLWEB_PORT", "5000")),
            vector_db=os.getenv("VECTOR_DB", "memory"),
            embedding_model=os.getenv("EMBEDDING_MODEL", "text-embedding-ada-002"),
            mcp_enabled=os.getenv("MCP_ENABLED", "true").lower() == "true"
        )
        
        # Error Handling Configuration
        self.error_handling = ErrorHandlingConfig(
            retry_attempts=int(os.getenv("RETRY_ATTEMPTS", "3")),
            timeout=int(os.getenv("REQUEST_TIMEOUT", "30")),
            backoff_strategy=os.getenv("BACKOFF_STRATEGY", "exponential"),
            enable_fallback=os.getenv("ENABLE_FALLBACK", "true").lower() == "true"
        )
        
    def validate(self):
        """Validate configuration"""
        if not self.openai.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        if self.openai.temperature < 0 or self.openai.temperature > 1:
            raise ValueError("OpenAI temperature must be between 0 and 1")
            
        if self.openai.max_tokens < 1 or self.openai.max_tokens > 4000:
            raise ValueError("OpenAI max_tokens must be between 1 and 4000")

config = Config()
