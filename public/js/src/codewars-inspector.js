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


    if (this.options.mars) {
      this.options.mars.on("mars:memoryChanged", this.memoryChanged, this);


    }

    this.inspecting = null;

    this.$heading = this.$('.inspector-heading')
    this.$value = this.$('.value')
    this.$monitor = this.$('.monitor')
  },

  inspectAddress: function(mars, position, $cell)
  {
    this.$heading.html( "Location: "+RedAsm.hexdump(position.memory, 3).toUpperCase() )
    var start = position.memory - 2; //parseInt(this.options.numberMonitorLines / 2);
    this.inspecting = {
      'addr': position.memory, 
      'start':start, 
      'end':start+this.options.numberMonitorLines
    };
    this.updateDissassembly(this.inspecting.start, this.options.numberMonitorLines, this.inspecting.addr);
  },

  inspectPC: function(mars, thread, $pc)
  {
    this.$heading.html(thread.owner.name+"'s thread #"+thread.threadNumber);

    var start = thread.PC - 2;
    this.inspecting = {
      'addr': thread.PC, 
      'start': start, 
      'end': start+this.options.numberMonitorLines,
      'thread': thread,
    };

    mars.on('mars:instructionPointerChanged', _.bind(function(PC, changedThread) {
      if (this.inspecting.thread &&
          (this.inspecting.thread.owner.playerNumber == changedThread.owner.playerNumber) &&
          (this.inspecting.thread.threadNumber == changedThread.threadNumber))
      {
        // console.log("inspecting",this.inspecting.thread, changedThread)
        this.inspecting.addr = PC;
        this.inspecting.start = PC-2;
        this.inspecting.end = this.inspecting.start+this.options.numberMonitorLines;
        this.updateDissassembly();
      }

    },this))
    this.updateDissassembly();
  },
  
  memoryChanged: function(address, count, thread) {
    if (this.inspecting && 
        address >= this.inspecting.start &&
        address <= this.inspecting.end) {
      this.updateDissassembly();
    }
  },

  updateDissassembly: function(start, numLines, current) {
    var start = start || this.inspecting.start;
    var numLines = numLines || this.options.numberMonitorLines;
    var current = current || this.inspecting.addr;

    var slice = this.options.mars.memorySlice(start, numLines);
    var source = RedAsm.decompileToRedscript(slice);

    this.$monitor.empty();
    for (var i=0; i < slice.length; i++) {
      var $row = $('<div class="monitor-row"></div>');
      var $addr = $('<span class="address"></span>');
      // var $hex = $('<span class="hexdump"></span>');
      var $assembly = $('<span class="assembly"></span>');

      $addr.html(RedAsm.hexdump(start+i, 3).toUpperCase()+":");
      // $hex.html(RedAsm.hexdump(slice[i]>>>0, 12));
      $assembly.html(source[i]);

      if (start+i == current) {
        $row.addClass("active");
      }

      $row.append($addr);
      // $row.append($hex);
      $row.append($assembly);
      this.$monitor.append($row);
    }
  },

  close: function() {
    this.trigger("mars:closeInspector")
  },


});

});
