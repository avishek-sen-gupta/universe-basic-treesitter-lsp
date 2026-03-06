* Simple Hello World program
PROGRAM HELLO.WORLD
*
PRINT "Hello, World!"
*
* Variable assignments
NAME = "John"
AGE = 25
SALARY = 50000.75
*
* String concatenation
GREETING = "Hello, " : NAME : "! You are " : AGE : " years old."
CRT GREETING
*
* IF statement - single line
IF AGE >= 18 THEN PRINT "Adult" ELSE PRINT "Minor"
*
* IF statement - multi-line
IF AGE > 21 THEN
   PRINT "Over 21"
   PRINT "Can drink"
END ELSE
   PRINT "Under 21"
END
*
* FOR loop
FOR I = 1 TO 10 STEP 2
   PRINT I
NEXT I
*
* LOOP..REPEAT
COUNTER = 0
LOOP
   COUNTER += 1
WHILE COUNTER < 5 DO
   CRT COUNTER
REPEAT
*
* BEGIN CASE
BEGIN CASE
   CASE AGE < 13
      CRT "Child"
   CASE AGE < 20
      CRT "Teenager"
   CASE 1
      CRT "Adult"
END CASE
*
* Subroutine call
CALL MY.SUB(NAME, AGE)
*
* GOSUB
GOSUB 100
*
* GOTO
GOTO DONE
*
100:
   CRT "In subroutine at label 100"
   RETURN
*
DONE:
*
* Array operations
DIM NAMES(10)
NAMES(1) = "Alice"
NAMES(2) = "Bob"
MAT NAMES = ""
*
* Dynamic array
REC = ""
REC<1> = "Field1"
REC<2,1> = "Value1"
REC<2,2> = "Value2"
*
* String functions
X = LEN(NAME)
Y = TRIM(NAME)
Z = INDEX(NAME, "o", 1)
*
* File I/O
OPEN "", "CUSTOMERS" TO CUST.FILE ELSE STOP "Cannot open file"
READ REC FROM CUST.FILE, "001" THEN
   PRINT REC
END ELSE
   PRINT "Record not found"
END
*
* EQUATE
EQUATE TRUE TO 1
EQUATE FALSE TO 0
*
* COMMON block
COMMON /SHARED/ A, B, C
*
STOP
END
