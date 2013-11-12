

HelpPanel = Backbone.View.extend({
  el: "div",

  initialize: function() {

  }
})

CodeWarsConsole = Backbone.View.extend({
  el: $('#console.codewars'),

  events: {
    "click .save": "saveEditor",
    "click .step": "stepMars",
    "click .run": "runMars",
  },

  initialize: function() {
    this.output = this.$(".output");
    this.compiled = this.$(".compiled");

    this.help = this.$(".help.well");

    this.errors = this.$(".errors");

    this.editor = ace.edit(this.$(".editor")[0]);
    this.editor.setTheme("ace/theme/github");
    this.editor.setOption("firstLineNumber", 0);

    this.editor.selection.on("changeCursor", _.bind(this.editorCursorChanged, this));
    this.editor.focus();


    this.mars = new Mars.MarsCore()
    this.mars.on("mars:beforeCycleExecute", _.bind(this.beforeCycle, this));


    this.runButton = this.$(".btn.run"); 
    this.running = false;



    this.visualizer = new CodeWarsVisualizer({
      el: this.$(".memoryDisplay"), 
      mars: this.mars,
    });
  },

  render: function() {

  },

  login: function(profile) {
    this.profile = profile;
  },

  beforeCycle: function(thread, player) {

    var slice = this.mars.memorySlice(thread.PC - 3, 7);
    var source = RedAsm.decompile(slice);

    var $monitor = $('<div class="monitor"></div>');
    for (var i=0; i < slice.length; i++) {
      var $row = $('<div class="monitorRow"></div>');
      var $addr = $('<span class="address"></span>');
      var $hex = $('<span class="hexdump"></span>');
      var $assembly = $('<span class="assembly"></span>');

      $addr.html(RedAsm.hexdump(thread.PC-3+i, 3)+":");

      $hex.html(RedAsm.hexdump(slice[i]>>>0, 8));

      $assembly.html("; "+source[i]);

      if (i == 3) {
        $row.addClass("active");
      }

      $row.append($addr);
      $row.append($hex);
      $row.append($assembly);
      $monitor.append($row);
    }

    var $output = this.$('.dissassembly.player'+player.playerNumber+".thread"+thread.threadNumber);

    if ($output.length < 1) {
      $output = $('<div class="col-md-6 dissassembly player'+player.playerNumber+' thread'+thread.threadNumber+'"></div>');
      this.output.append($output);
    }
    $output.empty();

    var $title = $('<h4></h4>');
    $title.html("Player:"+player.playerNumber+" Thread:"+thread.threadNumber);
    $output.append($title)
    $output.append($monitor);


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

  saveEditor: function() {
    this.$('.pc').remove();
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
    this.stepMars();
    setTimeout(_.bind(this._runcycle, this), 10);
  },


})