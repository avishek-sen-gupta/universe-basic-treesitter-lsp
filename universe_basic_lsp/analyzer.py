"""Analyze tree-sitter parse trees for LSP features."""

from __future__ import annotations

from dataclasses import dataclass, field
from tree_sitter import Node, Tree

from lsprotocol import types


@dataclass
class Symbol:
    name: str
    kind: types.SymbolKind
    range: types.Range
    selection_range: types.Range
    children: list[Symbol] = field(default_factory=list)


@dataclass
class Definition:
    name: str
    range: types.Range


@dataclass
class AnalysisResult:
    diagnostics: list[types.Diagnostic]
    symbols: list[Symbol]
    definitions: dict[str, list[Definition]]  # name -> locations


def _node_range(node: Node) -> types.Range:
    return types.Range(
        start=types.Position(line=node.start_point.row, character=node.start_point.column),
        end=types.Position(line=node.end_point.row, character=node.end_point.column),
    )


def _collect_errors(node: Node, diagnostics: list[types.Diagnostic]) -> None:
    if node.type == "ERROR" or node.is_missing:
        msg = "Syntax error" if node.type == "ERROR" else f"Missing {node.type}"
        diagnostics.append(
            types.Diagnostic(
                range=_node_range(node),
                message=msg,
                severity=types.DiagnosticSeverity.Error,
                source="universe-basic",
            )
        )
    for child in node.children:
        _collect_errors(child, diagnostics)


def _collect_symbols(node: Node, symbols: list[Symbol]) -> None:
    """Walk tree and extract document symbols."""
    for child in node.children:
        if child.type == "statement_line":
            _collect_symbols_from_statement_line(child, symbols)
        elif child.type == "comment":
            continue
        else:
            _collect_symbols(child, symbols)


def _collect_symbols_from_statement_line(node: Node, symbols: list[Symbol]) -> None:
    for child in node.children:
        if child.type == "statement_label":
            label_node = _find_child(child, "identifier") or _find_child(child, "numeric_label")
            if label_node:
                symbols.append(Symbol(
                    name=label_node.text.decode(),
                    kind=types.SymbolKind.Key,
                    range=_node_range(child),
                    selection_range=_node_range(label_node),
                ))
        elif child.type == "statement":
            _collect_symbols_from_statement(child, symbols)


def _collect_symbols_from_statement(node: Node, symbols: list[Symbol]) -> None:
    for child in node.children:
        if child.type == "program_statement":
            name_node = _find_child(child, "identifier")
            if name_node:
                symbols.append(Symbol(
                    name=name_node.text.decode(),
                    kind=types.SymbolKind.Module,
                    range=_node_range(child),
                    selection_range=_node_range(name_node),
                ))
        elif child.type == "subroutine_statement":
            name_node = _find_child(child, "identifier")
            if name_node:
                symbols.append(Symbol(
                    name=name_node.text.decode(),
                    kind=types.SymbolKind.Function,
                    range=_node_range(child),
                    selection_range=_node_range(name_node),
                ))
        elif child.type == "function_statement":
            name_node = _find_child(child, "identifier")
            if name_node:
                symbols.append(Symbol(
                    name=name_node.text.decode(),
                    kind=types.SymbolKind.Function,
                    range=_node_range(child),
                    selection_range=_node_range(name_node),
                ))
        elif child.type == "equate_statement":
            name_node = _find_child(child, "identifier")
            if name_node:
                symbols.append(Symbol(
                    name=name_node.text.decode(),
                    kind=types.SymbolKind.Constant,
                    range=_node_range(child),
                    selection_range=_node_range(name_node),
                ))
        elif child.type == "assignment_statement":
            lhs = _find_child(child, "lhs_expression")
            if lhs:
                id_node = _find_child(lhs, "identifier")
                if id_node:
                    symbols.append(Symbol(
                        name=id_node.text.decode(),
                        kind=types.SymbolKind.Variable,
                        range=_node_range(child),
                        selection_range=_node_range(id_node),
                    ))
        elif child.type == "dimension_statement":
            for spec in _find_children(child, "dim_specifier"):
                id_node = _find_child(spec, "identifier")
                if id_node:
                    symbols.append(Symbol(
                        name=id_node.text.decode(),
                        kind=types.SymbolKind.Array,
                        range=_node_range(spec),
                        selection_range=_node_range(id_node),
                    ))
        elif child.type in ("for_statement", "if_block", "begin_case_statement", "loop_statement"):
            _collect_symbols(child, symbols)


def _collect_definitions(node: Node, defs: dict[str, list[Definition]]) -> None:
    """Collect all definition-like locations (labels, assignments, equates, subroutines)."""
    if node.type == "statement_label":
        label_node = _find_child(node, "identifier") or _find_child(node, "numeric_label")
        if label_node:
            name = label_node.text.decode().upper()
            defs.setdefault(name, []).append(Definition(name=name, range=_node_range(label_node)))

    elif node.type == "label_line":
        label = _find_child(node, "statement_label")
        if label:
            _collect_definitions(label, defs)
        return

    elif node.type in ("subroutine_statement", "function_statement", "program_statement"):
        name_node = _find_child(node, "identifier")
        if name_node:
            name = name_node.text.decode().upper()
            defs.setdefault(name, []).append(Definition(name=name, range=_node_range(name_node)))

    elif node.type == "equate_statement":
        name_node = _find_child(node, "identifier")
        if name_node:
            name = name_node.text.decode().upper()
            defs.setdefault(name, []).append(Definition(name=name, range=_node_range(name_node)))

    elif node.type == "assignment_statement":
        lhs = _find_child(node, "lhs_expression")
        if lhs:
            id_node = _find_child(lhs, "identifier")
            if id_node:
                name = id_node.text.decode().upper()
                defs.setdefault(name, []).append(Definition(name=name, range=_node_range(id_node)))

    for child in node.children:
        _collect_definitions(child, defs)


def _find_child(node: Node, type_name: str) -> Node | None:
    for child in node.children:
        if child.type == type_name:
            return child
    return None


def _find_children(node: Node, type_name: str) -> list[Node]:
    return [child for child in node.children if child.type == type_name]


def analyze(tree: Tree) -> AnalysisResult:
    root = tree.root_node
    diagnostics: list[types.Diagnostic] = []
    symbols: list[Symbol] = []
    definitions: dict[str, list[Definition]] = {}

    _collect_errors(root, diagnostics)
    _collect_symbols(root, symbols)
    _collect_definitions(root, definitions)

    return AnalysisResult(
        diagnostics=diagnostics,
        symbols=symbols,
        definitions=definitions,
    )
