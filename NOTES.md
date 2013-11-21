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

Users can edit/submit One Script online with GitHub authentication.  


### Battle Royale Round

At least 4 players -- up to 8.
Board locations are "Marked" by a player if they change the memory location.
If a Thread executes an Instruction Marked by a different Player, and later dies, the player who marked the location will be granted a Kill Point.

The round ends after 65,536 steps, or if there is only one player's threads left.


score = (numWarriors * (numWarriors-1)) / numSurvivors + killPoints

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
Match Scoring is 3 points for a win, 1 point for a tie, 0 points if 100% of all rounds ended in a tie.  
Players are ranked by their average score. 


### Battle Royale Leaderboard

Each script plays enough rounds of 8 player Free-For-All Matches to play each other script about 8 times.  
```(totalNumberOfPlayers - 1) / (playersPerMatch - 1) * timesToPlayEachOpponent```  
Match Scoring is ```score = (playersPerMatch * (playersPerMatch - 1)) / numSurvivors```  
Players are ranked by their average match score.  


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
```
// Rock
loop:   *loc = bomb
        loc += 4         // bomb every 4 locations
        jmp loop
bomb:   .DAT 0           // this is the bomb to drop
loc:    .DAT -1          // start bombing at loop-1
```

loc:    .DAT -1          // start bombing at loop-1
bomb:   .DAT 0           // this is the bomb to drop
start:  *loc = bomb
        loc += 4         // bomb every 4 locations
        jmp start


```
// Paper
paper:  src = 10           
copy:   *dest = *src      
        src -= 1
        dest -= 1
        if src != -2      
          jmp copy
        dest -= 4
        fork *dest
        dest -= 23
        jmp paper
src:    .DAT 8
dest:   .DAT 1222
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
