# Code Tribes



## Overview

8 Tribes start with 32 randomized Warriors.  
Players can inspect(disassemble) and name the warriors in their tribe.   
First Tournament immediately starts with default Evolution Strategy.  
Players then choose Evolution Strategy and can run tournaments in batches of: 1,10,50,100 generations.   


## Tournament

Each tribe holds its own tournament.  
All members of the tribe play 3 Rounds of Swiss-Pairing rounds.   
  Each round of swiss is Best-out-of 30 games.  
  Games are max 20,000 cycles.  
4 lowest scoring (lifetime) individuals are killed.
Top 8 all play each other. (56 Rounds)
Top 4 get to breed.


## Evolution Strategy

- Mate Selection
  - fitness
  - similarity/dissimilar
  - random
- Parent Dominance
  - Highest Score
  - Longest Lifetime
  - Random
- Reproduction Type -- weighted table
  - Asexual (copy from dominant parent)
  - Single Crossover
  - Double Crossover
- Mutation Chance -- % chance of mutation occuring
- Mutation Amount -- max number instructions to randomly mutate 
- Migration Chance -- % chance one individual from the tribe will im/emigrate to another tribe


## War

After 200 generations a war is held between the tribes.  
The top 2 warriors from each tribe all play each other. (16 warriors, 112 rounds)





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

