# Code Tribes



## Overview


On game start a player's Tribe is initialized with 20 Random Viable Warriors.  
Players can inspect(disassemble) and name their warriors.  
Player will choose at least 4 Warriors to Battle.  
A Tribe can have a maximum of 30 Warriors in it, any excess individuals must be killed before starting a new Battle.  

## Battle

10 Rounds are played.  
A Round ends when either a single survivor remains or when 40960 steps have elapsed.  
At the end of each round survivors are scored: ```score = (numWarriors * (numWarriors-1)) / numSurvivors ```  
At the end of 10 rounds, warriors will be ranked by their total round scores.  
The player can review/replay any of the rounds.  
The player must choose to either Breed or Kill each warrior in the Battle.  


## Breeding

A random Parent is copied to the individual, with a 60% chance of single point mutations occurring.   
Up to 8 instructions will be mutated based on the following:  
- 10% - Opcode
- 13% - Parameter A Mode
- 32% - Parameter A Value
- 13% - Parameter B Mode
- 32% - Parameter B Value

A warrior is viable if it can survive 4096 cycles in an empty core.  
Non-viable warriors are discarded and a new one is generated.  

