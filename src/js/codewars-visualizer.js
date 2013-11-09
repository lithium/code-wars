CodeWarsVisualizer = Backbone.View.extend({
  el: "div",

  initialize: function(options) {
    this.options = _.extend({

    }, options);

    this.mars = this.options.mars


    this.memorySize = this.mars.options.memorySize;
    this.gridSize = Math.sqrt(this.memorySize);


    this.$el.html(this.gridSize+"x"+this.gridSize);
  },

  render: function() {

  },

})
