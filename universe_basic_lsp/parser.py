"""Tree-sitter parser for UniVerse BASIC."""

import ctypes
import platform
from pathlib import Path

from tree_sitter import Language, Parser

_ROOT = Path(__file__).resolve().parent.parent

def _lib_filename() -> str:
    system = platform.system()
    if system == "Darwin":
        return "universe_basic.dylib"
    elif system == "Windows":
        return "universe_basic.dll"
    return "universe_basic.so"


def _load_language() -> Language:
    lib_path = _ROOT / "build" / _lib_filename()
    if not lib_path.exists():
        raise FileNotFoundError(
            f"Compiled grammar not found at {lib_path}. "
            "Run: npx tree-sitter build -o build/universe_basic.dylib"
        )
    lib = ctypes.cdll.LoadLibrary(str(lib_path))
    func = lib.tree_sitter_universe_basic
    func.restype = ctypes.c_void_p
    return Language(func())


LANGUAGE = _load_language()


def create_parser() -> Parser:
    return Parser(LANGUAGE)
