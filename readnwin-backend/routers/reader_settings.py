from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User

class ReaderSettings(BaseModel):
    fontSize: int = 16
    fontFamily: str = "Inter"
    lineHeight: float = 1.6
    theme: str = "light"
    readingWidth: int = 70
    marginHorizontal: int = 20
    marginVertical: int = 20
    autoTheme: bool = False
    textAlign: str = "left"
    columnCount: int = 1

class TTSSettings(BaseModel):
    enabled: bool = False
    rate: float = 1.0
    pitch: float = 1.0
    volume: float = 0.8
    highlightCurrentSentence: bool = True
    autoPlay: bool = False

router = APIRouter(prefix="/reader", tags=["reader-settings"])

@router.get("/settings")
async def get_reader_settings(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get user's reader settings"""
    # Return default settings for now
    return {
        "settings": ReaderSettings().dict(),
        "ttsSettings": TTSSettings().dict()
    }

@router.post("/settings")
async def update_reader_settings(
    settings: ReaderSettings,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update user's reader settings"""
    # Store settings (would be saved to user preferences table)
    return {
        "success": True,
        "settings": settings.dict()
    }

@router.post("/tts-settings")
async def update_tts_settings(
    tts_settings: TTSSettings,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update text-to-speech settings"""
    return {
        "success": True,
        "ttsSettings": tts_settings.dict()
    }