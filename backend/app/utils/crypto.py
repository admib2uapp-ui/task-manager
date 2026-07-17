from __future__ import annotations

import base64
import hashlib
import secrets

from cryptography.fernet import Fernet

from app.core.config import settings


def _derive_key() -> bytes:
    material = settings.JWT_SECRET_KEY.encode("utf-8")
    digest = hashlib.sha256(material).digest()
    return base64.urlsafe_b64encode(digest)


_fernet = Fernet(_derive_key())


def encrypt_token(raw: str) -> str:
    return _fernet.encrypt(raw.encode("utf-8")).decode("utf-8")


def decrypt_token(encrypted: str) -> str:
    return _fernet.decrypt(encrypted.encode("utf-8")).decode("utf-8")
