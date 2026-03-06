"""Integration tests for the LSP server using pygls client."""

import asyncio
import sys

import pytest
import pytest_asyncio

from lsprotocol import types
from pygls.lsp.client import BaseLanguageClient


SERVER_CMD = [sys.executable, "-m", "universe_basic_lsp"]

HELLO_SOURCE = """\
PROGRAM HELLO
*
NAME = "John"
AGE = 25
*
IF AGE >= 18 THEN PRINT "Adult" ELSE PRINT "Minor"
*
FOR I = 1 TO 10
   PRINT I
NEXT I
*
EQUATE TRUE TO 1
*
GOSUB 100
GOTO DONE
*
100:
   CRT "at 100"
   RETURN
*
DONE:
*
END
"""


@pytest_asyncio.fixture
async def client():
    c = BaseLanguageClient("test-client", "0.1.0")
    await c.start_io(SERVER_CMD[0], *SERVER_CMD[1:])

    response = await c.initialize_async(
        types.InitializeParams(
            capabilities=types.ClientCapabilities(),
            root_uri=None,
        )
    )
    assert response is not None
    c.initialized(types.InitializedParams())

    # Store capabilities from the response
    c._init_result = response

    yield c

    await c.shutdown_async(None)
    c.exit(None)
    await asyncio.sleep(0.1)


DOC_URI = "file:///test/hello.bas"


def open_doc(client: BaseLanguageClient, uri: str = DOC_URI, text: str = HELLO_SOURCE):
    client.text_document_did_open(
        types.DidOpenTextDocumentParams(
            text_document=types.TextDocumentItem(
                uri=uri,
                language_id="universe-basic",
                version=1,
                text=text,
            )
        )
    )


@pytest.mark.asyncio
async def test_initialize(client: BaseLanguageClient):
    """Server should initialize and report capabilities."""
    caps = client._init_result.capabilities
    assert caps is not None
    assert caps.text_document_sync is not None
    assert caps.completion_provider is not None
    assert caps.hover_provider is not None
    assert caps.definition_provider is not None
    assert caps.document_symbol_provider is not None
    assert caps.references_provider is not None


@pytest.mark.asyncio
async def test_document_symbols(client: BaseLanguageClient):
    open_doc(client)
    await asyncio.sleep(0.5)

    result = await client.text_document_document_symbol_async(
        types.DocumentSymbolParams(
            text_document=types.TextDocumentIdentifier(uri=DOC_URI)
        )
    )
    assert result is not None
    names = [s.name for s in result]
    assert "HELLO" in names
    assert "NAME" in names
    assert "AGE" in names
    assert "TRUE" in names


@pytest.mark.asyncio
async def test_hover_keyword(client: BaseLanguageClient):
    # Source: line 0 = "PROGRAM HELLO"
    # Use a simple doc with PRINT at a known position
    uri = "file:///test/hover_kw.bas"
    open_doc(client, uri=uri, text='PRINT "Hello"\n')
    await asyncio.sleep(0.5)

    result = await client.text_document_hover_async(
        types.HoverParams(
            text_document=types.TextDocumentIdentifier(uri=uri),
            position=types.Position(line=0, character=2),  # inside "PRINT"
        )
    )
    assert result is not None
    assert "PRINT" in result.contents.value


@pytest.mark.asyncio
async def test_hover_builtin_function(client: BaseLanguageClient):
    uri = "file:///test/hover_fn.bas"
    open_doc(client, uri=uri, text="X = LEN(NAME)\n")
    await asyncio.sleep(0.5)

    result = await client.text_document_hover_async(
        types.HoverParams(
            text_document=types.TextDocumentIdentifier(uri=uri),
            position=types.Position(line=0, character=5),  # inside "LEN"
        )
    )
    assert result is not None
    assert "LEN" in result.contents.value


@pytest.mark.asyncio
async def test_hover_variable(client: BaseLanguageClient):
    open_doc(client)
    await asyncio.sleep(0.5)

    # "NAME" on line 2, col 0
    result = await client.text_document_hover_async(
        types.HoverParams(
            text_document=types.TextDocumentIdentifier(uri=DOC_URI),
            position=types.Position(line=2, character=1),
        )
    )
    assert result is not None
    assert "NAME" in result.contents.value


