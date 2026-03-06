"""Tests for the parse tree analyzer."""

import pytest
from lsprotocol import types

from universe_basic_lsp.analyzer import analyze
from universe_basic_lsp.parser import create_parser


@pytest.fixture
def parser():
    return create_parser()


def get_analysis(parser, source: str):
    tree = parser.parse(source.encode("utf-8"))
    return analyze(tree)


class TestDiagnostics:
    def test_no_errors(self, parser):
        result = get_analysis(parser, 'PRINT "Hello"\n')
        assert result.diagnostics == []

    def test_syntax_error(self, parser):
        result = get_analysis(parser, "IF THEN THEN\n")
        assert len(result.diagnostics) > 0
        assert result.diagnostics[0].severity == types.DiagnosticSeverity.Error

    def test_clean_program(self, parser):
        source = "PROGRAM TEST\nX = 1\nPRINT X\nEND\n"
        result = get_analysis(parser, source)
        assert result.diagnostics == []


class TestSymbols:
    def test_program_symbol(self, parser):
        result = get_analysis(parser, "PROGRAM MY.PROG\n")
        names = [s.name for s in result.symbols]
        assert "MY.PROG" in names
        sym = next(s for s in result.symbols if s.name == "MY.PROG")
        assert sym.kind == types.SymbolKind.Module

    def test_subroutine_symbol(self, parser):
        result = get_analysis(parser, "SUBROUTINE MY.SUB(A)\n   RETURN\nEND\n")
        names = [s.name for s in result.symbols]
        assert "MY.SUB" in names
        sym = next(s for s in result.symbols if s.name == "MY.SUB")
        assert sym.kind == types.SymbolKind.Function

    def test_variable_symbol(self, parser):
        result = get_analysis(parser, "X = 42\n")
        names = [s.name for s in result.symbols]
        assert "X" in names
        sym = next(s for s in result.symbols if s.name == "X")
        assert sym.kind == types.SymbolKind.Variable

    def test_equate_symbol(self, parser):
        result = get_analysis(parser, "EQUATE TRUE TO 1\n")
        names = [s.name for s in result.symbols]
        assert "TRUE" in names
        sym = next(s for s in result.symbols if s.name == "TRUE")
        assert sym.kind == types.SymbolKind.Constant

    def test_dim_symbol(self, parser):
        result = get_analysis(parser, "DIM ARR(10)\n")
        names = [s.name for s in result.symbols]
        assert "ARR" in names
        sym = next(s for s in result.symbols if s.name == "ARR")
        assert sym.kind == types.SymbolKind.Array

    def test_multiple_symbols(self, parser):
        source = "PROGRAM TEST\nX = 1\nY = 2\nEQUATE PI TO 3.14\nEND\n"
        result = get_analysis(parser, source)
        names = [s.name for s in result.symbols]
        assert "TEST" in names
        assert "X" in names
        assert "Y" in names
        assert "PI" in names


class TestDefinitions:
    def test_label_definition(self, parser):
        source = "GOTO DONE\nDONE:\nEND\n"
        result = get_analysis(parser, source)
        assert "DONE" in result.definitions
        defs = result.definitions["DONE"]
        assert len(defs) >= 1

    def test_numeric_label_definition(self, parser):
        source = "GOSUB 100\n100:\n   CRT \"here\"\n   RETURN\n"
        result = get_analysis(parser, source)
        assert "100" in result.definitions

    def test_variable_definition(self, parser):
        source = "NAME = \"John\"\n"
        result = get_analysis(parser, source)
        assert "NAME" in result.definitions
        assert len(result.definitions["NAME"]) == 1

    def test_multiple_assignments(self, parser):
        source = "X = 1\nX = 2\n"
        result = get_analysis(parser, source)
        assert "X" in result.definitions
        assert len(result.definitions["X"]) == 2

    def test_subroutine_definition(self, parser):
        source = "SUBROUTINE MY.SUB(A)\n   RETURN\nEND\n"
        result = get_analysis(parser, source)
        assert "MY.SUB" in result.definitions

    def test_equate_definition(self, parser):
        source = "EQUATE TRUE TO 1\n"
        result = get_analysis(parser, source)
        assert "TRUE" in result.definitions

    def test_case_insensitive_lookup(self, parser):
        source = "name = \"John\"\n"
        result = get_analysis(parser, source)
        # Definitions stored uppercase
        assert "NAME" in result.definitions


class TestExampleFiles:
    def test_hello_bas_symbols(self, parser):
        with open("examples/hello.bas") as f:
            source = f.read()
        result = get_analysis(parser, source)
        assert result.diagnostics == []
        assert len(result.symbols) > 0
        names = [s.name for s in result.symbols]
        assert "HELLO.WORLD" in names

    def test_hello_bas_definitions(self, parser):
        with open("examples/hello.bas") as f:
            source = f.read()
        result = get_analysis(parser, source)
        assert "100" in result.definitions
        assert "DONE" in result.definitions
        assert "NAME" in result.definitions

    def test_subroutine_bas_symbols(self, parser):
        with open("examples/subroutine.bas") as f:
            source = f.read()
        result = get_analysis(parser, source)
        assert result.diagnostics == []
        names = [s.name for s in result.symbols]
        assert "MY.SUB" in names
