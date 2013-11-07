

CodeWarsConsole = Backbone.View.extend({
  el: $('#console.codewars'),

  events: {
    "click .save": "saveEditor",
  },

  initialize: function() {
    this.output = this.$(".output.compiled");

    this.editor = ace.edit(this.$(".editor")[0]);
    this.editor.setTheme("ace/theme/github");
    this.editor.setOption("firstLineNumber", 0);
    this.editor.focus();
  },

  render: function() {

  },

  saveEditor: function() {
    var playerScript = this.editor.getValue();
    var compiledScript = RedAsm.compile(playerScript);

    this.output.html(compiledScript);

  },


})