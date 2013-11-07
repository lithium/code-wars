

CodeWarsConsole = Backbone.View.extend({
  el: $('#console.codewars'),

  events: {
    "click .save": "saveEditor",
  },

  initialize: function() {
    this.output = this.$(".output.compiled");

    this.errors = this.$(".errors");

    this.editor = ace.edit(this.$(".editor")[0]);
    this.editor.setTheme("ace/theme/github");
    this.editor.setOption("firstLineNumber", 0);
    this.editor.focus();
  },

  render: function() {

  },

  saveEditor: function() {
    var playerScript = this.editor.getValue();
    var result = RedAsm.compile(playerScript);
    if (result.success) {
      this.output.html(result.output.join("\n"));
      console.log(result.output)

    } else {
      this.errors.html(result.error);
    }


  },


})