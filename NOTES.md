## Idea

[Core Wars](http://corewar.co.uk/cwg.txt) with a modern bent.  
Board is a circular memory buffer of 4096 locations.  
Client is javascript hosted via GitHub pages.  
Referee is node.js hosted via heroku instance.  

## Client

A Player edits their PlayerScript in the client.  
A PlayerScript reference is provided.  

Users can browse all Players Scripts.
Users can browse the Battle Royale rankings.  
Users can start a local match:
  - mirror match
  - vs rock, paper or scissors
  - vs a Script on a Leaderboard

Client can replay a match at the user's desired speed to visualize the match and verify the result.

## Referee

Users can submit Scripts by forking lithium/codewars-warrior  
Users can edit/submit Scripts online with GitHub authentication.  


### Battle Royale Round

At least 4 players.
Board locations are "Marked" by a player if they change the memory location.
If a Thread executes an Instruction Marked by a different Player, and later dies, the player who marked the location will be granted a Kill Point.

The round ends after 65,536 steps, or if there is only one player's threads left.

Last man standing is awarded a point bonus.

Players Score is: ```<numberOfCycles>*<killPoints+1>```

at least 100 Rounds are played in a Match.
A Players Match score is the average of his round scores.


### Infinite Battle

Every 5 minutes the server runs a Battle Royale Match.



### Championship Leaderboard

Each Script plays a Match against every other Script.  
Players are ranked by the Top score out of all their Scripts.  
A Match consists of a Best-of 100 rounds.  
Scoring is 2 points for a win, 1 point for a tie, 0 points if 100% of all rounds ended in a tie.  


### Battle Royale Leaderboard

The Script will play 100 Free-For-All Matches against 3 randomly selected Scripts. 3 new scripts will be selected for each new Match, will not match against a Script a second time until matched against all other scripts in the field at least once.  

Round/Match scoring:
* 1st: 8 points
* 2nd: 4 points
* 3rd: 2 points
* 4th: 0 points  

In the result of a tie, the points for both are divided evenly (e.g. 2nd and 3rd place tied, both players receive 3 points)  
Players in a Match are ranked by the sum of their Round Scores.  
Players are ranked on the Royale Hill by the sum of their Match scores from their royale pass.  


## RedScript

<table>
  <tr><th>Opcode</th><th>RedScript</th><th>RedCode</th><th>Action</th></tr>
  <tr>
    <td>00</td>
    <td>.DATA b</td>
    <td>DAT B</td>
    <td>Store value b at current location. Terminates process when evaluated.</td>
  </tr>
  <tr>
    <td>01</td>
    <td>dest = src</td>
    <td>MOV A,B</td>
    <td>Copy the value from src(A) into the location dest(B).</td>
  </tr>
  <tr>
    <td>02</td>
    <td>dest += src</td>
    <td>ADD A,B</td>
    <td>Add src(A) and dest(B) and store result at location dest.</td>
  </tr>
  <tr>
    <td>03</td>
    <td>dest -= src</td>
    <td>SUB A,B</td>
    <td>Subtract src(A) from dest(B) and store result at location dest.</td>
  </tr>
  <tr>
    <td>04</td>
    <td>dest *= src</td>
    <td>MUL A,B</td>
    <td>Multiply src(A) and dest(B) and store result at location dest.</td>
  </tr>
  <tr>
    <td>05</td>
    <td>dest /= src</td>
    <td>DIV A,B</td>
    <td>Divide src(A) from dest(B) and store result at location dest.</td>
  </tr>
  <tr>
    <td>06</td>
    <td>dest %= src</td>
    <td>MOD A,B</td>
    <td>Modulus src(A) and est(B) and store result at location dest.</td>
  </tr>
  <tr>
    <td>07</td>
    <td>if a == b:</td>
    <td>sne A,B</td>
    <td>Compare values A and B, if they are not equal skip the next instruction.</td>
  </tr>
  <tr>
    <td>08</td>
    <td>if a != b:</td>
    <td>seq A,B</td>
    <td>Compare values A and B, if they are equal skip the next instruction.</td>
  </tr>
  <tr>
    <td>09</td>
    <td>if a &lt; b:</td>
    <td>slt A,B</td>
    <td>If the value A is less than B, skip the next instruction.</td>
  </tr>
  <tr>
    <td>0A</td>
    <td>if a > b:</td>
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
    <td><em>42, -5, 0xf0</em></td>
  </tr>
  <tr>
    <td>Relative</td>
    <td><em>(0x42), (-5), label</em></td>
  </tr>
  <tr>
    <td>Indirect</td>
    <td><em>@42, @(-5), @label</em></td>
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

```
//Rock - Bomb
loop:   *loc = bomb
        loc += 4        // bomb every 4 locations
        jmp loop
bomb:   jmp (-4)        // this is the bomb to drop
loc:   .DAT -1          // start bombing immediately before ourself

```

## Rest API

GET /github-login
GET /github-callback

GET /user/:username   
  {username, avatar, script:{}}


POST /script
  source=  
  name=optional


GET /board/:board_name  
  [{username, script:{}, score, record:{wins,losses,ties}}]



## Redis Model

```
"user:username" -> {username, avatar}
"script:username" -> {sha1, username, scriptName, source, compiledBytes}
"script:sha1" -> {}

"scripts" -> ["script:username",...]

"match:script:username:script:username" -> [
  {order, script_sha1, username, score, record:{wins,losses,ties}}
]

"board:name" -> [
  {username, script_sha1, score, record}
]

```



# Evolving

[Thorsel, 99](http://corewar.co.uk/thorsell/paper.htm)
[Coleman, 98](http://www.eecs.tufts.edu/~colemanr/corewars.pdf)

The score is reported after all rounds have been played. A round ends either when a single surviving warrior remains or when a maximum number of cycles have elapsed. For each round, every surviving warrior is awarded points calculated from a score formula (F).
By default, this is F(W,S) = (W * W-1) / S, where W is the total number of warriors participating, S is the number of survivors, and “/” is integer division.
