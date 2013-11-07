# Code Wars

 > Your script must change itself in memory to survive.

<cite>&mdash; GitHub Game Off 2013</cite>



## Idea

[Core Wars](http://corewar.co.uk/cwg.txt) for the Javascript Generation.  
Board is a circular memory buffer of 8192 locations.  
Client is javascript hosted via GitHub pages.  

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
    <td>jmp dest</td>
    <td>JMP B</td>
    <td>Jump to location dest(B).</td>
  </tr>
  <tr>
    <td>05</td>
    <td>brz dest, value</td>
    <td>JMZ A,B</td>
    <td>If value(A) is 0, jump to location dest(B).</td>
  </tr>
  <tr>
    <td>07</td>
    <td>cmp a,b</td>
    <td>CMP A,B</td>
    <td>Compare values A and B, if they are not equal skip next instruction.</td>
  </tr>

</table>

### Addressing Modes

<table>
  <tr><th>Addressing Mode</th><th>Examples</th></tr>
  <tr>
    <td>Immediate</td>
    <td><em>$42, $-5, $0xff, $'a'</em></td>
  </tr>
  <tr>
    <td>Relative</td>
    <td><em>(0x42), (-5), label</em></td>
  </tr>
  <tr>
    <td>Indirect</td>
    <td><em>@(-5), @label</em></td>
  </tr>

</table>


### Examples
```Assembly
# dwarf from cwg.pg#4
zero:     .BYTE 0        # 00 00 00    # var offset
loop:     add (-1), $4   # 01 -1 04    # offset += 4
          ld @zero, $0   # 02 -2 00    # mem[offset] = 0
          jmp loop       # 03 -2 00    # goto loop
```

