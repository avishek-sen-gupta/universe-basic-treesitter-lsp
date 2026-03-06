# universe-basic-treesitter-lsp

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar and LSP server for [Rocket UniVerse BASIC](https://www.rocketsoftware.com/products/rocket-universe).

## Overview

This project provides:

1. A **Tree-sitter parser grammar** for UniVerse BASIC (Pick BASIC), enabling syntax highlighting, code navigation, and structural analysis.
2. A **Language Server** (LSP) built with [pygls](https://github.com/openlawlibrary/pygls), providing IDE features for any editor that supports the Language Server Protocol.
3. A **VS Code extension** with syntax coloring, language configuration, and LSP client integration.

## LSP Features

- **Syntax Coloring** — Full TextMate grammar for keywords, strings, numbers, comments, labels, operators, built-in functions, @variables, and compiler directives
- **Diagnostics** — Real-time parse error reporting via tree-sitter
- **Document Symbols** — Outline of programs, subroutines, functions, labels, variables, constants, and arrays
- **Go to Definition** — Jump to label, variable, subroutine, and equate definitions
- **Find References** — Find all occurrences of a symbol in the current document
- **Hover** — Documentation for 100+ keywords and 60+ built-in functions
- **Completion** — Auto-complete keywords, built-in functions (with snippets), and document symbols

## Installation

### Prerequisites

- Node.js (for tree-sitter CLI)
- Python 3.11+
- [Poetry](https://python-poetry.org/)

### 1. Clone the repository

```sh
git clone git@github.com:avishek-sen-gupta/universe-basic-treesitter-lsp.git
cd universe-basic-treesitter-lsp
```

### 2. Build the tree-sitter grammar

```sh
npm install
npx tree-sitter generate
mkdir -p build
npx tree-sitter build -o build/universe_basic.dylib   # macOS
# npx tree-sitter build -o build/universe_basic.so    # Linux
```

### 3. Install the Python LSP server

```sh
poetry install
```

Verify it works:

```sh
poetry run python -m universe_basic_lsp --help
```

### 4. Build the VS Code extension

```sh
cd editors/vscode
npm install
npm run compile
cd ../..
```

### 5. Install the extension into VS Code

**Option A: Symlink (recommended for development)**

```sh
ln -s "$(pwd)/editors/vscode" ~/.vscode/extensions/universe-basic
```

**Option B: Package as .vsix**

```sh
cd editors/vscode
npx @vscode/vsce package
code --install-extension universe-basic-0.1.0.vsix
```

### 6. Configure VS Code

Open VS Code settings (`Cmd+,` / `Ctrl+,`), search for "universe basic", and set:

- **`universeBasic.lsp.projectPath`** — path to this repository's root directory

Or add to your `settings.json`:

```json
{
  "universeBasic.lsp.projectPath": "/path/to/universe-basic-treesitter-lsp"
}
```

### 7. Restart VS Code and open a `.bas` file

You should see syntax coloring immediately, and LSP features (diagnostics, hover, completion, go-to-definition, etc.) once the server starts.

## Testing the Extension with the Extension Development Host

You can test the extension without installing it by using VS Code's built-in Extension Development Host:

1. Open the `editors/vscode/` directory as a workspace in VS Code:
   ```sh
   code editors/vscode
   ```

2. Press **F5** (or go to **Run > Start Debugging**).

3. A new VS Code window (the Extension Development Host) opens with the extension loaded. It automatically opens the `examples/` directory so you have `.bas` files to test with.

4. Open `hello.bas` or `subroutine.bas` to see syntax coloring and LSP features in action.

5. To see LSP server logs, open the Output panel (`View > Output`) and select **"UniVerse BASIC LSP"** from the dropdown.

6. Changes to the extension source are picked up on the next F5 launch. Use `npm run watch` in the `editors/vscode/` directory for automatic TypeScript recompilation during development.

## Running the LSP Server Standalone

```sh
# stdio (default, for editor integration)
poetry run python -m universe_basic_lsp

# TCP (for development/debugging)
poetry run python -m universe_basic_lsp --tcp --port 2087
```

## Running Tests

```sh
# Run all tests (parser, analyzer, LSP server integration)
poetry run pytest tests/ -v
```

The test suite includes:
- **45 parser tests** — parsing of all language constructs
- **19 analyzer tests** — symbol extraction, diagnostics, definitions
- **11 server integration tests** — full LSP protocol tests over stdio

## Neovim Configuration

```lua
vim.api.nvim_create_autocmd("FileType", {
  pattern = "universe-basic",
  callback = function()
    vim.lsp.start({
      name = "universe-basic-lsp",
      cmd = { "poetry", "run", "python", "-m", "universe_basic_lsp" },
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
tests/                      # Test suite (pytest)
  test_parser.py            # Tree-sitter parser tests
  test_analyzer.py          # Analyzer unit tests
  test_server.py            # LSP server integration tests
editors/vscode/             # VS Code extension
  src/extension.ts          # Extension entry point (LSP client)
  syntaxes/                 # TextMate grammar for syntax coloring
  language-configuration.json
  .vscode/launch.json       # F5 Extension Development Host config
build/                      # Compiled grammar shared library (gitignored)
examples/                   # Example UniVerse BASIC source files
reference/                  # Language reference documentation
src/                        # Generated parser (auto-generated, gitignored)
```

## Reference

Grammar developed against the *UniVerse BASIC User Guide* (Version 11.3.5, January 2023).

## License

[MIT](LICENSE.md)
