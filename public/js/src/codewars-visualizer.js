
define(['backbone'],
function(backbone) 
{

return Backbone.View.extend({
  el: "div",

  initialize: function(options) {
    this.options = _.extend({

    }, options);

    this.mars = this.options.mars


    this.memorySize = this.mars.options.memorySize;


    var root = Math.sqrt(this.memorySize);
    this.gridWidth = parseInt(root*2);
    this.gridHeight = parseInt(root/2); 


    this.cells = [];
    this.$container = $('<div class="visualizer"></div>');
    for (var row=0; row < this.gridHeight; row++) {
      this.cells[row] = [];
      var $row = $('<div class="cellRow"></div>');
      for (var col=0; col < this.gridWidth; col++) {
        var $cell = $('<div class="cell"></div>');
        $row.append($cell);
        this.cells[row].push($cell);

        $cell.data("mars_position", {
          'row': row,
          'col': col,
          'memory': row*this.gridWidth+col,
        });
        $cell.on('click', _.bind(this.clickCell, this));
      }
      $row.append('<div style="clear: both"></div>');
      this.$container.append($row);
    }
    this.$el.append(this.$container);

    this.mars.on("mars:memoryChanged", _.bind(this.memoryChanged, this));
    this.mars.on("mars:instructionPointerChanged", _.bind(this.instructionPointerChanged, this));
    this.mars.on("mars:matchStarted", _.bind(this.matchStarted, this));
    this.mars.on("mars:threadSpawned", _.bind(this.threadSpawned, this));
    this.mars.on("mars:threadDied", _.bind(this.threadDied, this));
  },

  playerColor: function(playerNumber) {
    return playerNumber ? "#6060ff" : "#ff6060";
  },

  reset: function() {
    this.clearMemory;
    this.$container.find('.pc').remove();
  },

  clearMemory: function () {
    for (var row=0; row < this.gridHeight; row++) {
      for (var col=0; col < this.gridWidth; col++) {
        var $cell = this.cells[row][col];
        $cell.removeClass().addClass("cell");
      }
    }
  },

  cellAt: function(address) {
    var row = parseInt(address/this.gridWidth);
    var column = address % this.gridWidth;
    if (row == NaN || column == NaN || row < 0 || column < 0) {
      return null;
    }
    return this.cells[row][column];
  }, 

  touchMemoryLocation: function(address, player) {
    var $cell = this.cellAt(address);
    if (!$cell) {
      console.log("failed to get cell for: ", address)
      return;
    }
    var value = this.mars.memory[address]
    var instr = RedAsm.parseInstruction(value);
    var mneu = RedAsm.mneumonicFromOpcode(instr.opcode);
    $cell.removeClass().addClass("cell");
    if (mneu) {
      $cell.addClass(mneu.toLowerCase());
    }
    if (player)
      $cell.addClass("player"+(player.playerNumber % 8));
  },

  memoryChanged: function(address, size, thread) {
    while (--size >= 0) {
      this.touchMemoryLocation(address+size, thread ? thread.owner : null)
    }
  },
  instructionPointerChanged: function(PC, thread) {
    this.setInstructionCursor(thread);
  },

  setInstructionCursor: function(thread) {
    var $cell = this.cellAt(thread.PC);
    if (!$cell) {
      console.log("failed to get cell for: ", thread.PC)
      return;
    }
    var pos = $cell.position();
    if (!thread.$pc) {
      thread.$pc = $('<div class="pc player'+(thread.owner.playerNumber%8)+'"></div>');
      this.$container.append(thread.$pc);
    }

    thread.$pc.css('left', pos.left-2);
    thread.$pc.css('top', pos.top-2);
  },

  matchStarted: function(players) {
    this.clearMemory();
    this.players = players;
    for (var i=0; i <this.players.length; i++) {
      var player = this.players[i];
      var start = player.threads[0].PC;
      var end = start+player.compiledBytes.length;

      while (start<end) {
        this.touchMemoryLocation(start++, player);
      }
      this.setInstructionCursor(player.threads[0])

    }
  },

  threadSpawned: function(thread) {
    thread.$pc = $('<div class="pc player'+(thread.owner.playerNumber%8)+'"></div>');
    this.$container.append(thread.$pc);
    this.setInstructionCursor(thread)
  },

  threadDied: function(thread) {
    if (thread.$pc) {
      thread.$pc.remove();
      thread.$pc = null;
    }
  },

  clickCell: function(e) {
    var $cell = $(e.target)
    var pos = $cell.data("mars_position");
    this.trigger("mars:inspectAddress", this.mars, pos, $cell);
  },
 

});


});