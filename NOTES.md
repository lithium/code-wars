## Idea

[Core Wars](http://corewar.co.uk/cwg.txt) with a modern bent.  
Board is a circular memory buffer of 4096 locations.  
Client is javascript hosted via GitHub pages.  
Referee is node.js hosted via heroku instance.  

## Client

A Player edits their PlayerScript in the client.  
A PlayerScript reference is provided.  


Client can replay the match at the user's desired speed to visualize the match and verify the result.

## Referee

Users can submit Scripts by forking lithium/codewars-warrior.
Users can edit/submit Scripts online with GitHub authentication.



## Championship

Each Script plays a Match against every other Script.
Players are ranked by the Top score out of all their Scripts.
A Match consists of a Best-of 100 rounds.
Scoring is 2 points for a win, 1 point for a tie, 0 points if 100% of all rounds ended in a tie.


## Battle Royale

The Script will play 100 Free-For-All Matches against 3 randomly selected Scripts. 3 new scripts will be selected for each new Match, will not match against a Script a second time until matched against all other scripts in the field at least once.

Round/Match scoring:
* 1st: 8 points
* 2nd: 4 points
* 3rd: 2 points
* 4th: 0 points
In the result of a tie, the points for both are divided evenly (e.g. 2nd and 3rd place tied, both players receive 3 points)
Players in a Match are ranked by the sum of their Round Scores.

Players are ranked on the Royale Hill by the sum of their Match scores from their royale pass.


## RedAsm

### Opcodes

<table>
  <tr><th>Opcode</th><th>RedAsm</th><th>RedCode</th><th>Action</th></tr>
  <tr>
    <td>00</td>
    <td>.BYTE b</td>
    <td>DAT B</td>
    <td>Store value b at current location. Terminates process when evaluated.</td>
  </tr>
  <tr>
    <td>01</td>
    <td>ld dest, src</td>
    <td>MOV A,B</td>
    <td>Copy the value from src(A) into the location dest(B).</td>
  </tr>
  <tr>
    <td>02</td>
    <td>add dest, src</td>
    <td>ADD A,B</td>
    <td>Add src(A) and dest(B) and store result at location dest.</td>
  </tr>
  <tr>
    <td>03</td>
    <td>sub dest, src</td>
    <td>SUB A,B</td>
    <td>Subtract src(A) from dest(B) and store result at location dest.</td>
  </tr>
  <tr>
    <td>04</td>
    <td>mul dest, src</td>
    <td>MUL A,B</td>
    <td>Multiply src(A) and dest(B) and store result at location dest.</td>
  </tr>
  <tr>
    <td>05</td>
    <td>div dest, src</td>
    <td>DIV A,B</td>
    <td>Divide src(A) from dest(B) and store result at location dest.</td>
  </tr>
  <tr>
    <td>06</td>
    <td>mod dest, src</td>
    <td>MOD A,B</td>
    <td>Modulus src(A) and est(B) and store result at location dest.</td>
  </tr>
  <tr>
    <td>07</td>
    <td>sne a,b</td>
    <td>sne A,B</td>
    <td>Compare values A and B, if they are not equal skip the next instruction.</td>
  </tr>
  <tr>
    <td>08</td>
    <td>seq a,b</td>
    <td>seq A,B</td>
    <td>Compare values A and B, if they are equal skip the next instruction.</td>
  </tr>
  <tr>
    <td>09</td>
    <td>slt a,b</td>
    <td>slt A,B</td>
    <td>If the value A is less than B, skip the next instruction.</td>
  </tr>
  <tr>
    <td>0A</td>
    <td>sgt a,b</td>
    <td>--</td>
    <td>If the value A is greater than B, skip the next instruction.</td>
  </tr>
  <tr>
    <td>0D</td>
    <td>jmp dest</td>
    <td>JMP B</td>
    <td>Jump to location dest(B).</td>
  </tr>
  <tr>
    <td>0E</td>
    <td>fork dest</td>
    <td>SPL B</td>
    <td>Spawn a new thread that will start at dest.</td>
  </tr>
  <tr>
    <td>0F</td>
    <td>NOP</td>
    <td>NOP</td>
    <td>Do nothing.</td>
  </tr>

</table>

### Addressing Modes

<table>
  <tr><th></th><th>Addressing Mode</th><th>Examples</th></tr>
  <tr>
    <td>Immediate (constants)</td>
    <td><em>42, -5, 0xf0, $ff</em></td>
  </tr>
  <tr>
    <td>Relative</td>
    <td><em>(0x42), (-5), label</em></td>
  </tr>
  <tr>
    <td>Indirect</td>
    <td><em>@42, @(-5), @$ff, @label</em></td>
  </tr>

</table>


### Examples
```Assembly
# dwarf from cwg.pg#4
 ofs:     .BYTE 0        # var ofs = 0
loop:     add (-1), $4   # ofs += 4
          ld @ofs, $0    # memory[ofs] = 0
          jmp loop       # goto loop
```

