# tree-sitter-universe-basic

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [Rocket UniVerse BASIC](https://www.rocketsoftware.com/products/rocket-universe).

## Overview

This project provides a complete Tree-sitter parser for UniVerse BASIC (UniVerse BASIC / Pick BASIC), enabling syntax highlighting, code navigation, and structural analysis of UniVerse BASIC source code.

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
- **Expressions** — Arithmetic, string concatenation (`:` / `CAT`), relational, logical, pattern matching (`MATCH`/`MATCHES`), dynamic array access (`<>`), substring (`[]`), function calls
- **Compiler Directives** — `$INCLUDE`, `$DEFINE`, `$IFDEF/$IFNDEF`, `$OPTIONS`, `$CHAIN`, `$MAP`
- **Comments** — `*`, `!`, `REM`, `$*`

## Building

```sh
npm install
npx tree-sitter generate
```

## Parsing

```sh
npx tree-sitter parse path/to/file.bas
```

## Examples

Example source files are in the `examples/` directory:

- `hello.bas` — Variables, control flow, arrays, dynamic arrays, file I/O, string functions
- `subroutine.bas` — Subroutine definition with parameters and multi-line IF block

## Project Structure

```
grammar.js          # Tree-sitter grammar definition
tree-sitter.json    # Tree-sitter project configuration
package.json        # Node.js package manifest
examples/           # Example UniVerse BASIC source files
src/                # Generated parser (auto-generated)
```

## Reference

Grammar developed against the *UniVerse BASIC User Guide* (Version 11.3.5, January 2023).

## License

[MIT](LICENSE.md)
