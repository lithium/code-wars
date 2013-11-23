define(['backbone','mars', 'text!templates/inspector.html'], 
function(backbone,  mars,   inspectorTemplate) 
{

return Backbone.View.extend({
  el: _.template(inspectorTemplate),

  events: {
    'click button.close': 'close',
  },

  initialize: function(options) {
    this.options = _.extend({
    }, options || {})

    this.$heading = this.$('.inspector-heading')
    this.$body = this.$('.inspector-body')
  },

  inspectAddress: function(mars, position, $cell)
  {
    console.log("inspect", position);
    this.$body.html(JSON.stringify(position));
    // var value = mars.memory[pos.memory];
    // this.$inspectorAddress.html(pos.memory.toString(16))
    // this.$inspectorValue.html(RedAsm.decompile([value]))
  },

  close: function() {
    this.trigger("mars:closeInspector")
  },

});

});