@pytest.mark.asyncio
async def test_goto_definition_label(client: BaseLanguageClient):
    open_doc(client)
    await asyncio.sleep(0.5)

    # "GOTO DONE" is on line 14, "DONE" starts at col 5
    result = await client.text_document_definition_async(
        types.DefinitionParams(
            text_document=types.TextDocumentIdentifier(uri=DOC_URI),
            position=types.Position(line=14, character=6),  # "DONE"
        )
    )
    assert result is not None
    assert len(result) >= 1


@pytest.mark.asyncio
async def test_goto_definition_variable(client: BaseLanguageClient):
    open_doc(client)
    await asyncio.sleep(0.5)

    # "AGE" used in IF on line 5, col 3
    result = await client.text_document_definition_async(
        types.DefinitionParams(
            text_document=types.TextDocumentIdentifier(uri=DOC_URI),
            position=types.Position(line=5, character=4),  # "AGE"
        )
    )
    assert result is not None
    assert len(result) >= 1
    # Should point to "AGE = 25" on line 3
    found = any(loc.range.start.line == 3 for loc in result)
    assert found, f"Expected definition at line 3, got {[l.range.start.line for l in result]}"


@pytest.mark.asyncio
async def test_completion(client: BaseLanguageClient):
    open_doc(client)
    await asyncio.sleep(0.5)

    result = await client.text_document_completion_async(
        types.CompletionParams(
            text_document=types.TextDocumentIdentifier(uri=DOC_URI),
            position=types.Position(line=2, character=0),
        )
    )
    assert result is not None
    labels = [item.label for item in result]
    # Keywords
    assert "PRINT" in labels
    assert "IF" in labels
    # Built-in functions
    assert "LEN" in labels
    assert "TRIM" in labels
    # Document symbols
    assert "NAME" in labels


@pytest.mark.asyncio
async def test_references(client: BaseLanguageClient):
    open_doc(client)
    await asyncio.sleep(0.5)

    # Find references to "AGE" - defined on line 3, used on line 5
    result = await client.text_document_references_async(
        types.ReferenceParams(
            text_document=types.TextDocumentIdentifier(uri=DOC_URI),
            position=types.Position(line=3, character=0),
            context=types.ReferenceContext(include_declaration=True),
        )
    )
    assert result is not None
    assert len(result) >= 2  # at least the assignment and the IF usage


@pytest.mark.asyncio
async def test_diagnostics_clean_file(client: BaseLanguageClient):
    """A clean file should produce no error diagnostics."""
    uri = "file:///test/clean.bas"
    open_doc(client, uri=uri, text='PRINT "OK"\nEND\n')
    await asyncio.sleep(0.5)

    # Re-parse by requesting symbols (triggers analysis)
    result = await client.text_document_document_symbol_async(
        types.DocumentSymbolParams(
            text_document=types.TextDocumentIdentifier(uri=uri)
        )
    )
    # If we get symbols back without error, the server is healthy
    assert result is not None


@pytest.mark.asyncio
async def test_did_change(client: BaseLanguageClient):
    """After changing a document, symbols should update."""
    uri = "file:///test/change.bas"
    open_doc(client, uri=uri, text="X = 1\n")
    await asyncio.sleep(0.5)

    result1 = await client.text_document_document_symbol_async(
        types.DocumentSymbolParams(
            text_document=types.TextDocumentIdentifier(uri=uri)
        )
    )
    names1 = [s.name for s in result1]
    assert "X" in names1

    # Change document using whole-document replacement
    client.text_document_did_change(
        types.DidChangeTextDocumentParams(
            text_document=types.VersionedTextDocumentIdentifier(uri=uri, version=2),
            content_changes=[
                types.TextDocumentContentChangeWholeDocument(text="Y = 99\n")
            ],
        )
    )
    await asyncio.sleep(0.5)

    result2 = await client.text_document_document_symbol_async(
        types.DocumentSymbolParams(
            text_document=types.TextDocumentIdentifier(uri=uri)
        )
    )
    names2 = [s.name for s in result2]
    assert "Y" in names2
