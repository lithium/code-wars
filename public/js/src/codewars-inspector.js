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
      'numberMonitorLines': 12,
    }, options || {})

    this.$heading = this.$('.inspector-heading')
    this.$value = this.$('.value')
    this.$monitor = this.$('.monitor')
  },

  inspectAddress: function(mars, position, $cell)
  {
    var value = mars.memory[position.memory];

    this.$heading.html( "Location: "+RedAsm.hexdump(position.memory, 3).toUpperCase() )
    // this.$value.html( RedAsm.decompile([value]) );

    this.$monitor.empty();

    var start = position.memory - parseInt(this.options.numberMonitorLines / 2);
    var slice = mars.memorySlice(start, this.options.numberMonitorLines);
    var source = RedAsm.decompileToRedscript(slice);

    for (var i=0; i < slice.length; i++) {
      var $row = $('<div class="monitor-row"></div>');
      var $addr = $('<span class="address"></span>');
      var $hex = $('<span class="hexdump"></span>');
      var $assembly = $('<span class="assembly"></span>');

      $addr.html(RedAsm.hexdump(start+i, 3).toUpperCase()+":");
      $hex.html(RedAsm.hexdump(slice[i]>>>0, 8));
      $assembly.html("; "+source[i]);

      if (start+i == position.memory) {
        $row.addClass("active");
      }

      $row.append($addr);
      $row.append($hex);
      $row.append($assembly);
      this.$monitor.append($row);
    }

    // this.$body.html(JSON.stringify(position));

    // this.$inspectorAddress.html(pos.memory.toString(16))
    // this.$inspectorValue.html(RedAsm.decompile([value]))
  },

  close: function() {
    this.trigger("mars:closeInspector")
  },

});

});
