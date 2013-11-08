


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

    thread.PC = ++thread.PC % this.options.memorySize;
    player.currentThread = ++player.currentThread % player.threads.length;
    this.currentPlayer = ++this.currentPlayer % this.players.length;

    if (!this.executeInstruction(thread.PC, instruction)) {
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

  executeInstruction: function(PC, instruction) {
    return false;
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


