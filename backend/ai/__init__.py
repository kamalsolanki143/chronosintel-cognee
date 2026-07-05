"""ChronosIntel — backend-facing bridge to the top-level ai package."""

from __future__ import annotations

from pathlib import Path
from pkgutil import extend_path

__path__ = extend_path(__path__, __name__)  # type: ignore[name-defined]

_root_ai = Path(__file__).resolve().parents[2] / "ai"
_root_ai_str = str(_root_ai)
if _root_ai.exists() and _root_ai_str not in __path__:
    __path__.append(_root_ai_str)
