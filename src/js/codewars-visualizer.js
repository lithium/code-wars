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
  },

  render: function() {

  },

})
