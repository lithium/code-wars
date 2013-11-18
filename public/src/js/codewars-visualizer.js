CodeWarsVisualizer = Backbone.View.extend({
  el: "div",

  initialize: function(options) {
    this.options = _.extend({

    }, options);

    this.mars = this.options.mars


    this.memorySize = this.mars.options.memorySize;


    var root = Math.sqrt(this.memorySize);
    this.gridWidth = parseInt(root*2);
    this.gridHeight = parseInt(root/2); 
    console.log("size", this.gridWidth, this.gridHeight);


    this.cells = [];
    this.$container = $('<div class="visualizer"></div>');
    for (var row=0; row < this.gridHeight; row++) {
      this.cells[row] = [];
      var $row = $('<div class="cellRow"></div>');
      for (var col=0; col < this.gridWidth; col++) {
        var $cell = $('<div class="cell"></div>');
        $row.append($cell);
        this.cells[row].push($cell);
      }
      $row.append('<div style="clear: both"></div>');
      this.$container.append($row);
    }
    this.$el.append(this.$container);

    this.mars.on("mars:memoryChanged", _.bind(this.memoryChanged, this));
    this.mars.on("mars:instructionPointerChanged", _.bind(this.instructionPointerChanged, this));
    this.mars.on("mars:matchStarted", _.bind(this.matchStarted, this));
    this.mars.on("mars:threadSpawned", _.bind(this.threadSpawned, this));
  },

  render: function() {

  },

  playerColor: function(playerNumber) {
    return playerNumber ? "#6060ff" : "#ff6060";
  },

  clearMemory: function () {
    for (var row=0; row < this.gridHeight; row++) {
      for (var col=0; col < this.gridWidth; col++) {
        var $cell = this.cells[row][col];
        $cell.css("background-color", "white");
        $cell.removeClass().addClass("cell");
      }
    }
  },

  cellAt: function(address) {
    var row = parseInt(address/this.gridWidth);
    var column = address % this.gridWidth;
    return this.cells[row][column];
  }, 

  touchMemoryLocation: function(address, player) {
    var $cell = this.cellAt(address);
    $cell.css("background-color", this.playerColor(player.playerNumber));
    var value = this.mars.memory[address]
    var instr = RedAsm.parseInstruction(value);
    var mneu = RedAsm.mneumonicFromOpcode(instr.opcode);
    if (mneu) {
      $cell.addClass(mneu.toLowerCase());
    } else {
      $cell.removeClass().addClass("cell");
    }
  },

  memoryChanged: function(address, value, thread) {
    this.touchMemoryLocation(address, thread.owner)
  },
  instructionPointerChanged: function(PC, thread) {
    this.setInstructionCursor(thread);
  },

  setInstructionCursor: function(thread) {
    var $cell = this.cellAt(thread.PC);
    var pos = $cell.position();
    if (thread.$pc) {
      thread.$pc.css('left', pos.left-2);
      thread.$pc.css('top', pos.top-2);
    }
  },

  matchStarted: function(players) {
    this.clearMemory();
    this.players = players;
    for (var i=0; i <this.players.length; i++) {
      var player = this.players[i];
      var start = player.threads[0].PC;
      var end = start+player.compiledBytes.length;

      player.threads[0].$pc = $('<div class="pc player'+player.playerNumber+'"></div>')
      this.$container.append(player.threads[0].$pc);

      while (start<end) {
        this.touchMemoryLocation(start++, player);
      }
      this.setInstructionCursor(player.threads[0])

    }
  },

  threadSpawned: function(thread) {
    thread.$pc = $('<div class="pc player'+thread.owner.playerNumber+'"></div>');
    this.$container.append(thread.$pc);
    this.setInstructionCursor(thread)
  },
 

})
