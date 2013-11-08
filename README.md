# Code Wars

 > Your script must change itself in memory to survive.

<cite>&mdash; GitHub Game Off 2013</cite>



## Idea

[Core Wars](http://corewar.co.uk/cwg.txt) with a modern bent.  
Board is a circular memory buffer of 8192 locations.  
Client is javascript hosted via GitHub pages.  
Referee is node.js hosted via heroku instance.  

## Client

A Player edits their PlayerScript in the client.  
An assembler reference is provided.  
Players can Store/Load their PlayerScript from LocalStorage or ```<input type="file">```.  
Players identify themselves to the Referee with their Battle Preference:  

- player name
- number of opponents desired (min,max) default: (1,∞)
- PlayerScript

Referee returns to all participating Players Match Information:

- match identifier (sha1 player names in play order)
- player order (randomly assigned)
- winning player
- match result (sha1 of resulting memory)
- player info:
  - name
  - PlayerScript
  - starting memory location

Client can replay the match at the user's desired speed to visualize the match and verify the result.

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
    <td>cmp a,b</td>
    <td>CMP A,B</td>
    <td>Compare values A and B, if they are not equal skip next instruction.</td>
  </tr>
  <tr>
    <td>08</td>
    <td>brz dest, value</td>
    <td>JMZ A,B</td>
    <td>If value(A) is 0, jump to location dest(B).</td>
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

