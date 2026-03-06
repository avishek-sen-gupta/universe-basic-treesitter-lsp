"""UniVerse BASIC Language Server."""

from __future__ import annotations

import logging

from lsprotocol import types
from pygls.lsp.server import LanguageServer
from pygls.workspace import TextDocument

from .analyzer import AnalysisResult, analyze
from .keywords import BUILTIN_FUNCTIONS, KEYWORDS
from .parser import create_parser

logger = logging.getLogger(__name__)


class UniverseBasicLanguageServer(LanguageServer):
    def __init__(self):
        super().__init__("universe-basic-lsp", "0.1.0")
        self._parser = create_parser()
        self._trees: dict[str, AnalysisResult] = {}

    def parse_document(self, doc: TextDocument) -> AnalysisResult:
        source = doc.source.encode("utf-8")
        tree = self._parser.parse(source)
        result = analyze(tree)
        self._trees[doc.uri] = result
        return result

    def get_analysis(self, uri: str) -> AnalysisResult | None:
        return self._trees.get(uri)


server = UniverseBasicLanguageServer()


@server.feature(types.TEXT_DOCUMENT_DID_OPEN)
def did_open(ls: UniverseBasicLanguageServer, params: types.DidOpenTextDocumentParams):
    doc = ls.workspace.get_text_document(params.text_document.uri)
    result = ls.parse_document(doc)
    ls.text_document_publish_diagnostics(
        types.PublishDiagnosticsParams(
            uri=doc.uri,
            diagnostics=result.diagnostics,
        )
    )


@server.feature(types.TEXT_DOCUMENT_DID_CHANGE)
def did_change(ls: UniverseBasicLanguageServer, params: types.DidChangeTextDocumentParams):
    doc = ls.workspace.get_text_document(params.text_document.uri)
    result = ls.parse_document(doc)
    ls.text_document_publish_diagnostics(
        types.PublishDiagnosticsParams(
            uri=doc.uri,
            diagnostics=result.diagnostics,
        )
    )


@server.feature(types.TEXT_DOCUMENT_DID_SAVE)
def did_save(ls: UniverseBasicLanguageServer, params: types.DidSaveTextDocumentParams):
    doc = ls.workspace.get_text_document(params.text_document.uri)
    result = ls.parse_document(doc)
    ls.text_document_publish_diagnostics(
        types.PublishDiagnosticsParams(
            uri=doc.uri,
            diagnostics=result.diagnostics,
        )
    )


@server.feature(types.TEXT_DOCUMENT_DID_CLOSE)
def did_close(ls: UniverseBasicLanguageServer, params: types.DidCloseTextDocumentParams):
    ls._trees.pop(params.text_document.uri, None)


@server.feature(types.TEXT_DOCUMENT_DOCUMENT_SYMBOL)
def document_symbol(
    ls: UniverseBasicLanguageServer, params: types.DocumentSymbolParams
) -> list[types.DocumentSymbol]:
    result = ls.get_analysis(params.text_document.uri)
    if not result:
        doc = ls.workspace.get_text_document(params.text_document.uri)
        result = ls.parse_document(doc)

    def to_document_symbol(sym) -> types.DocumentSymbol:
        return types.DocumentSymbol(
            name=sym.name,
            kind=sym.kind,
            range=sym.range,
            selection_range=sym.selection_range,
            children=[to_document_symbol(c) for c in sym.children] or None,
        )

    return [to_document_symbol(s) for s in result.symbols]


@server.feature(types.TEXT_DOCUMENT_DEFINITION)
def definition(
    ls: UniverseBasicLanguageServer, params: types.DefinitionParams
) -> list[types.Location] | None:
    doc = ls.workspace.get_text_document(params.text_document.uri)
    result = ls.get_analysis(params.text_document.uri)
    if not result:
        result = ls.parse_document(doc)

    word = _word_at_position(doc, params.position)
    if not word:
        return None

    defs = result.definitions.get(word.upper(), [])
    if not defs:
        return None

    return [
        types.Location(uri=params.text_document.uri, range=d.range)
        for d in defs
    ]


