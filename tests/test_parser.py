"""Tests for the tree-sitter parser."""

import pytest

from universe_basic_lsp.parser import create_parser


@pytest.fixture
def parser():
    return create_parser()


def parse(parser, source: str):
    return parser.parse(source.encode("utf-8"))


class TestBasicParsing:
    def test_empty_program(self, parser):
        tree = parse(parser, "")
        assert tree.root_node.type == "source_file"
        assert not tree.root_node.has_error

    def test_program_statement(self, parser):
        tree = parse(parser, "PROGRAM MY.PROG\n")
        assert not tree.root_node.has_error
        stmt = tree.root_node.children[0]  # statement_line
        assert stmt.type == "statement_line"

    def test_print_string(self, parser):
        tree = parse(parser, 'PRINT "Hello"\n')
        assert not tree.root_node.has_error

    def test_assignment(self, parser):
        tree = parse(parser, 'X = 42\n')
        assert not tree.root_node.has_error

    def test_string_assignment(self, parser):
        tree = parse(parser, 'NAME = "John"\n')
        assert not tree.root_node.has_error

    def test_case_insensitive(self, parser):
        for kw in ["print", "Print", "PRINT", "pRiNt"]:
            tree = parse(parser, f'{kw} "Hello"\n')
            assert not tree.root_node.has_error, f"Failed for keyword: {kw}"


class TestControlFlow:
    def test_single_line_if(self, parser):
        tree = parse(parser, 'IF X > 0 THEN PRINT "positive"\n')
        assert not tree.root_node.has_error

    def test_single_line_if_else(self, parser):
        tree = parse(parser, 'IF X > 0 THEN PRINT "yes" ELSE PRINT "no"\n')
        assert not tree.root_node.has_error

    def test_multiline_if(self, parser):
        source = "IF X > 0 THEN\n   PRINT X\nEND\n"
        tree = parse(parser, source)
        assert not tree.root_node.has_error

    def test_multiline_if_else(self, parser):
        source = "IF X > 0 THEN\n   PRINT X\nEND ELSE\n   PRINT 0\nEND\n"
        tree = parse(parser, source)
        assert not tree.root_node.has_error

    def test_for_loop(self, parser):
        source = "FOR I = 1 TO 10\n   PRINT I\nNEXT I\n"
        tree = parse(parser, source)
        assert not tree.root_node.has_error

    def test_for_loop_step(self, parser):
        source = "FOR I = 1 TO 10 STEP 2\n   PRINT I\nNEXT I\n"
        tree = parse(parser, source)
        assert not tree.root_node.has_error

    def test_loop_repeat(self, parser):
        source = "LOOP\n   X += 1\nWHILE X < 10 DO\n   CRT X\nREPEAT\n"
        tree = parse(parser, source)
        assert not tree.root_node.has_error

    def test_begin_case(self, parser):
        source = "BEGIN CASE\n   CASE X < 0\n      CRT \"neg\"\n   CASE 1\n      CRT \"other\"\nEND CASE\n"
        tree = parse(parser, source)
        assert not tree.root_node.has_error

    def test_goto(self, parser):
        tree = parse(parser, "GOTO 100\n")
        assert not tree.root_node.has_error

    def test_gosub(self, parser):
        tree = parse(parser, "GOSUB MYLAB\n")
        assert not tree.root_node.has_error


class TestDeclarations:
    def test_subroutine(self, parser):
        source = "SUBROUTINE MY.SUB(A, B)\n   CRT A\n   RETURN\nEND\n"
        tree = parse(parser, source)
        assert not tree.root_node.has_error

    def test_equate(self, parser):
        tree = parse(parser, "EQUATE TRUE TO 1\n")
        assert not tree.root_node.has_error

    def test_dim(self, parser):
        tree = parse(parser, "DIM ARR(10)\n")
        assert not tree.root_node.has_error

    def test_common(self, parser):
        tree = parse(parser, "COMMON /BLK/ A, B, C\n")
        assert not tree.root_node.has_error


