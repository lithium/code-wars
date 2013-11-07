# Code Wars

 > Your script must change itself in memory to survive.

<cite>GitHub Game Off 2013</cite>



## Idea

[Core Wars](http://corewar.co.uk/cwg.txt) for the Javascript Generation.  
Board is a circular memory buffer of 8192 locations.  
RedScript is eval()'able Javascript bindings for RedCode.  
Client is javascript hosted via GitHub pages.  

## Client

A Player edits their PlayerScript in the client.  
A RedScript reference is provided.  
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