@server.feature(types.TEXT_DOCUMENT_HOVER)
def hover(
    ls: UniverseBasicLanguageServer, params: types.HoverParams
) -> types.Hover | None:
    doc = ls.workspace.get_text_document(params.text_document.uri)
    word = _word_at_position(doc, params.position)
    if not word:
        return None

    upper = word.upper()

    info = KEYWORDS.get(upper) or BUILTIN_FUNCTIONS.get(upper)
    if info:
        return types.Hover(
            contents=types.MarkupContent(
                kind=types.MarkupKind.Markdown,
                value=f"**{upper}**\n\n{info}",
            )
        )

    # Check if it's a defined symbol
    result = ls.get_analysis(params.text_document.uri)
    if result:
        defs = result.definitions.get(upper, [])
        if defs:
            kind = "Symbol"
            return types.Hover(
                contents=types.MarkupContent(
                    kind=types.MarkupKind.Markdown,
                    value=f"**{upper}** — {kind} (defined at line {defs[0].range.start.line + 1})",
                )
            )

    return None


@server.feature(
    types.TEXT_DOCUMENT_COMPLETION,
    types.CompletionOptions(trigger_characters=["."], resolve_provider=False),
)
def completion(
    ls: UniverseBasicLanguageServer, params: types.CompletionParams
) -> list[types.CompletionItem]:
    items: list[types.CompletionItem] = []

    # Keywords
    for kw, doc in KEYWORDS.items():
        items.append(
            types.CompletionItem(
                label=kw,
                kind=types.CompletionItemKind.Keyword,
                documentation=doc,
            )
        )

    # Built-in functions
    for fn, doc in BUILTIN_FUNCTIONS.items():
        items.append(
            types.CompletionItem(
                label=fn,
                kind=types.CompletionItemKind.Function,
                documentation=doc,
                insert_text=f"{fn}($0)",
                insert_text_format=types.InsertTextFormat.Snippet,
            )
        )

    # Symbols from the document
    result = ls.get_analysis(params.text_document.uri)
    if result:
        seen = set()
        for name, defs in result.definitions.items():
            if name not in seen:
                seen.add(name)
                items.append(
                    types.CompletionItem(
                        label=name,
                        kind=types.CompletionItemKind.Variable,
                    )
                )

    return items


@server.feature(types.TEXT_DOCUMENT_REFERENCES)
def references(
    ls: UniverseBasicLanguageServer, params: types.ReferenceParams
) -> list[types.Location] | None:
    doc = ls.workspace.get_text_document(params.text_document.uri)
    word = _word_at_position(doc, params.position)
    if not word:
        return None

    upper = word.upper()
    source = doc.source
    locations: list[types.Location] = []

    for line_num, line in enumerate(source.splitlines()):
        col = 0
        line_upper = line.upper()
        while True:
            idx = line_upper.find(upper, col)
            if idx == -1:
                break
            # Check word boundaries
            before = line[idx - 1] if idx > 0 else " "
            after = line[idx + len(upper)] if idx + len(upper) < len(line) else " "
            if not (before.isalnum() or before in "._$%") and not (after.isalnum() or after in "._$%"):
                locations.append(
                    types.Location(
                        uri=params.text_document.uri,
                        range=types.Range(
                            start=types.Position(line=line_num, character=idx),
                            end=types.Position(line=line_num, character=idx + len(upper)),
                        ),
                    )
                )
            col = idx + 1

    return locations or None


def _word_at_position(doc: TextDocument, position: types.Position) -> str | None:
    """Extract the word at a given position."""
    try:
        lines = doc.source.splitlines()
        if position.line >= len(lines):
            return None
        line = lines[position.line]
        col = position.character

        if col >= len(line):
            return None

        # Expand to word boundaries
        start = col
        while start > 0 and (line[start - 1].isalnum() or line[start - 1] in "._$%"):
            start -= 1
        end = col
        while end < len(line) and (line[end].isalnum() or line[end] in "._$%"):
            end += 1

        word = line[start:end]
        return word if word else None
    except (IndexError, AttributeError):
        return None
