define(['backbone','ace/ace', 'redasm', 'text!templates/editor.html'], 
function(backbone,  ace,        RedAsm,   editorTemplate) 
{

return Backbone.View.extend({
  el: _.template(editorTemplate),

  events: {
    "click .btn.save": "saveAndCompile",
    "click .pane.compiledBytes .close": "closeCompilePane",
  },

  initialize: function(options) {
    this.options = _.extend({
      'initialScript': "",
    }, options || {})

    this.$editorPane = this.$(".pane.fileEditor")
    this.$compiledPane = this.$(".pane.compiledBytes");


    this.$messages = this.$(".compileMessages");
    this.$scriptName = this.$("input.scriptName");
    this.$compiled = this.$(".compiledOutput");
    this.$editor = this.$(".aceEditor");

    this.editor = ace.edit(this.$editor[0]);
    this.editor.setTheme("ace/theme/github");
    this.editor.setOption("firstLineNumber", 0);

    this.editor.selection.on("changeCursor", _.bind(this.editorCursorChanged, this));
    this.editor.focus();

    if (this.options.initialScript) {
      this.editor.setValue(this.options.initialScript);
    }

  },

  editorCursorChanged: function(evt, selection) {

      //get current line
      var cursor = selection.getCursor()
      var line = this.editor.session.getLine(cursor.row).toLowerCase()

      //strip label
      if (line.indexOf(':') != -1)
        line = line.replace(/.+:/,'')

      jumpTable = {
        'data': /\.dat/,
        'add': /\+=/,
        'sub': /-=/,
        'mul': /\*=/,
        'div': /\/=/,
        'mod': /%=/,
        'mov': /[^=!<>+\-*\/%]=/,
        'seq': /!=/,
        'sne': /==/,
        'sge.1': /<[^=]/,
        'sge.2': />[^=]/,
        'slt.1': />=/,
        'slt.2': /<=/,
        'jmp': /jmp/,
        'fork': /fork/,
      }
      for (var mneumonic in jumpTable) {
        if (jumpTable[mneumonic].test(line)) {
          this.trigger("codewars:helpContext", mneumonic)
          break;
        }
      }
  },


  saveAndCompile: function() {
    this.saveScript();
    this.compileScript();
  },


  message: function(msg) {
    this.$messages.html(msg);
  },


  saveScript: function() {
    var playerScript = this.editor.getValue();
    var name = this.$scriptName.val();
    var form = {'name': name, 'source': playerScript}
    $.post('/script/', form, function(data) {
      this.message(JSON.stringify(data));
    })

    this.trigger("codewars:scriptSaved", name, playerScript);
  },

  compileScript: function() {
    var script = this.editor.getValue();
    var result = RedAsm.compile(script);

    if (result.success) {
      var disasm = RedAsm.disassemble(result.compiledBytes);
      var o = [];
      for (var i=0; i < disasm.length; i++) {
        o.push('<div class="nowrap">'+disasm[i][0]+": "+disasm[i][6]+'</div>');
      }

      this.$compiled.html(o.join(""));

      if (!this.compiledShown) { 
        this.$compiledPane.toggleClass("col-md-0 col-md-3")
        this.$editorPane.toggleClass("col-md-12 col-md-9")
        this.compiledShown = true;
      }

      this.message('Compiled successfully.');
      return true;
    }

    this.$compiled.html('');
    this.message(result.error);
    return false;
  },

  closeCompilePane: function() {
    if (this.compiledShown) {
      this.$compiled.html("")
      this.$compiledPane.toggleClass("col-md-0 col-md-3")
      this.$editorPane.toggleClass("col-md-12 col-md-9")
      this.compiledShown = false;
    }

  },


});

});
