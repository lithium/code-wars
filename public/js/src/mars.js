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
      'maxThreads': 128,
    }
    this.options = _.extend(_.clone(defaults), options)

    _.extend(this, Backbone.Events);

    this.memory = new Array(this.options.memorySize)
    this.players = null;
    return this;
  },


  runBattle: function(players, numRounds, maxSteps) {
    var results = []

    var matchRunning;
    var roundResults;

    this.on("mars:roundComplete", function(results) {
      matchRunning = false;
      roundResults = results;
    })
    for (var i=0; i < numRounds; i++) {
      this.startMatch(players);
      matchRunning = true;
      while (matchRunning) {
        this.executeNextStep();
      }
      results.push(_.clone(roundResults));
    }
    return results
  },


  

  startMatch: function(players) {

    this._memset(0,0,this.options.memorySize);

    this.players = _.map(_.shuffle(players), _.clone);

    var usedRanges = []
    var _overlapsRanges = function(offset) {
      for (var i=0; i < usedRanges.length; i++) {
        if (offset >= usedRanges[i].start && offset <= usedRanges[i].end) {
          return true;
        }
      }
      return false;
    }

    //place each player in a random memory location and spawn their first thread
    for (var i=0; i < this.players.length; i++) {
      var player = this.players[i];
      player.playerNumber = i;

      var offset;
      do {
        offset = parseInt(Math.random() * this.options.memorySize);
      } while (_overlapsRanges(offset));


      var thread = {
        PC: offset,
        running: true,
        threadNumber: 0,
        owner: player,
      };
      player.threads = [thread];
      player.currentThread = 0;
      player.runningThreadCount = 1;
      player.startingLocation = offset;
      player.running = true;
      this._memcpy(offset, player.compiledBytes, player.compiledBytes.length);

      usedRanges.push({start: offset, end: offset+player.compiledBytes.length});

      this.trigger("mars:instructionPointerChanged", thread.PC, thread);
    }

    // initialize counters 
    this.stepCount = 0;
    this.cycleCount = 0;
    this.currentPlayer = 0;
    this.remainingPlayerCount = this.players.length;

    this.trigger("mars:matchStarted", this.players);

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
      this.trigger("mars:threadDied", thread);
      if (--player.runningThreadCount < 1) {
        player.running = false;
        this.remainingPlayerCount--;
        player.lastCycle = this.cycleCount;
        this.trigger("mars:playerDied", player);
      }
    }
    this.cycleCount++;

    do {
      player.currentThread = ++player.currentThread % player.threads.length;
    } while (player.runningThreadCount > 0 && !player.threads[player.currentThread].running);

    do {
      this.currentPlayer = ++this.currentPlayer % this.players.length;
    } while (this.remainingPlayerCount > 0 && this.players[this.currentPlayer].runningThreadCount < 1);
  },
  executeNextStep: function() {
    if (this.remainingPlayerCount < 1)
      return;

    for (var i=0; i < this.players.length; i++) {
      this.executeOneCycle(this.players[i]);
    }

    this.stepCount++;

    if ((this.options.maxSteps && this.stepCount >= this.options.maxSteps) ||
        (this.options.maxCycles && this.cycleCount >= this.options.maxCycles))
    {
      for (var i=0; i < this.players.length; i++) {
        var player = this.players[i];
        if (!player.lastCycle) {
          player.lastCycle = this.cycleCount+player.playerNumber/10;
          this.remainingPlayerCount--;
        }
      }
    }

    if (this.remainingPlayerCount < 2) {
      var placements = _.sortBy(this.players, function(player) { 
        return player.lastCycle || this.cycleCount;
      });
      var results = {
        'stepCount': this.stepCount,
        'cycleCount': this.cycleCount,
        'currentPlayer': this.currentPlayer,
        'players': placements,
      }
      this.trigger("mars:roundComplete", results);
    } 

  },

  loadMemory: function(address, value, thread) {
    this.memory[address] = value;
    this.trigger("mars:memoryChanged", address, value, thread);
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
        var address = this.resolveAddress(thread.PC, instruction.operand1, instruction.mode1)
        var value = this.resolveValue(thread.PC, instruction.operand2, instruction.mode2)

        this.loadMemory(address, value, thread);
        this.advancePC(thread);
        return true;

      case RedAsm.OPCODE_ADD:
        var address = this.resolveAddress(thread.PC, instruction.operand1, instruction.mode1)
        var value = this.resolveValue(thread.PC, instruction.operand2, instruction.mode2)

        this.loadMemory(address, this.memory[address] + value, thread);
        this.advancePC(thread);
        return true;

      case RedAsm.OPCODE_SUB:
        var address = this.resolveAddress(thread.PC, instruction.operand1, instruction.mode1)
        var value = this.resolveValue(thread.PC, instruction.operand2, instruction.mode2)
        
        this.loadMemory(address, this.memory[address] - value, thread);
        this.advancePC(thread);
        return true;

      case RedAsm.OPCODE_MUL:
        var address = this.resolveAddress(thread.PC, instruction.operand1, instruction.mode1)
        var value = this.resolveValue(thread.PC, instruction.operand2, instruction.mode2)
        
        this.loadMemory(address, this.memory[address] * value, thread);
        this.advancePC(thread);
        return true;

      case RedAsm.OPCODE_DIV:
        var address = this.resolveAddress(thread.PC, instruction.operand1, instruction.mode1)
        var value = this.resolveValue(thread.PC, instruction.operand2, instruction.mode2)
        
        this.loadMemory(address, this.memory[address] / value, thread);
        this.advancePC(thread);
        return true;

      case RedAsm.OPCODE_MOD:
        var address = this.resolveAddress(thread.PC, instruction.operand1, instruction.mode1)
        var value = this.resolveValue(thread.PC, instruction.operand2, instruction.mode2)
        
        this.loadMemory(address, this.memory[address] % value, thread);
        this.advancePC(thread);
        return true;

      case RedAsm.OPCODE_SEQ:
        var op1 = this.resolveValue(thread.PC, instruction.operand1, instruction.mode1)
        var op2 = this.resolveValue(thread.PC, instruction.operand2, instruction.mode2)

        if (op1 == op2) {
          this.advancePC(thread, 2);
        } else {
          this.advancePC(thread, 1);
        }
        return true;

      case RedAsm.OPCODE_SNE:
        var op1 = this.resolveValue(thread.PC, instruction.operand1, instruction.mode1)
        var op2 = this.resolveValue(thread.PC, instruction.operand2, instruction.mode2)

        if (op1 != op2) {
          this.advancePC(thread, 2);
        } else {
          this.advancePC(thread, 1);
        }
        return true;

      case RedAsm.OPCODE_SLT:
        var op1 = this.resolveValue(thread.PC, instruction.operand1, instruction.mode1)
        var op2 = this.resolveValue(thread.PC, instruction.operand2, instruction.mode2)

        if (op1 < op2) {
          this.advancePC(thread, 2);
        } else {
          this.advancePC(thread, 1);
        }
        return true;

      case RedAsm.OPCODE_SGE:
        var op1 = this.resolveValue(thread.PC, instruction.operand1, instruction.mode1)
        var op2 = this.resolveValue(thread.PC, instruction.operand2, instruction.mode2)

        if (op1 >= op2) {
          this.advancePC(thread, 2);
        } else {
          this.advancePC(thread, 1);
        }
        return true;

      case RedAsm.OPCODE_JMP:
        var address = this.resolveAddress(thread.PC, instruction.operand1, instruction.mode1)

        this.loadPC(thread, address);
        return true;

      case RedAsm.OPCODE_FORK:
        var address = this.resolveAddress(thread.PC, instruction.operand1, instruction.mode1)

        var threadCount = thread.owner.threads.length;
        if (threadCount < this.options.maxThreads) {
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

  resolveAddress: function(PC, operand, mode) {
    if (mode == RedAsm.ADDR_MODE_IMMEDIATE) {
      return null;
    }

    var offset = RedAsm.signedCast12(operand);
    var addr = (PC+offset) % this.options.memorySize;
    if (mode == RedAsm.ADDR_MODE_RELATIVE) {
      return addr;
    }
    if (mode == RedAsm.ADDR_MODE_INDIRECT) {
      addr = (PC+this.memory[addr]) % this.options.memorySize;
      if (addr < 0)
        addr += this.options.memorySize;
      return addr
    } 

    return null
  },
  resolveValue: function(PC, operand, mode) {
    if (mode == RedAsm.ADDR_MODE_IMMEDIATE) {
      return RedAsm.signedCast12(operand);
    }

    var addr = this.resolveAddress(PC, operand, mode);
    if (addr == null)
      return null;
    return this.memory[addr];
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


