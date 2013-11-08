


var Mars = Mars || {};

Mars.MarsCore = function(options) {
  return this.init(options);
}
_.extend(Mars.MarsCore.prototype, {
  init: function(options) {
    var defaults = {
      'memorySize': 4096,
    }
    this.options = _.extend(_.clone(defaults), options)

    this.memory = new Array(this.options.memorySize)
    this.players = null;
    return this;
  },



  startMatch: function(players) {

    this._memset(0,0,this.options.memorySize);

    //TODO: randomize players
    this.players = players;


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

      player.threads = [{
        PC: offset,
        running: true,
      }];
      player.currentThread = 0;
      player.runningThreadCount = 1;
      this._memcpy(offset, player.compiledBytes, player.compiledBytes.length);

      usedRanges.push({start: offset, end: offset+player.compiledBytes.length});
    }

    // initialize counters 
    this.stepCount = 0;
    this.cycleCount = 0;
    this.currentPlayer = 0;
    this.remainingPlayerCount = this.players.length;
  },

  executeOneCycle: function(player) {
    var thread = player.threads[player.currentThread];

    var instruction = this.memory[thread.PC];
    console.log("execute", instruction, thread, player);

    // thread.PC = ++thread.PC % this.options.memorySize;
    player.currentThread = ++player.currentThread % player.threads.length;
    this.currentPlayer = ++this.currentPlayer % this.players.length;

    if (!this.executeInstruction(thread, instruction)) {
      thread.running = false;
      if (--player.runningThreadCount < 1) {
        player.running = false;
        this.remainingPlayerCount--;
      }
    }
    this.cycleCount++;
  },
  executeNextStep: function() {
    if (this.remainingPlayerCount < 1)
      return;

    for (var i=0; i < this.players.length; i++) {
      this.executeOneCycle(this.players[i]);
    }

    if (this.remainingPlayerCount < 1) {
      console.log("remaining players tied on step ",this.stepCount);
    } else if (this.remainingPlayerCount < 2) {
      var winner;
      for (var i=0; i < this.players.length; i++) {
        if (this.players[i].running) {
          winner = this.players[i];
          break;
        }
      }
      console.log("only one player left ", winner);
    }

    this.stepCount++;
  },

  executeInstruction: function(thread, word) {
    var _advancePC = function() { 
      thread.PC = ++thread.PC % this.options.memorySize;
    }

    var instruction = RedAsm.parseInstruction(word)
    switch (instruction.opcode) {
      case RedAsm.OPCODE_LD:
        _advancePC.apply(this);
        return true;
      case RedAsm.OPCODE_ADD:
        var address = this.resolveAddress(thread.PC, instruction.operand1, instruction.mode1)
        var value = this.resolveValue(thread.PC, instruction.operand2, instruction.mode2)
        
        this.memory[address] += value;

        _advancePC.apply(this);
        return true;
      case RedAsm.OPCODE_SUB:
        _advancePC.apply(this);
        return true;
      case RedAsm.OPCODE_MUL:
        _advancePC.apply(this);
        return true;
      case RedAsm.OPCODE_DIV:
        _advancePC.apply(this);
        return true;
      case RedAsm.OPCODE_MOD:
        _advancePC.apply(this);
        return true;
      case RedAsm.OPCODE_CMP:
        _advancePC.apply(this);
        return true;
      case RedAsm.OPCODE_BRZ:
        _advancePC.apply(this);
        return true;
      case RedAsm.OPCODE_JMP:
        _advancePC.apply(this);
        return true;
      case RedAsm.OPCODE_FORK:
        _advancePC.apply(this);
        return true;
      case RedAsm.OPCODE_NOP:
        _advancePC.apply(this);
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
      return this.memory[addr] % this.options.memorySize;
    }

    return null;
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


