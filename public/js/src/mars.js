var Mars;
if (typeof exports == "undefined") {
  Mars = Mars || {}
} else {
  Mars = exports
}




Mars.MarsCore = function(options) {
  return this.init(options);
}
_.extend(Mars.MarsCore.prototype, {
  init: function(options) {
    var defaults = {
      'memorySize': 4096,
      'maxSteps': 0,
      'maxCycles': 0,
      'maxThreads': 0,
      'minPlayers': 2,
    }
    this.options = _.extend(_.clone(defaults), options)

    _.extend(this, Backbone.Events);

    this.memory = new Array(this.options.memorySize)
    this.reset();
    return this;
  },


  runBattle: function(players, numRounds) {
    // run numRounds of Rounds between all players, 
    // randomizing order/starting position each Round.
    var results = []
    var matchRunning;
    this.on("mars:roundComplete", function(roundResults) {
      matchRunning = false;
      results.push(_.clone(roundResults));
    })
    for (var i=0; i < numRounds; i++) {
      this.startMatch(players);
      matchRunning = true;
      while (matchRunning) {
        this.executeNextStep();
      }
      this.reset();
    }


    // return results;
    return this.aggregateMatchResults(results);
  },


  aggregateMatchResults: function(results) {
    var scores = {
      'results': results,
      'numRounds': results.length,
    }
    for (var i=0; i < results.length; i++) {
      var roundResult = results[i];
      for (var p=0; p < roundResult.players; p++) {
        var player = roundResult.players[p]
        if (!player.name in scores)
          scores[player.name] = 0;
        scores[player.name] += player.score
      }
    }

    return scores;
  },
   

  reset: function() {
    this._memset(0,0,this.options.memorySize);
    this.usedRanges = [];
    this.stepCount = 0;
    this.cycleCount = 0;
    this.players = [];
    this.trigger("mars:memoryChanged", 0, this.options.memorySize, null);
  },
  overlapsExistingRanges: function(offset, size) {
    for (var i=0; i < this.usedRanges.length; i++) {
      if ((offset >= this.usedRanges[i].start && offset <= this.usedRanges[i].end) ||
          (offset+size >= this.usedRanges[i].start && offset+size <= this.usedRanges[i].end))
      {
        return true;
      }
    }
    return false;
  },

  deployPlayer: function(player, memoryLocation) {
    var player = _.clone(player)

    if (!memoryLocation) { 
      var offset;
      do {
        offset = parseInt(Math.random() * this.options.memorySize);
      } while (this.overlapsExistingRanges(offset, player.compiledBytes.length));
      this.usedRanges.push({start: offset, end: offset+player.compiledBytes.length});
      memoryLocation = offset;
    }

    var thread = {
      PC: memoryLocation,
      threadNumber: 0,
      owner: player,
      running: true,
    };
    player.playerNumber = this.players.length;
    player.threads = [thread];
    player.runningThreadCount = 1;
    player.startingLocation = memoryLocation;
    player.currentThread = 0;
    player.running = true;

    this.players.push(player)
    this.remainingPlayerCount++;

    this._memcpy(memoryLocation, player.compiledBytes, player.compiledBytes.length);
    this.trigger("mars:memoryChanged", memoryLocation, player.compiledBytes.length, thread);

    this.trigger("mars:playerDeployed",  player);
  },

  startMatch: function(players) {

    if (players) {
      for (var p=0; p < players.length; p++) {
        this.deployPlayer(players[p]);
      }
    }

    this.players = _.shuffle(this.players);

    for (var i=0; i < this.players.length; i++) {
      var player = this.players[i];
      player.playerNumber = i;

      player.threads[0].running = true;
      player.currentThread = 0;
      player.running = true;
      this.trigger("mars:instructionPointerChanged", player.threads[0].PC, player.threads[0]);
    }

    // initialize counters 
    this.currentPlayer = 0;
    this.remainingPlayerCount = this.players.length;
    this.trigger("mars:matchStarted", this.players);
  },
  resetMatch: function(randomizePositions) {
    var players = _.map(this.players, _.clone)
    var randomizePositions = randomizePositions != null ? randomizePositions : true;

    this.stepCount = 0;
    this.cycleCount = 0;
    this.players = [];

    this._memset(0,0,this.options.memorySize);
    this.trigger("mars:memoryChanged", 0, this.options.memorySize, null);
    for (var i=0; i < players.length; i++) {
      var player = players[i];
      this.deployPlayer(player, randomizePositions ? null : player.startingLocation)
    }
  },

  executeOneCycle: function(player) {
    if (!player.running)
      return;

    var thread = player.threads[player.currentThread];
    while (!thread.running) {
      thread = player.threads[++player.currentThread % player.threads.length];
    }

    var instruction = this.memory[thread.PC];
    this.trigger("mars:beforeCycleExecute", thread, player);

    if (!this.executeInstruction(thread, instruction)) {
      thread.running = false;
      player.runningThreadCount--;
      this.trigger("mars:threadDied", thread);
      if (player.runningThreadCount < 1) {
        player.running = false;
        this.remainingPlayerCount--;
        player.lastCycle = this.cycleCount;
        this.trigger("mars:playerDied", player);
      }
    }
    this.cycleCount++;


    var failsafe = player.threads.length;
    do {
      player.currentThread = ++player.currentThread % player.threads.length;
    } while (--failsafe && player.runningThreadCount > 0 && !player.threads[player.currentThread].running);

    var failsafe = player.threads.length;
    do {
      this.currentPlayer = ++this.currentPlayer % this.players.length;
    } while (--failsafe && this.remainingPlayerCount > 0 && this.players[this.currentPlayer].runningThreadCount < 1);
  },
  executeNextStep: function() {
    if (this.remainingPlayerCount < 1)
      return;

    for (var i=0; i < this.players.length; i++) {
      this.executeOneCycle(this.players[i]);
    }

    this.stepCount++;

    if ((this.options.maxSteps && (this.stepCount >= this.options.maxSteps)) ||
        (this.options.maxCycles && (this.cycleCount >= this.options.maxCycles)) || 
        (this.remainingPlayerCount < this.options.minPlayers))
    {
      var score = (this.players.length*(this.players.length-1)) / this.remainingPlayerCount;

      for (var i=0; i < this.players.length; i++) {
        var player = this.players[i];
        player.score = player.running ? score : 0;
      }

      var results = {
        'stepCount': this.stepCount,
        'cycleCount': this.cycleCount,
        'remainingPlayers': this.remainingPlayerCount,
        'players': _.map(this.players, _.clone),
      }
      this.trigger("mars:roundComplete", results);

    }

  },

  loadMemory: function(address, value, thread) {
    this.memory[address] = value;
    this.trigger("mars:memoryChanged", address, 1, thread);
  },

  advancePC: function(thread, offset) { 
    var offset = offset != null ? offset : 1;
    this.loadPC(thread, thread.PC+offset);
  },
  loadPC: function(thread, address) { 
    thread.PC = address % this.options.memorySize;
    this.trigger("mars:instructionPointerChanged", thread.PC, thread);
  },


  executeInstruction: function(thread, word) {
    var instruction = RedAsm.parseInstruction(word)
    switch (instruction.opcode) {
      case RedAsm.OPCODE_MOV:
        var address = this.resolveAddress(thread, instruction.operand1, instruction.mode1, instruction.incdec1)
        var value = this.resolveValue(thread, instruction.operand2, instruction.mode2, instruction.incdec2)
        if (address == null || value == null)
          return false

        this.loadMemory(address, value, thread);
        this.advancePC(thread);
        return true;

      case RedAsm.OPCODE_ADD:
        var address = this.resolveAddress(thread, instruction.operand1, instruction.mode1, instruction.incdec1)
        var value = this.resolveValue(thread, instruction.operand2, instruction.mode2, instruction.incdec2)
        if (address == null || value == null)
          return false

        this.loadMemory(address, this.memory[address] + value, thread);
        this.advancePC(thread);
        return true;

      case RedAsm.OPCODE_SUB:
        var address = this.resolveAddress(thread, instruction.operand1, instruction.mode1, instruction.incdec1)
        var value = this.resolveValue(thread, instruction.operand2, instruction.mode2, instruction.incdec2)
        if (address == null || value == null)
          return false
        
        this.loadMemory(address, this.memory[address] - value, thread);
        this.advancePC(thread);
        return true;

      case RedAsm.OPCODE_MUL:
        var address = this.resolveAddress(thread, instruction.operand1, instruction.mode1, instruction.incdec1)
        var value = this.resolveValue(thread, instruction.operand2, instruction.mode2, instruction.incdec2)
        if (address == null || value == null)
          return false
        
        this.loadMemory(address, this.memory[address] * value, thread);
        this.advancePC(thread);
        return true;

      case RedAsm.OPCODE_DIV:
        var address = this.resolveAddress(thread, instruction.operand1, instruction.mode1, instruction.incdec1)
        var value = this.resolveValue(thread, instruction.operand2, instruction.mode2, instruction.incdec2)
        if (address == null || value == null)
          return false
        
        this.loadMemory(address, this.memory[address] / value, thread);
        this.advancePC(thread);
        return true;

      case RedAsm.OPCODE_MOD:
        var address = this.resolveAddress(thread, instruction.operand1, instruction.mode1, instruction.incdec1)
        var value = this.resolveValue(thread, instruction.operand2, instruction.mode2, instruction.incdec2)
        if (address == null || value == null)
          return false
        
        this.loadMemory(address, this.memory[address] % value, thread);
        this.advancePC(thread);
        return true;

      case RedAsm.OPCODE_SEQ:
        var op1 = this.resolveValue(thread, instruction.operand1, instruction.mode1, instruction.incdec1)
        var op2 = this.resolveValue(thread, instruction.operand2, instruction.mode2, instruction.incdec2)
        if (op1 == null || op1 == null)
          return false

        if (op1 == op2) {
          this.advancePC(thread, 2);
        } else {
          this.advancePC(thread, 1);
        }
        return true;

      case RedAsm.OPCODE_SNE:
        var op1 = this.resolveValue(thread, instruction.operand1, instruction.mode1, instruction.incdec1)
        var op2 = this.resolveValue(thread, instruction.operand2, instruction.mode2, instruction.incdec2)
        if (op1 == null || op1 == null)
          return false

        if (op1 != op2) {
          this.advancePC(thread, 2);
        } else {
          this.advancePC(thread, 1);
        }
        return true;

      case RedAsm.OPCODE_SLT:
        var op1 = this.resolveValue(thread, instruction.operand1, instruction.mode1, instruction.incdec1)
        var op2 = this.resolveValue(thread, instruction.operand2, instruction.mode2, instruction.incdec2)
        if (op1 == null || op1 == null)
          return false

        if (op1 < op2) {
          this.advancePC(thread, 2);
        } else {
          this.advancePC(thread, 1);
        }
        return true;

      case RedAsm.OPCODE_SGE:
        var op1 = this.resolveValue(thread, instruction.operand1, instruction.mode1, instruction.incdec1)
        var op2 = this.resolveValue(thread, instruction.operand2, instruction.mode2, instruction.incdec2)
        if (op1 == null || op1 == null)
          return false

        if (op1 >= op2) {
          this.advancePC(thread, 2);
        } else {
          this.advancePC(thread, 1);
        }
        return true;

      case RedAsm.OPCODE_JZ:
        var address = this.resolveAddress(thread, instruction.operand1, instruction.mode1, instruction.incdec1)
        var value = this.resolveValue(thread, instruction.operand2, instruction.mode2, instruction.incdec2)
        if (address == null)
          return false

        if (value == 0) {
          this.loadPC(thread, address);
        }
        else {
          this.advancePC(thread);
        }
        return true;

      case RedAsm.OPCODE_JNZ:
        var address = this.resolveAddress(thread, instruction.operand1, instruction.mode1, instruction.incdec1)
        var value = this.resolveValue(thread, instruction.operand2, instruction.mode2, instruction.incdec2)
        if (address == null)
          return false

        if (value != 0) {
          this.loadPC(thread, address);
        }
        else {
          this.advancePC(thread);
        }
        return true;

      case RedAsm.OPCODE_JMP:
        var address = this.resolveAddress(thread, instruction.operand1, instruction.mode1, instruction.incdec1)
        if (address == null)
          return false

        this.loadPC(thread, address);
        return true;

      case RedAsm.OPCODE_FORK:
        var address = this.resolveAddress(thread, instruction.operand1, instruction.mode1, instruction.incdec1)
        if (address == null)
          return false

        var threadCount = thread.owner.threads.length;
        if (this.options.maxThreads == 0 || threadCount < this.options.maxThreads) {
          var newThread = {
            PC: address,
            running: true,
            threadNumber: threadCount,
            owner: thread.owner,
          };
          thread.owner.threads.push(newThread);
          thread.owner.runningThreadCount++;
          this.trigger("mars:threadSpawned", newThread);
        }

        this.advancePC(thread);
        return true;

    }
    return false;
  },

  resolveAddress: function(thread, operand, mode, incdec) {
    if (mode == RedAsm.ADDR_MODE_IMMEDIATE) {
      return null;
    }

    var offset = operand;
    var relative = (thread.PC+offset) % this.options.memorySize;


    if (mode == RedAsm.ADDR_MODE_RELATIVE) {
      return relative;
    }

    //resolve indirect address
    if (mode == RedAsm.ADDR_MODE_INDIRECT) {
      addr = (thread.PC+this.memory[relative]) % this.options.memorySize;

      if (incdec == RedAsm.ADDR_MODE_PRE_DEC) {
        --this.memory[relative];
        addr = (thread.PC+this.memory[relative]) % this.options.memorySize;
        this.trigger("mars:memoryChanged", relative, 1, thread);
      }
      else if (incdec == RedAsm.ADDR_MODE_PRE_INC) {
        ++this.memory[relative];
        addr = (thread.PC+this.memory[relative]) % this.options.memorySize;
        this.trigger("mars:memoryChanged", relative, 1, thread);
      }
      else if (incdec == RedAsm.ADDR_MODE_POST_DEC) {
        addr = (thread.PC+this.memory[relative]) % this.options.memorySize;
        this.memory[relative]--;
        this.trigger("mars:memoryChanged", relative, 1, thread);
      }
      else if (incdec == RedAsm.ADDR_MODE_POST_INC) {
        addr = (thread.PC+this.memory[relative]) % this.options.memorySize;
        this.memory[relative]++;
        this.trigger("mars:memoryChanged", relative, 1, thread);
      }
    } else {
      return null;
    }

    if (addr < 0)
      addr += this.options.memorySize;
    return addr;
  },
  resolveValue: function(thread, operand, mode, incdec) {
    if (mode == RedAsm.ADDR_MODE_IMMEDIATE) {
      return (operand);
    }

    var addr = this.resolveAddress(thread, operand, mode, incdec);
    if (addr == null)
      return null;

    if (mode == RedAsm.ADDR_MODE_RELATIVE) {
      var value = this.memory[addr];
      if (incdec == RedAsm.ADDR_MODE_PRE_DEC) {
        value = --this.memory[addr];
      }
      else if (incdec == RedAsm.ADDR_MODE_PRE_INC) {
        value = ++this.memory[addr];
      }
      else if (incdec == RedAsm.ADDR_MODE_POST_DEC) {
        value = this.memory[addr]--;
      }
      else if (incdec == RedAsm.ADDR_MODE_POST_INC) {
        value = this.memory[addr]++;
      }
      return value;
    } else if (mode == RedAsm.ADDR_MODE_INDIRECT) {
      return this.memory[addr];
    }

    return null;

  },


  memorySlice: function(memoryLocation, size) {
    var slice = new Array(size);
    var written = 0;
    while (written < size) {
      slice[written++] = this.memory[memoryLocation];
      memoryLocation = ++memoryLocation % this.options.memorySize;
    }
    return slice;
  },

  _memset: function(memoryLocation, value, size) {
    var written = 0;
    while (written < size) {
      this.memory[written++] = value;
      memoryLocation = ++memoryLocation % this.options.memorySize;
    }
  },
  _memcpy: function(memoryLocation, srcBytes, size) {
    var destIdx = memoryLocation;
    var written = 0;
    while (written < size) {
      this.memory[memoryLocation] = srcBytes[written++];
      memoryLocation = ++memoryLocation % this.options.memorySize;
    }
  },

})


