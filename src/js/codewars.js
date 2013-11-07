

CodeWarsConsole = Backbone.View.extend({
  el: $('#console.codewars'),

  events: {
    "click .save": "saveEditor",
  },

  initialize: function() {

    // this.editor = new AsmEditor({el: this.$(".editor")});
    this.editor = ace.edit(this.$(".editor")[0]);
    this.editor.setTheme("ace/theme/github");

    this.output = this.$(".output.compiled");

    this.editor.el.focus();
  },

  render: function() {

  },

  saveEditor: function() {
    var playerScript = this.editor.val();
    var compiledScript = RedAsm.compile(playerScript);

    this.output.html(compiledScript);

  },


})