class TestExpressions:
    def test_arithmetic(self, parser):
        tree = parse(parser, "X = 1 + 2 * 3\n")
        assert not tree.root_node.has_error

    def test_string_concat(self, parser):
        tree = parse(parser, 'X = "hello" : " " : "world"\n')
        assert not tree.root_node.has_error

    def test_comparison(self, parser):
        tree = parse(parser, "IF X < 10 THEN CRT X\n")
        assert not tree.root_node.has_error

    def test_dynamic_array_access(self, parser):
        tree = parse(parser, "X = REC<1>\n")
        assert not tree.root_node.has_error

    def test_dynamic_array_multi(self, parser):
        tree = parse(parser, "X = REC<2,1>\n")
        assert not tree.root_node.has_error

    def test_dynamic_array_assign(self, parser):
        tree = parse(parser, 'REC<1> = "value"\n')
        assert not tree.root_node.has_error

    def test_array_access(self, parser):
        tree = parse(parser, "X = ARR(1)\n")
        assert not tree.root_node.has_error

    def test_function_call(self, parser):
        tree = parse(parser, "X = LEN(NAME)\n")
        assert not tree.root_node.has_error

    def test_function_call_multi_args(self, parser):
        tree = parse(parser, 'X = INDEX(NAME, "o", 1)\n')
        assert not tree.root_node.has_error


class TestFileIO:
    def test_open(self, parser):
        tree = parse(parser, 'OPEN "", "CUSTOMERS" TO F.CUST ELSE STOP\n')
        assert not tree.root_node.has_error

    def test_read_then_else(self, parser):
        source = 'READ REC FROM F.CUST, "001" THEN\n   CRT REC\nEND ELSE\n   CRT "Not found"\nEND\n'
        tree = parse(parser, source)
        assert not tree.root_node.has_error

    def test_write(self, parser):
        tree = parse(parser, 'WRITE REC TO F.CUST, "001"\n')
        assert not tree.root_node.has_error

    def test_delete(self, parser):
        tree = parse(parser, 'DELETE F.CUST, "001"\n')
        assert not tree.root_node.has_error


class TestLabels:
    def test_numeric_label(self, parser):
        tree = parse(parser, "100:\n")
        assert not tree.root_node.has_error

    def test_alpha_label(self, parser):
        tree = parse(parser, "DONE:\n")
        assert not tree.root_node.has_error

    def test_label_with_statement(self, parser):
        tree = parse(parser, "100: CRT \"here\"\n")
        assert not tree.root_node.has_error


class TestComments:
    def test_star_comment(self, parser):
        tree = parse(parser, "* This is a comment\n")
        assert not tree.root_node.has_error

    def test_rem_comment(self, parser):
        tree = parse(parser, "REM This is a comment\n")
        assert not tree.root_node.has_error

    def test_bang_comment(self, parser):
        tree = parse(parser, "! This is a comment\n")
        assert not tree.root_node.has_error


class TestCompilerDirectives:
    def test_include(self, parser):
        tree = parse(parser, "$INCLUDE MYFILE MYPROG\n")
        assert not tree.root_node.has_error

    def test_define(self, parser):
        tree = parse(parser, "$DEFINE DEBUG\n")
        assert not tree.root_node.has_error


class TestErrorRecovery:
    def test_syntax_error_detected(self, parser):
        tree = parse(parser, "FOR FOR FOR\n")
        assert tree.root_node.has_error

    def test_partial_parse(self, parser):
        """Even with errors, the tree should still have nodes."""
        tree = parse(parser, 'PRINT "Hello"\nBADTOKEN @@@ !!!\nPRINT "World"\n')
        assert tree.root_node.child_count > 0


class TestExampleFiles:
    def test_hello_bas(self, parser):
        with open("examples/hello.bas") as f:
            source = f.read()
        tree = parse(parser, source)
        assert not tree.root_node.has_error

    def test_subroutine_bas(self, parser):
        with open("examples/subroutine.bas") as f:
            source = f.read()
        tree = parse(parser, source)
        assert not tree.root_node.has_error
