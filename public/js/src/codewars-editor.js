define(['backbone','ace/ace', 'redasm', 'text!templates/editor.html'], 
function(backbone,  ace,        RedAsm,   editorTemplate) 
{

return Backbone.View.extend({
  el: _.template(editorTemplate),

  events: {
    "click .btn.save": "saveAndCompile",
  },

  initialize: function(options) {
    this.options = _.extend({
      'initialScript': "",
    }, options || {})

    this.$editor = this.$(".aceEditor");
    this.$compiled = this.$(".compiledBytes");
    this.$messages = this.$(".compileMessages");
    this.$scriptName = this.$("input.scriptName");


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
      var line = this.editor.session.getLine(cursor.row)

      //strip label
      if (line.indexOf(':') != -1)
        line = line.replace(/.+:/,'')

      // var word = line.trim().split(/\s+/)[0]
      // if (word.toUpperCase() in RedAsm.MNEUMONICS) {
      //   // this.help.html(word);
      // } else {
      //   // this.help.html("");
      // }
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
        o.push(disasm[i].join(" "));
      }
      this.$compiled.html("<pre>"+o.join("\n")+"</pre>");

      this.message('');
      return true;

    }

    this.message(result.error);
    return false;
  },



});

});
