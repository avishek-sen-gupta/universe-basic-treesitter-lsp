# universe-basic-treesitter-lsp

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar and LSP server for [Rocket UniVerse BASIC](https://www.rocketsoftware.com/products/rocket-universe).

## Overview

This project provides:

1. A **Tree-sitter parser grammar** for UniVerse BASIC (Pick BASIC), enabling syntax highlighting, code navigation, and structural analysis.
2. A **Language Server** (LSP) built with [pygls](https://github.com/openlawlibrary/pygls), providing IDE features for any editor that supports the Language Server Protocol.

## LSP Features

- **Diagnostics** — Real-time parse error reporting via tree-sitter
- **Document Symbols** — Outline of programs, subroutines, functions, labels, variables, constants, and arrays
- **Go to Definition** — Jump to label, variable, subroutine, and equate definitions
- **Find References** — Find all occurrences of a symbol in the current document
- **Hover** — Documentation for 100+ keywords and 60+ built-in functions
- **Completion** — Auto-complete keywords, built-in functions (with snippets), and document symbols

## Setup

### Prerequisites

- Node.js (for tree-sitter CLI)
- Python 3.11+
- [Poetry](https://python-poetry.org/)

### Build the grammar

```sh
npm install
npx tree-sitter generate
npx tree-sitter build -o build/universe_basic.dylib   # macOS
# npx tree-sitter build -o build/universe_basic.so    # Linux
```

### Install the LSP server

```sh
poetry install
```

### Run the LSP server

```sh
# stdio (default, for editor integration)
poetry run universe-basic-lsp

# TCP (for development/debugging)
poetry run universe-basic-lsp --tcp --port 2087
```

### Editor Configuration

#### VS Code

A bundled VS Code extension is in `editors/vscode/`.

```sh
cd editors/vscode
npm install
npm run compile
```

Then install it locally:

```sh
# Option 1: symlink for development
ln -s "$(pwd)" ~/.vscode/extensions/universe-basic

# Option 2: package as .vsix (requires vsce)
npx @vscode/vsce package
code --install-extension universe-basic-0.1.0.vsix
```

Configure the LSP server path in VS Code settings:

```json
{
  "universeBasic.lsp.projectPath": "/path/to/universe-basic-treesitter-lsp"
}
```

Or, if you've installed `universe-basic-lsp` globally:

```json
{
  "universeBasic.lsp.serverPath": "/path/to/universe-basic-lsp"
}
```

#### Neovim (nvim-lspconfig)

```lua
vim.api.nvim_create_autocmd("FileType", {
  pattern = "universe-basic",
  callback = function()
    vim.lsp.start({
      name = "universe-basic-lsp",
      cmd = { "poetry", "run", "universe-basic-lsp" },
      root_dir = vim.fn.getcwd(),
    })
  end,
})
```

## Language Coverage

- **Declarations** — `PROGRAM`, `SUBROUTINE`, `FUNCTION`, `DEFFUN`, `DIM`, `COMMON`, `EQUATE`
- **Control Flow** — `IF/THEN/ELSE/END`, `BEGIN CASE/END CASE`, `FOR/NEXT`, `LOOP/REPEAT`, `WHILE/UNTIL`, `GOTO`, `GOSUB`, `ON GOTO/GOSUB`, `CALL`, `RETURN`
- **File I/O** — `OPEN`, `READ`, `WRITE`, `DELETE`, `LOCK`, `UNLOCK`, `FILELOCK`, `SELECT`, `READNEXT`, `CLEARFILE`
- **Sequential I/O** — `OPENSEQ`, `READSEQ`, `WRITESEQ`, `READBLK`, `WRITEBLK`, `SEEK`, `CLOSESEQ`
- **Device I/O** — `OPENDEV`, `GET`, `SEND`
- **Tape I/O** — `READT`, `WRITET`, `REWIND`, `WEOF`
- **Print/Terminal** — `PRINT`, `CRT`, `DISPLAY`, `INPUT`, `HEADING`, `FOOTING`, `TPRINT`
- **String Manipulation** — `LOCATE`, `FIND`, `FINDSTR`, `INS`, `DEL`, `CONVERT`, `SWAP`
- **Transactions** — `BEGIN TRANSACTION`, `END TRANSACTION`, `COMMIT`, `ROLLBACK`
- **Expressions** — Arithmetic, string concatenation, relational, logical, pattern matching, dynamic array access, substring, function calls
- **Compiler Directives** — `$INCLUDE`, `$DEFINE`, `$IFDEF/$IFNDEF`, `$OPTIONS`, `$CHAIN`, `$MAP`
- **Comments** — `*`, `!`, `REM`, `$*`

## Testing the grammar

```sh
npx tree-sitter parse examples/hello.bas
npx tree-sitter parse examples/subroutine.bas
```

## Project Structure

```
grammar.js                  # Tree-sitter grammar definition
tree-sitter.json            # Tree-sitter project configuration
package.json                # Node.js package manifest (tree-sitter-cli)
pyproject.toml              # Python project (Poetry)
universe_basic_lsp/         # LSP server package
  __init__.py
  __main__.py               # Entry point
  server.py                 # pygls Language Server
  parser.py                 # Tree-sitter grammar loader
  analyzer.py               # Parse tree analysis (symbols, diagnostics, definitions)
  keywords.py               # Keyword and built-in function documentation
build/                      # Compiled grammar shared library
editors/vscode/             # VS Code extension
examples/                   # Example UniVerse BASIC source files
reference/                  # Language reference documentation
src/                        # Generated parser (auto-generated, gitignored)
```

## Reference

Grammar developed against the *UniVerse BASIC User Guide* (Version 11.3.5, January 2023).

## License

[MIT](LICENSE.md)
