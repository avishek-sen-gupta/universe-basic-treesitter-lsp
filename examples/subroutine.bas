SUBROUTINE MY.SUB(P.NAME, P.AGE)
*
* Simple subroutine example
*
CRT "Name: " : P.NAME
CRT "Age: " : P.AGE
*
IF P.AGE >= 18 THEN
   CRT "Adult"
END ELSE
   CRT "Minor"
END
*
RETURN
END
