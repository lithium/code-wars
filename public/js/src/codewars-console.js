

define(['backbone','ace','codewars-visualizer', 'text!templates/console.html'], 
function(backbone,  ace,  CodeWarsVisualizer,    consoleTemplate) 
{

return Backbone.View.extend({
  el: _.template(consoleTemplate),

  events: {
    "click .save": "saveScript",
    "click .compile": "clickCompile",
    "click .step": "stepMars",
    "click .run": "runMars",
  },

  initialize: function() {
    this.output = this.$(".output");
    this.compiled = this.$(".compiled");

    this.help = this.$(".help.well");

    this.errors = this.$(".errors");

    this.scriptName = this.$(".scriptName");

    // this.editor = ace.edit(this.$(".editor")[0]);
    // this.editor.setTheme("ace/theme/github");
    // this.editor.setOption("firstLineNumber", 0);

    // this.editor.selection.on("changeCursor", _.bind(this.editorCursorChanged, this));
    // this.editor.focus();


    this.mars = new Mars.MarsCore()
    this.mars.on("mars:beforeCycleExecute", _.bind(this.beforeCycle, this));
    this.mars.on("mars:threadDied", _.bind(this.threadDied, this));
    this.mars.on("mars:roundComplete", _.bind(this.roundComplete, this));


    this.cycleCount = this.$(".cycleCount");
    this.stepCount = this.$(".stepCount");
    this.runButton = this.$(".btn.run"); 
    this.running = false;


    this.clockDivider = 4;

    this.visualizer = new CodeWarsVisualizer({
      el: this.$(".memoryDisplay"), 
      mars: this.mars,
    });


  },

  render: function() {
    var $h1 = this.$('h1')

    if (this.profile) {
      $h1.empty();
      $h1.append("> Welcome ");
      if (this.profile.avatar)
        $h1.append( $('<img class="avatar" src="'+this.profile.avatar+'">') );
      $h1.append(this.profile.username);
    }

    if (this.profile.script) {
      this.editor.setValue(this.profile.script.source);
      this.scriptName.val(this.profile.script.scriptName);
    }
  },

  login: function(profile) {
    this.profile = profile;
    this.render();
  },

  beforeCycle: function(thread, player) {
    this.cycleCount.html(this.mars.cycleCount);
    this.stepCount.html(this.mars.stepCount);

    // var slice = this.mars.memorySlice(thread.PC - 3, 7);
    // var source = RedAsm.decompile(slice);

    // var $monitor = $('<div class="monitor"></div>');
    // for (var i=0; i < slice.length; i++) {
    //   var $row = $('<div class="monitorRow"></div>');
    //   var $addr = $('<span class="address"></span>');
    //   var $hex = $('<span class="hexdump"></span>');
    //   var $assembly = $('<span class="assembly"></span>');

    //   $addr.html(RedAsm.hexdump(thread.PC-3+i, 3)+":");

    //   $hex.html(RedAsm.hexdump(slice[i]>>>0, 8));

    //   $assembly.html("; "+source[i]);

    //   if (i == 4) {
    //     $row.addClass("active");
    //   }

    //   $row.append($addr);
    //   $row.append($hex);
    //   $row.append($assembly);
    //   $monitor.append($row);
    // }

    var $output = this.$('.dissassembly.player'+player.playerNumber);

    if ($output.length < 1) {
      $output = $('<div class="col-md-6 dissassembly player'+player.playerNumber+'"></div>');
      this.output.append($output);
    }
    $output.empty();

    var $title = $('<h4></h4>');
    $title.html("Player"+player.playerNumber);
    $output.append($title)

    $output.append("Threads: "+player.runningThreadCount);
    // $output.append($monitor);


    // console.log(source);
  },

  editorCursorChanged: function(evt, selection) {
      var cursor = selection.getCursor()
      var line = this.editor.session.getLine(cursor.row)
      if (line.indexOf(':') != -1)
        line = line.replace(/.+:/,'')
      var word = line.trim().split(/\s+/)[0]
      if (word.toUpperCase() in RedAsm.MNEUMONICS) {
        // this.help.html(word);
      } else {
        // this.help.html("");
      }
  },

  clickCompile: function() {
    this.$('.pc').remove();
    this.$('.dissassembly').remove();
    var playerScript = this.editor.getValue();
    var result = RedAsm.compile(playerScript);
    if (result.success) {
      var disasm = RedAsm.disassemble(result.compiledBytes);
      var o = [];
      for (var i=0; i < disasm.length; i++) {
        o.push(disasm[i].join(" "));
      }
      this.compiled.html("<pre>"+o.join("\n")+"</pre>");

      this.visualizer.clearMemory();
      this.running = false;
      this.mars.startMatch([_.clone(result),result]);
    } else {
      this.errors.html(result.error);
    }

  },


  saveScript: function() {
    var playerScript = this.editor.getValue();
    var name = this.scriptName.val();
    var form = {'name': name, 'source': playerScript}
    $.post('/script/', form, function(data) {
      console.log(data);
    })

  },

  stepMars: function() {
    this.mars.executeNextStep();
  },

  runMars: function() {
    this.running = !this.running;
    if (this.running) {
      this._runcycle();
      this.runButton.addClass("btn-primary");
    } else {
      this.runButton.removeClass("btn-primary");
    }
  },

  _runcycle: function() {
    if (!this.running) 
      return;
    for (var i=0; i < this.clockDivider; i++) {
      this.stepMars();
    }
    setTimeout(_.bind(this._runcycle, this), 10);
  },


  threadDied: function(thread) {
    console.log("thread died", thread)
    this.beforeCycle(thread, thread.owner);
    if (thread.$pc) {
      thread.$pc.remove();
      thread.$pc = null;
    }
  },

  playerDied: function(player) {
    console.log("player died", player);

  },

  roundComplete: function(results) {
    this.running = false;
    this.runButton.removeClass("btn-primary");
    console.log("roundComplete", results)
  },
});


});
