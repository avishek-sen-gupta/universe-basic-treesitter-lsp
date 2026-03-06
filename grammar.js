/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Case-insensitive keyword helper — produces a regex pattern
// Only pass pure alphabetic keywords (no $, #, etc.)
const ci = (keyword) => {
  let pattern = '';
  for (const c of keyword) {
    pattern += `[${c.toLowerCase()}${c.toUpperCase()}]`;
  }
  return new RegExp(pattern);
};

// Case-insensitive pattern for directives with $ or # prefix
const ciDirective = (prefix, keyword) => {
  let pattern = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const c of keyword) {
    pattern += `[${c.toLowerCase()}${c.toUpperCase()}]`;
  }
  return new RegExp(pattern);
};

module.exports = grammar({
  name: 'universe_basic',

  extras: $ => [/[ \t]/, $.line_continuation],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.lhs_expression, $.primary_expression],
    [$._expression, $.lhs_expression],
    [$.statement_label, $.primary_expression],
    [$.concatenation_expression],
  ],

  rules: {
    source_file: $ => repeat(choice(
      $.statement_line,
      $.label_line,
      $.compiler_directive,
      $.comment,
      $._newline,
    )),

    _newline: _ => /\r?\n/,

    line_continuation: _ => token(seq('...', /\r?\n/)),

    // =========================================
    // Comments
    // =========================================
    comment: $ => choice(
      $.rem_comment,
      $.star_comment,
      $.bang_comment,
      $.dollar_star_comment,
    ),

    rem_comment: _ => token(seq(ci('REM'), /[^\n]*/)),
    star_comment: _ => token(seq('*', /[^\n]*/)),
    bang_comment: _ => token(seq('!', /[^\n]*/)),
    dollar_star_comment: _ => token(seq('$', '*', /[^\n]*/)),

    // =========================================
    // Statement lines
    // =========================================
    statement_line: $ => seq(
      optional($.statement_label),
      $.statement,
      repeat(seq(';', choice($.statement, $.comment))),
      $._newline,
    ),

    label_line: $ => seq(
      $.statement_label,
      $._newline,
    ),

    statement_label: $ => choice(
      seq($.numeric_label, optional(':')),
      seq($.identifier, ':'),
      seq($._keyword_as_label, ':'),
    ),

    _keyword_as_label: _ => choice(
      ci('EXIT'), ci('RETURN'), ci('STOP'), ci('END'),
      ci('NULL'), ci('CONTINUE'), ci('DEBUG'),
    ),

    numeric_label: _ => /[0-9]+/,

    // =========================================
    // Statements
    // =========================================
    statement: $ => choice(
      // Declarations
      $.program_statement,
      $.subroutine_statement,
      $.function_statement,
      $.deffun_statement,
      $.dimension_statement,
      $.common_statement,
      $.equate_statement,

      // Assignment
      $.assignment_statement,
      $.let_statement,
      $.mat_statement,
      $.swap_statement,
      $.clear_statement,

      // Control flow
      $.if_statement,
      $.if_block,
      $.begin_case_statement,
      $.for_statement,
      $.loop_statement,
      $.goto_statement,
      $.gosub_statement,
      $.on_statement,
      $.return_statement,
      $.stop_statement,
      $.abort_statement,
      $.end_statement,
      $.null_statement,
      $.continue_statement,
      $.exit_statement,
      $.while_statement,
      $.until_statement,

      // Subroutine calls
      $.call_statement,
      $.enter_statement,
      $.execute_statement,
      $.perform_statement,
      $.chain_statement,

      // I/O - File
      $.open_statement,
      $.close_statement,
      $.read_statement,
      $.write_statement,
      $.delete_statement,
      $.lock_statement,
      $.unlock_statement,
      $.release_statement,
      $.filelock_statement,
      $.fileunlock_statement,
      $.select_statement,
      $.readnext_statement,
      $.clearselect_statement,
      $.readlist_statement,
      $.writelist_statement,
      $.getlist_statement,
      $.deletelist_statement,
      $.bscan_statement,
      $.clearfile_statement,

      // I/O - Sequential
      $.openseq_statement,
      $.readseq_statement,
      $.writeseq_statement,
      $.writeseqf_statement,
      $.readblk_statement,
      $.writeblk_statement,
      $.seek_statement,
      $.closeseq_statement,
      $.weofseq_statement,
      $.nobuf_statement,
      $.flush_statement,
      $.openpath_statement,
      $.create_statement,
      $.status_statement,

      // I/O - Print/Terminal
      $.print_statement,
      $.crt_statement,
      $.display_statement,
      $.input_statement,
      $.heading_statement,
      $.footing_statement,
      $.page_statement,
      $.printer_statement,
      $.hush_statement,
      $.break_statement,
      $.echo_statement,
      $.prompt_statement,
      $.tabstop_statement,
      $.tprint_statement,
      $.errmsg_statement,
      $.printerr_statement,
      $.data_statement,
      $.cleardata_statement,
      $.inputtrap_statement,
      $.keyedit_statement,
      $.keytrap_statement,
      $.keyexit_statement,

      // I/O - Tape
      $.readt_statement,
      $.writet_statement,
      $.rewind_statement,
      $.weof_statement,

      // I/O - Device
      $.opendev_statement,
      $.get_statement,
      $.send_statement,
      $.ttyctl_statement,
      $.ttyget_statement,
      $.ttyset_statement,

      // Transaction
      $.begin_transaction_statement,
      $.end_transaction_statement,
      $.commit_statement,
      $.rollback_statement,
      $.set_transaction_statement,

      // String
      $.locate_statement,
      $.find_statement,
      $.findstr_statement,
      $.ins_statement,
      $.del_statement,
      $.remove_statement,
      $.convert_statement,
      $.matparse_statement,
      $.matbuild_statement,

      // Other
      $.debug_statement,
      $.sleep_statement,
      $.nap_statement,
      $.precision_statement,
      $.randomize_statement,
      $.procread_statement,
      $.procwrite_statement,
      $.timeout_statement,
      $.authorization_statement,
      $.opencheck_statement,
      $.recordlockl_statement,
      $.recordlocku_statement,
      $.setrem_statement,
      $.inputclear_statement,
      $.clearprompts_statement,

      // Catch-all for function calls used as statements
      $.expression_statement,
    ),

    // =========================================
    // Compiler Directives
    // =========================================
    compiler_directive: $ => choice(
      $.include_directive,
      $.chain_directive,
      $.define_directive,
      $.undefine_directive,
      $.ifdef_directive,
      $.ifndef_directive,
      $.options_directive,
      $.copyright_directive,
      $.page_directive,
      $.map_directive,
    ),

    include_directive: $ => seq(
      choice(
        ciDirective('$', 'INCLUDE'),
        ciDirective('$', 'INSERT'),
        ciDirective('#', 'INCLUDE'),
        ci('INCLUDE'),
      ),
      optional($.identifier),
      optional($.identifier),
      $._newline,
    ),

    chain_directive: $ => seq(
      ciDirective('$', 'CHAIN'),
      optional($.identifier),
      optional($.identifier),
      $._newline,
    ),

    define_directive: $ => seq(
      ciDirective('$', 'DEFINE'),
      $.identifier,
      optional(field('value', $._expression)),
      $._newline,
    ),

    undefine_directive: $ => seq(
      ciDirective('$', 'UNDEFINE'),
      $.identifier,
      $._newline,
    ),

    ifdef_directive: $ => seq(
      ciDirective('$', 'IFDEF'),
      $.identifier,
      $._newline,
      optional($._body),
      optional(seq(
        ciDirective('$', 'ELSE'), $._newline,
        optional($._body),
      )),
      ciDirective('$', 'ENDIF'), $._newline,
    ),

    ifndef_directive: $ => seq(
      ciDirective('$', 'IFNDEF'),
      $.identifier,
      $._newline,
      optional($._body),
      optional(seq(
        ciDirective('$', 'ELSE'), $._newline,
        optional($._body),
      )),
      ciDirective('$', 'ENDIF'), $._newline,
    ),

    options_directive: $ => seq(
      ciDirective('$', 'OPTIONS'),
      /[^\n]+/,
      $._newline,
    ),

    copyright_directive: $ => seq(
      ciDirective('$', 'COPYRIGHT'),
      /[^\n]*/,
      $._newline,
    ),

    page_directive: $ => seq(
      choice(ciDirective('$', 'PAGE'), ciDirective('$', 'EJECT')),
      $._newline,
    ),

    map_directive: $ => seq(
      ciDirective('$', 'MAP'),
      /[^\n]+/,
      $._newline,
    ),

    // =========================================
    // Declaration Statements
    // =========================================
    program_statement: $ => seq(
      choice(ci('PROGRAM'), ci('PROG')),
      $.identifier,
    ),

    subroutine_statement: $ => seq(
      ci('SUBROUTINE'),
      optional(seq(
        $.identifier,
        optional($.parameter_list),
      )),
    ),

    function_statement: $ => seq(
      ci('FUNCTION'),
      $.identifier,
      optional($.parameter_list),
    ),

    deffun_statement: $ => seq(
      ci('DEFFUN'),
      $.identifier,
      optional($.parameter_list),
      optional(seq(ci('CALLING'), choice($.string, $.identifier))),
    ),

    parameter_list: $ => seq('(', commaSep($._expression), ')'),

    dimension_statement: $ => seq(
      choice(ci('DIMENSION'), ci('DIM')),
      commaSep1($.dim_specifier),
    ),

    dim_specifier: $ => seq(
      $.identifier,
      '(',
      $._expression,
      optional(seq(',', $._expression)),
      ')',
    ),

    common_statement: $ => seq(
      ci('COMMON'),
      optional(seq('/', $.identifier, '/')),
      commaSep1(choice($.dim_specifier, $.identifier)),
    ),

    equate_statement: $ => seq(
      choice(ci('EQUATE'), ci('EQU')),
      $.identifier,
      choice(ci('TO'), ci('LIT'), ci('LITERALLY')),
      $._expression,
    ),

    // =========================================
    // Assignment Statements
    // =========================================
    assignment_statement: $ => prec.right(seq(
      $.lhs_expression,
      choice('=', '+=', '-=', ':='),
      $._expression,
    )),

    let_statement: $ => seq(
      ci('LET'),
      $.lhs_expression,
      '=',
      $._expression,
    ),

    mat_statement: $ => seq(
      ci('MAT'),
      $.identifier,
      '=',
      $._expression,
    ),

    swap_statement: $ => seq(
      ci('SWAP'),
      $.lhs_expression,
      ci('WITH'),
      $.lhs_expression,
    ),

    clear_statement: $ => seq(
      ci('CLEAR'),
      optional(commaSep1($.identifier)),
    ),

    expression_statement: $ => $._expression,

    // =========================================
    // Control Flow Statements
    // =========================================
    if_statement: $ => prec.right(seq(
      ci('IF'),
      field('condition', $._expression),
      optional(ci('THEN')),
      optional($._then_body),
      optional(seq(ci('ELSE'), optional($._else_body))),
    )),

    if_block: $ => prec.right(1, seq(
      ci('IF'),
      field('condition', $._expression),
      optional(ci('THEN')),
      $._newline,
      optional($._body),
      choice(
        seq(
          $._end_else,
          $._newline,
          optional($._body),
          ci('END'),
        ),
        ci('END'),
      ),
    )),

    _end_else: _ => token(seq(
      /[eE][nN][dD]/,
      /\s+/,
      /[eE][lL][sS][eE]/,
    )),

    _then_body: $ => prec.right(seq($.statement, repeat(seq(';', $.statement)))),
    _else_body: $ => prec.right(seq($.statement, repeat(seq(';', $.statement)))),

    _body: $ => repeat1(choice($.statement_line, $.label_line, $.compiler_directive, $.comment, $._newline)),

    begin_case_statement: $ => seq(
      ci('BEGIN'), ci('CASE'),
      $._newline,
      repeat($.case_clause),
      $._end_case,
    ),

    _end_case: _ => token(seq(
      /[eE][nN][dD]/,
      /\s+/,
      /[cC][aA][sS][eE]/,
    )),

    case_clause: $ => prec.right(seq(
      ci('CASE'),
      $._expression,
      $._newline,
      optional($._body),
    )),

    for_statement: $ => seq(
      ci('FOR'),
      $.identifier,
      '=',
      $._expression,
      ci('TO'),
      $._expression,
      optional(seq(ci('STEP'), $._expression)),
      $._newline,
      optional($._body),
      ci('NEXT'),
      optional($.identifier),
    ),

    loop_statement: $ => seq(
      ci('LOOP'),
      $._newline,
      optional($._body),
      ci('REPEAT'),
    ),

    goto_statement: $ => seq(
      choice(ci('GOTO'), ci('GO'), seq(ci('GO'), ci('TO'))),
      choice($.identifier, $.numeric_label),
    ),

    gosub_statement: $ => seq(
      choice(ci('GOSUB'), seq(ci('GO'), ci('SUB'))),
      choice($.identifier, $.numeric_label),
    ),

    on_statement: $ => seq(
      ci('ON'),
      $._expression,
      choice(ci('GOTO'), ci('GOSUB'), seq(ci('GO'), ci('TO')), seq(ci('GO'), ci('SUB'))),
      commaSep1(choice($.identifier, $.numeric_label)),
    ),

    return_statement: $ => seq(
      ci('RETURN'),
      optional(choice(
        seq(ci('TO'), choice($.identifier, $.numeric_label)),
        seq('(', $._expression, ')'),
      )),
    ),

    stop_statement: $ => seq(ci('STOP'), optional($._expression)),
    abort_statement: $ => seq(ci('ABORT'), optional($._expression)),
    end_statement: _ => ci('END'),
    null_statement: _ => ci('NULL'),
    continue_statement: _ => ci('CONTINUE'),
    exit_statement: _ => ci('EXIT'),
    while_statement: $ => seq(ci('WHILE'), $._expression, optional(ci('DO'))),
    until_statement: $ => seq(ci('UNTIL'), $._expression, optional(ci('DO'))),

    // =========================================
    // Subroutine Call Statements
    // =========================================
    call_statement: $ => seq(
      ci('CALL'),
      choice(
        $.identifier,
        seq('@', $.identifier),
        seq('*', $.identifier),
      ),
      optional($.argument_list),
    ),

    enter_statement: $ => seq(
      ci('ENTER'),
      $._expression,
    ),

    execute_statement: $ => seq(
      ci('EXECUTE'),
      $._expression,
      repeat(choice(
        seq(ci('CAPTURING'), $.identifier),
        seq(ci('RETURNING'), $.identifier),
        seq(ci('PASSLIST'), optional($.identifier)),
        seq(ci('RTNLIST'), optional($.identifier)),
        seq(ci('SETTING'), $.identifier),
      )),
    ),

    perform_statement: $ => seq(
      ci('PERFORM'),
      $._expression,
      repeat(choice(
        seq(ci('CAPTURING'), $.identifier),
        seq(ci('RETURNING'), $.identifier),
        seq(ci('PASSLIST'), optional($.identifier)),
        seq(ci('RTNLIST'), optional($.identifier)),
        seq(ci('SETTING'), $.identifier),
      )),
    ),

    chain_statement: $ => seq(
      ci('CHAIN'),
      $._expression,
    ),

    // =========================================
    // File I/O Statements
    // =========================================
    open_statement: $ => prec.right(seq(
      ci('OPEN'),
      optional(seq($._expression, ',')),
      $._expression,
      ci('TO'),
      $.lhs_expression,
      optional($._on_error_clause),
      optional($._then_else_clause),
    )),

    close_statement: $ => seq(
      ci('CLOSE'),
      $._expression,
      optional($._on_error_clause),
    ),

    read_statement: $ => prec.right(seq(
      choice(
        ci('READ'), ci('READL'), ci('READU'),
        ci('READV'), ci('READVL'), ci('READVU'),
        ci('MATREAD'), ci('MATREADL'), ci('MATREADU'),
      ),
      $.lhs_expression,
      ci('FROM'),
      $._expression, ',', $._expression,
      optional(seq(ci('ON'), ci('ERROR'), $._then_body)),
      optional(seq(ci('LOCKED'), $._then_body)),
      optional($._then_else_clause),
    )),

    write_statement: $ => prec.right(seq(
      choice(
        ci('WRITE'), ci('WRITEU'),
        ci('WRITEV'), ci('WRITEVU'),
        ci('MATWRITE'), ci('MATWRITEU'),
      ),
      $._expression,
      optional(seq(
        choice(ci('TO'), ci('ON')),
        $._expression, ',', $._expression,
      )),
      optional(seq(ci('ON'), ci('ERROR'), $._then_body)),
      optional($._then_else_clause),
    )),

    delete_statement: $ => prec.right(seq(
      choice(ci('DELETE'), ci('DELETEU')),
      $._expression, ',', $._expression,
      optional(seq(ci('ON'), ci('ERROR'), $._then_body)),
      optional($._then_else_clause),
    )),

    lock_statement: $ => prec.right(seq(
      ci('LOCK'),
      $._expression,
      optional($._then_else_clause),
    )),

    unlock_statement: $ => seq(
      ci('UNLOCK'),
      $._expression,
    ),

    release_statement: $ => seq(
      ci('RELEASE'),
      optional(seq($._expression, optional(seq(',', $._expression)))),
    ),

    filelock_statement: $ => prec.right(seq(
      ci('FILELOCK'),
      $._expression,
      optional($._on_error_clause),
      optional($._then_else_clause),
    )),

    fileunlock_statement: $ => seq(
      ci('FILEUNLOCK'),
      $._expression,
      optional($._on_error_clause),
    ),

    select_statement: $ => seq(
      choice(ci('SELECT'), ci('SSELECT')),
      optional($._expression),
      optional(seq(ci('TO'), $._expression)),
      optional($._on_error_clause),
    ),

    readnext_statement: $ => prec.right(seq(
      ci('READNEXT'),
      $.lhs_expression,
      optional(seq(ci('FROM'), $._expression)),
      optional($._then_else_clause),
    )),

    clearselect_statement: $ => seq(
      ci('CLEARSELECT'),
      optional($._expression),
    ),

    readlist_statement: $ => prec.right(seq(
      ci('READLIST'),
      $.lhs_expression,
      optional(seq(ci('FROM'), $._expression)),
      optional($._then_else_clause),
    )),

    writelist_statement: $ => seq(
      ci('WRITELIST'),
      $._expression,
      optional(seq(ci('TO'), $._expression)),
    ),

    getlist_statement: $ => prec.right(seq(
      ci('GETLIST'),
      $._expression,
      optional(seq(ci('TO'), $._expression)),
      optional($._then_else_clause),
    )),

    deletelist_statement: $ => seq(
      ci('DELETELIST'),
      $._expression,
    ),

    bscan_statement: $ => prec.right(seq(
      ci('BSCAN'),
      $.lhs_expression,
      ci('FROM'),
      $._expression, ',', $._expression,
      optional(seq(ci('USING'), $._expression)),
      optional(seq(ci('RESET')),),
      optional($._then_else_clause),
    )),

    clearfile_statement: $ => seq(
      ci('CLEARFILE'),
      $._expression,
      optional($._on_error_clause),
    ),

    // =========================================
    // Sequential File I/O
    // =========================================
    openseq_statement: $ => prec.right(seq(
      ci('OPENSEQ'),
      $._expression,
      optional(seq(',', $._expression)),
      ci('TO'),
      $.lhs_expression,
      optional(seq(ci('USING'), $.lhs_expression)),
      optional(seq(ci('ON'), ci('ERROR'), $._then_body)),
      optional(seq(ci('LOCKED'), $._then_body)),
      optional($._then_else_clause),
    )),

    readseq_statement: $ => prec.right(seq(
      ci('READSEQ'),
      $.lhs_expression,
      ci('FROM'),
      $._expression,
      optional(seq(ci('ON'), ci('ERROR'), $._then_body)),
      optional($._then_else_clause),
    )),

    writeseq_statement: $ => prec.right(seq(
      ci('WRITESEQ'),
      $._expression,
      choice(ci('TO'), ci('ON'), ci('APPEND')),
      $._expression,
      optional(seq(ci('ON'), ci('ERROR'), $._then_body)),
      optional($._then_else_clause),
    )),

    writeseqf_statement: $ => prec.right(seq(
      ci('WRITESEQF'),
      $._expression,
      choice(ci('TO'), ci('ON'), ci('APPEND')),
      $._expression,
      optional(seq(ci('ON'), ci('ERROR'), $._then_body)),
      optional($._then_else_clause),
    )),

    readblk_statement: $ => prec.right(seq(
      ci('READBLK'),
      $.lhs_expression,
      ci('FROM'),
      $._expression, ',', $._expression,
      optional(seq(ci('ON'), ci('ERROR'), $._then_body)),
      optional($._then_else_clause),
    )),

    writeblk_statement: $ => prec.right(seq(
      ci('WRITEBLK'),
      $._expression,
      choice(ci('TO'), ci('ON')),
      $._expression,
      optional(seq(ci('ON'), ci('ERROR'), $._then_body)),
      optional($._then_else_clause),
    )),

    seek_statement: $ => prec.right(seq(
      ci('SEEK'),
      $._expression,
      optional(seq(',', $._expression)),
      optional(seq(',', $._expression)),
      optional(seq(ci('ON'), ci('ERROR'), $._then_body)),
      optional($._then_else_clause),
    )),

    closeseq_statement: $ => seq(
      ci('CLOSESEQ'),
      $._expression,
      optional(seq(ci('ON'), ci('ERROR'), $._then_body)),
    ),

    weofseq_statement: $ => seq(
      ci('WEOFSEQ'),
      $._expression,
      optional(seq(ci('ON'), ci('ERROR'), $._then_body)),
    ),

    nobuf_statement: $ => seq(ci('NOBUF'), $._expression),
    flush_statement: $ => seq(ci('FLUSH'), $._expression),

    openpath_statement: $ => prec.right(seq(
      ci('OPENPATH'),
      $._expression,
      ci('TO'),
      $.lhs_expression,
      optional($._on_error_clause),
      optional($._then_else_clause),
    )),

    create_statement: $ => prec.right(seq(
      ci('CREATE'),
      $._expression,
      optional($._then_else_clause),
    )),

    status_statement: $ => seq(
      ci('STATUS'),
      $._expression,
      ci('TO'),
      $.lhs_expression,
    ),

    // =========================================
    // Print/Terminal I/O
    // =========================================
    print_statement: $ => seq(
      ci('PRINT'),
      optional(seq(ci('ON'), $._expression)),
      optional($.print_list),
    ),

    crt_statement: $ => seq(ci('CRT'), optional($.print_list)),
    display_statement: $ => seq(ci('DISPLAY'), optional($.print_list)),

    print_list: $ => seq(
      $._print_item,
      repeat(seq(choice(',', ':'), optional($._print_item))),
    ),

    _print_item: $ => $._expression,

    input_statement: $ => seq(
      choice(ci('INPUT'), ci('INPUTIF'), ci('INPUTDISP'), ci('INPUTDP')),
      optional(seq('@', '(', $._expression, ',', $._expression, ')')),
      optional(seq($.lhs_expression, optional(seq(
        optional(seq(',', $._expression)),
        optional(seq(':', $._expression)),
        optional(seq('_')),
      )))),
    ),

    heading_statement: $ => seq(
      choice(ci('HEADING'), ci('HEADINGE'), ci('HEADINGN')),
      $._expression,
    ),

    footing_statement: $ => seq(ci('FOOTING'), $._expression),
    page_statement: $ => seq(ci('PAGE'), optional($._expression)),

    printer_statement: $ => seq(
      ci('PRINTER'),
      choice(ci('ON'), ci('OFF'), ci('CLOSE'), ci('RESET')),
    ),

    hush_statement: $ => seq(ci('HUSH'), optional(choice(ci('ON'), ci('OFF'), $._expression))),
    break_statement: $ => seq(ci('BREAK'), optional(choice(ci('ON'), ci('OFF'), ci('KEY'), $._expression))),
    echo_statement: $ => seq(ci('ECHO'), optional(choice(ci('ON'), ci('OFF'), $._expression))),

    prompt_statement: $ => seq(ci('PROMPT'), $._expression),
    tabstop_statement: $ => seq(ci('TABSTOP'), $._expression),

    tprint_statement: $ => seq(
      ci('TPRINT'),
      optional(seq(ci('ON'), $._expression)),
      optional($.print_list),
    ),

    errmsg_statement: $ => seq(ci('ERRMSG'), $._expression, optional(seq(',', commaSep1($._expression)))),
    printerr_statement: $ => seq(ci('PRINTERR'), $._expression, optional(seq(',', commaSep1($._expression)))),

    data_statement: $ => seq(ci('DATA'), $._expression),
    cleardata_statement: _ => ci('CLEARDATA'),

    inputtrap_statement: $ => seq(ci('INPUTTRAP'), $._expression),
    keyedit_statement: $ => seq(ci('KEYEDIT'), commaSep1($._expression)),
    keytrap_statement: $ => seq(ci('KEYTRAP'), commaSep1($._expression)),
    keyexit_statement: $ => seq(ci('KEYEXIT'), commaSep1($._expression)),

    // =========================================
    // Tape I/O
    // =========================================
    readt_statement: $ => prec.right(seq(ci('READT'), $.lhs_expression, optional($._then_else_clause))),
    writet_statement: $ => prec.right(seq(ci('WRITET'), $._expression, optional($._then_else_clause))),
    rewind_statement: $ => prec.right(seq(ci('REWIND'), optional($._then_else_clause))),
    weof_statement: $ => prec.right(seq(ci('WEOF'), optional($._then_else_clause))),

    // =========================================
    // Device I/O
    // =========================================
    opendev_statement: $ => prec.right(seq(
      ci('OPENDEV'),
      $._expression,
      ci('TO'),
      $.lhs_expression,
      optional($._then_else_clause),
    )),

    get_statement: $ => prec.right(seq(
      choice(ci('GET'), ci('GETX')),
      $.lhs_expression,
      optional(seq(',', $._expression)),
      ci('FROM'),
      $._expression,
      optional(seq(ci('UNTIL'), $._expression)),
      optional(seq(ci('RETURNING'), $.lhs_expression)),
      optional(seq(ci('WAITING'), $._expression)),
      optional($._then_else_clause),
    )),

    send_statement: $ => prec.right(seq(
      ci('SEND'),
      $._expression,
      ci('TO'),
      $._expression,
      optional($._then_else_clause),
    )),

    ttyctl_statement: $ => seq(ci('TTYCTL'), $._expression, ',', $._expression),
    ttyget_statement: $ => seq(ci('TTYGET'), $.lhs_expression, optional(seq(ci('FROM'), $._expression))),
    ttyset_statement: $ => seq(ci('TTYSET'), $._expression, optional(seq(ci('TO'), $._expression))),

    // =========================================
    // Transaction Statements
    // =========================================
    begin_transaction_statement: $ => seq(
      ci('BEGIN'), ci('TRANSACTION'),
      optional(seq(ci('ISOLATION'), ci('LEVEL'), $._expression)),
    ),
    end_transaction_statement: _ => token(seq(
      /[eE][nN][dD]/,
      /\s+/,
      /[tT][rR][aA][nN][sS][aA][cC][tT][iI][oO][nN]/,
    )),
    commit_statement: _ => ci('COMMIT'),
    rollback_statement: _ => ci('ROLLBACK'),

    set_transaction_statement: $ => seq(
      ci('SET'), ci('TRANSACTION'), ci('ISOLATION'), ci('LEVEL'),
      $._expression,
    ),

    // =========================================
    // String Manipulation Statements
    // =========================================
    locate_statement: $ => prec.right(seq(
      ci('LOCATE'),
      $._expression,
      ci('IN'),
      $._expression,
      optional(seq(choice(',', ';'), $._expression)),
      optional(seq(ci('BY'), $._expression)),
      ci('SETTING'),
      $.lhs_expression,
      optional($._then_else_clause),
    )),

    find_statement: $ => prec.right(seq(
      ci('FIND'),
      $._expression,
      ci('IN'),
      $._expression,
      ci('SETTING'),
      $.lhs_expression, ',', $.lhs_expression, ',', $.lhs_expression,
      optional($._then_else_clause),
    )),

    findstr_statement: $ => prec.right(seq(
      ci('FINDSTR'),
      $._expression,
      ci('IN'),
      $._expression,
      ci('SETTING'),
      $.lhs_expression, ',', $.lhs_expression,
      optional($._then_else_clause),
    )),

    ins_statement: $ => seq(
      ci('INS'),
      $._expression,
      ci('BEFORE'),
      $._expression,
    ),

    del_statement: $ => seq(
      ci('DEL'),
      $._expression,
    ),

    remove_statement: $ => seq(
      choice(ci('REMOVE'), ci('REVREMOVE')),
      $._expression,
      ci('FROM'),
      $._expression,
      ci('SETTING'),
      $.lhs_expression,
    ),

    convert_statement: $ => seq(
      ci('CONVERT'),
      $._expression,
      ci('TO'),
      $._expression,
      ci('IN'),
      $.lhs_expression,
    ),

    matparse_statement: $ => seq(
      ci('MATPARSE'),
      $.identifier,
      ci('FROM'),
      $._expression,
      optional(seq(choice(',', ci('USING')), $._expression)),
      optional(seq(ci('SETTING'), $.lhs_expression)),
    ),

    matbuild_statement: $ => seq(
      ci('MATBUILD'),
      $.lhs_expression,
      ci('FROM'),
      $.identifier,
      optional(seq(',', $._expression, ',', $._expression)),
      optional(seq(ci('USING'), $._expression)),
    ),

    // =========================================
    // Other Statements
    // =========================================
    debug_statement: _ => ci('DEBUG'),
    sleep_statement: $ => seq(ci('SLEEP'), optional($._expression)),
    nap_statement: $ => seq(ci('NAP'), $._expression),
    precision_statement: $ => seq(ci('PRECISION'), $._expression),
    randomize_statement: $ => seq(ci('RANDOMIZE'), optional($._expression)),
    procread_statement: $ => prec.right(seq(ci('PROCREAD'), $.lhs_expression, optional($._then_else_clause))),
    procwrite_statement: $ => seq(ci('PROCWRITE'), $._expression),
    timeout_statement: $ => seq(ci('TIMEOUT'), $._expression, ',', $._expression),
    authorization_statement: $ => seq(ci('AUTHORIZATION'), $._expression),
    opencheck_statement: $ => prec.right(seq(ci('OPENCHECK'), $._expression, ci('TO'), $.lhs_expression, optional($._then_else_clause))),
    recordlockl_statement: $ => prec.right(seq(ci('RECORDLOCKL'), $._expression, ',', $._expression, optional($._then_else_clause))),
    recordlocku_statement: $ => prec.right(seq(ci('RECORDLOCKU'), $._expression, ',', $._expression, optional($._then_else_clause))),
    setrem_statement: $ => seq(ci('SETREM'), $._expression, ci('ON'), $._expression),
    inputclear_statement: _ => ci('INPUTCLEAR'),
    clearprompts_statement: _ => ci('CLEARPROMPTS'),

    // =========================================
    // Clauses (reused by many statements)
    // =========================================
    _then_else_clause: $ => prec.right(1, choice(
      // Single-line: THEN stmt ELSE stmt
      seq(ci('THEN'), optional($._then_body), optional(seq(ci('ELSE'), optional($._else_body)))),
      seq(ci('ELSE'), optional($._else_body)),
      // Multi-line: THEN \n body END [ELSE \n body END]
      seq(ci('THEN'), $._newline, optional($._body), choice(
        seq($._end_else, $._newline, optional($._body), ci('END')),
        ci('END'),
      )),
      // Multi-line standalone ELSE: ELSE \n body END
      seq(ci('ELSE'), $._newline, optional($._body), ci('END')),
    )),

    _on_error_clause: $ => seq(ci('ON'), ci('ERROR'), $._then_body),

    // =========================================
    // Expressions
    // =========================================
    _expression: $ => choice(
      $.primary_expression,
      $.unary_expression,
      $.binary_expression,
      $.logical_expression,
      $.comparison_expression,
      $.concatenation_expression,
      $.match_expression,
      $.if_expression,
      $.function_call,
      $.at_variable,
      $.at_function,
      $.parenthesized_expression,
      $.dynamic_array_access,
      $.substring_expression,
      $.array_access,
      $.format_expression,
    ),

    primary_expression: $ => choice(
      $.identifier,
      $.number,
      $.string,
    ),

    lhs_expression: $ => choice(
      $.identifier,
      $.array_access,
      $.dynamic_array_access,
      $.substring_expression,
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    unary_expression: $ => choice(
      prec(9, seq('-', $._expression)),
      prec(9, seq(ci('NOT'), $._expression)),
    ),

    binary_expression: $ => choice(
      prec.left(7, seq($._expression, '^', $._expression)),
      prec.left(7, seq($._expression, '**', $._expression)),
      prec.left(6, seq($._expression, '*', $._expression)),
      prec.left(6, seq($._expression, '/', $._expression)),
      prec.left(5, seq($._expression, '+', $._expression)),
      prec.left(5, seq($._expression, '-', $._expression)),
    ),

    logical_expression: $ => choice(
      prec.left(1, seq($._expression, ci('AND'), $._expression)),
      prec.left(1, seq($._expression, '&', $._expression)),
      prec.left(0, seq($._expression, ci('OR'), $._expression)),
      prec.left(0, seq($._expression, '!', $._expression)),
    ),

    comparison_expression: $ => prec.left(3, seq(
      $._expression,
      choice(
        '=', '#', '<>', '><',
        '<', '>', '<=', '>=', '=>', '=<', '#>',  '#<',
        ci('EQ'), ci('NE'), ci('LT'), ci('GT'), ci('LE'), ci('GE'),
      ),
      $._expression,
    )),

    concatenation_expression: $ => choice(
      prec.left(4, seq($._expression, choice(':', ci('CAT')), $._expression)),
      prec(4, seq($._expression, ':')),
    ),

    match_expression: $ => prec.left(3, seq(
      $._expression,
      choice(ci('MATCH'), ci('MATCHES')),
      $._expression,
    )),

    if_expression: $ => prec.right(2, seq(
      ci('IF'),
      $._expression,
      ci('THEN'),
      $._expression,
      ci('ELSE'),
      $._expression,
    )),

    format_expression: $ => prec.left(2, seq(
      $._expression,
      $.format_string,
    )),

    format_string: _ => /[0-9]*[RLT][#0-9]*/,

    // =========================================
    // Array/Dynamic Array Access
    // =========================================
    array_access: $ => prec(10, seq(
      $.identifier,
      '(',
      $._expression,
      optional(seq(',', $._expression)),
      ')',
    )),

    dynamic_array_access: $ => prec(10, seq(
      choice($.identifier, $.array_access),
      token.immediate('<'),
      $._expression,
      optional(seq(',', $._expression, optional(seq(',', $._expression)))),
      '>',
    )),

    substring_expression: $ => prec(10, seq(
      choice($.identifier, $.array_access, $.dynamic_array_access),
      '[',
      $._expression,
      ',',
      $._expression,
      ']',
    )),

    // =========================================
    // Function Calls
    // =========================================
    function_call: $ => prec(10, seq(
      $.identifier,
      $.argument_list,
    )),

    argument_list: $ => seq('(', optional(commaSep1(choice($._expression, $.mat_argument))), ')'),

    mat_argument: $ => seq(ci('MAT'), $.identifier),

    // =========================================
    // @Variables
    // =========================================
    at_variable: _ => token(seq('@', /[a-zA-Z][a-zA-Z0-9._]*/)),

    at_function: $ => seq('@', '(', $._expression, optional(seq(',', $._expression)), ')'),

    // =========================================
    // Terminals
    // =========================================
    identifier: _ => /[a-zA-Z$][a-zA-Z0-9._$%]*/,

    number: _ => token(choice(
      // Integer
      /[0-9]+/,
      // Decimal
      /[0-9]*\.[0-9]+/,
      /[0-9]+\.[0-9]*/,
      // Scientific notation
      /[0-9]*\.?[0-9]+[eE][+-]?[0-9]+/,
    )),

    string: _ => choice(
      seq('"', /[^"\n]*/, '"'),
      seq("'", /[^'\n]*/, "'"),
      seq('\\', /[^\\\n]*/, '\\'),
    ),
  },
});

/**
 * Comma-separated list (optional elements)
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}

/**
 * Comma-separated list (at least one element)
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
