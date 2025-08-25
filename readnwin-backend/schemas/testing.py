from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class TestPaymentResponse(BaseModel):
    success: bool
    transaction_id: str
    amount: float
    currency: str
    status: str
    timestamp: datetime
    test_mode: bool = True

class TestUploadResponse(BaseModel):
    success: bool
    file_name: str
    file_size: int
    mime_type: str
    upload_path: str
    metadata: Dict[str, Any]
    test_mode: bool = True
