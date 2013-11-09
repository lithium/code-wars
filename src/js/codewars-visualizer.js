CodeWarsVisualizer = Backbone.View.extend({
  el: "div",

  initialize: function(options) {
    this.options = _.extend({

    }, options);

    this.mars = this.options.mars


    this.memorySize = this.mars.options.memorySize;
    this.gridSize = Math.sqrt(this.memorySize);


    // this.$el.html(this.gridSize+"x"+this.gridSize);
    this.cells = [];
    var $container = $('<div class="visualizer"></div>');
    for (var row=0; row < this.gridSize; row++) {
      this.cells[row] = [];
      var $row = $('<div class="row"></div>');
      for (var col=0; col < this.gridSize; col++) {
        var $cell = $('<div class="cell"></div>');
        $row.append($cell);
        this.cells[row].push($cell);
      }
      $container.append($row);
    }
    this.$el.append($container);

    this.mars.on("mars:memoryChanged", _.bind(this.memoryChanged, this));
    this.mars.on("mars:instructionPointerChanged", _.bind(this.instructionPointerChanged, this));
    this.mars.on("mars:matchStarted", _.bind(this.matchStarted, this));
  },

  render: function() {

  },

  playerColor: function(playerNumber) {
    return playerNumber ? "blue" : "red";
  },

  clearMemory: function () {
    for (var row=0; row < this.gridSize; row++) {
      for (var col=0; col < this.gridSize; col++) {
        var $cell = this.cells[row][col];
        $cell.css("background", "none");
      }
    }
  },

  cellAt: function(address) {
    var row = parseInt(address/this.gridSize);
    var column = address % this.gridSize;
    return this.cells[row][column];
  }, 

  touchMemoryLocation: function(address, player) {
    var $cell = this.cellAt(address);
    $cell.css("background", this.playerColor(player.playerNumber));
  },

  memoryChanged: function(address, value, thread) {
    this.touchMemoryLocation(address, thread.owner)
  },
  instructionPointerChanged: function(PC, thread) {
    var $cell = this.cellAt(PC);
    var pos = $cell.position();
    thread.$pc.css('left', pos.left);
    thread.$pc.css('top', pos.top);
  },

  matchStarted: function(players) {
    this.clearMemory();
    this.players = players;
    for (var i=0; i <this.players.length; i++) {
      var player = this.players[i];
      var start = player.threads[0].PC;
      var end = start+player.compiledBytes.length;

      player.threads[0].$pc = $('<div class="pc"></div>')
      this.$el.append(player.threads[0].$pc);

      while (start<end) {
        this.touchMemoryLocation(start++, player);
      }

    }
  },
 

})
