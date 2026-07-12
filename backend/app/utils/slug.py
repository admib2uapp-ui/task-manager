from __future__ import annotations

import re
import secrets

_slug_re = re.compile(r"[^a-z0-9]+")


def slugify(value: str) -> str:
    slug = _slug_re.sub("-", value.strip().lower()).strip("-")
    return slug or "workspace"


def unique_slug(value: str) -> str:
    """Append a short random suffix to keep slugs collision-resistant."""
    return f"{slugify(value)}-{secrets.token_hex(3)}"
