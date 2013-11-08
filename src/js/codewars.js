

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
  },

  initialize: function() {
    this.output = this.$(".output.compiled");

    this.help = this.$(".help.well");

    this.errors = this.$(".errors");

    this.editor = ace.edit(this.$(".editor")[0]);
    this.editor.setTheme("ace/theme/github");
    this.editor.setOption("firstLineNumber", 0);

    this.editor.selection.on("changeCursor", _.bind(this.editorCursorChanged, this));
    this.editor.focus();


    this.mars = new Mars.MarsCore()
  },

  render: function() {

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
    var playerScript = this.editor.getValue();
    var result = RedAsm.compile(playerScript);
    if (result.success) {
      var disasm = RedAsm.disassemble(result.compiledBytes);
      var o = [];
      for (var i=0; i < disasm.length; i++) {
        o.push(disasm[i].join(" "));
      }
      this.output.html(o.join("\n"));

      this.mars.startMatch([_.clone(result),result]);
    } else {
      this.errors.html(result.error);
    }


  },

  stepMars: function() {
    this.mars.executeNextStep();
  }


})