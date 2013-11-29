## Idea

[Core Wars](http://corewar.co.uk/cwg.txt) with a modern bent.  
Board is a circular memory buffer of 4096 locations.  
Client is javascript hosted via GitHub pages.  
Referee is node.js hosted via heroku instance.  

## Client

A Player edits their PlayerScript in the client.  
A PlayerScript reference is provided.  

Users can browse all Players Scripts.
Users can start a local match:
  - mirror match
  - vs rock, paper and/or scissors
  - vs a Script on a Leaderboard

Client can replay a match at the user's desired speed to visualize the match and verify the result.

## Referee

Users can edit/submit One Script online with GitHub authentication.  


### Championship Leaderboard

Each Script plays a Match against every other Script.  
Players are ranked by the Top score out of all their Scripts.  
A Match consists of a Best-of 100 rounds.  
Match Scoring is 3 points for a win, 1 point for a tie, 0 points if 100% of all rounds ended in a tie.  
Players are ranked by their average score. 


### Battle Royale Leaderboard

Each script plays enough 8 player Free-For-All Matches to play each other script about 8 times.  
Number of matches will be ```(totalNumberOfPlayers - 1) / (playersPerMatch - 1) * timesToPlayEachOpponent```  
Match Scoring is ```matchScore = (playersPerMatch * (playersPerMatch - 1)) / numSurvivors```  
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
    <td>if a >= b:</td>
    <td>sge A,B</td>
    <td>If the value A is greater than or equal to B, skip the next instruction.</td>
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
  <tr><th>Addressing Mode</th><th>Examples</th></tr>
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
        loc += 8         // bomb every 4 locations
        jmp loop
bomb:   .dat 42          // this is the bomb to drop
loc:    .DAT 7           // start bombing at loop+7
```



```
// Paper
paper:  *--dest = *--src        // copy ourself to new location
        jnz paper, src          
        fork *++dest            // fork to new copy at next line
        src = 8                 // reset src pointer to our size
        dest -= 100             // pick a new destination
        jmp paper               // start over again
src:    .dat 8                  // our size
dest:   .dat 1234
```

```
// Scissors
scan:   start += 21             // scan every 21 spaces in memory, 
        end += 21
        if *start != *end       // if 2 locations are different 
            jmp snip            // we found something to snip
        jmp scan                // else keep scanning

snip:   if start == 0xfff       // if we wrapped around and found 
            jmp clear           // ourself proceed to core clear

erase:  *--end = bomb           // erase with fork bombs
        if end != start         // until we filled scan range
            jmp erase
        end += 12               // reset end pointer
        jmp scan                // resume scanning

clr:    *start++ = 0            // do a core clear, but skip ourself
        start %= 4096
        jnz clr, start
clear:  start = 6 
        jmp clr

start:  .dat 0                  // start of scan pointer
end:    .dat 12                 // end of scan pointer
bomb:   fork bomb               // fork bomb constant
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

###### Github users
```
"user:username" -> {username, avatar, token}

```

###### Scripts
```
"script:username" -> {sha1, username, scriptName, source, compiledBytes}
"script:sha1" -> {}
"scripts" -> ["script:username",...]
```

###### Matches
```
"queuedScripts" -> ["script:username",...]

"board:name" -> [
  {username, script_sha1, score:{total,wins,losses,ties}, record:{
    username: {script_sha1, record:{}},
    ...
  }
]
```


## Backbone Hierarchy


- CodewarsConsole (game console + login / username)
  - Editor Tabs
    - CodewarsEditor (ace + byte code + compile/save buttons)
  - CodewarsHelp (help model + rankings model + browse)
  - MarsDisplay (memory + player/cycle summary + step/run/speed)
  - MarsInspector (memory debugger + active player detail)
