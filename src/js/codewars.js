


AsmEditor = Backbone.View.extend({
  el: $('<textarea class="editor"></textarea>'),

  events: {
    'keydown ': "keyDown",
    'keyup': "keyUp",
    'change ': "change",
  },

  initialize: function() {

    this.contents = []

  },

  render: function() {
    this.$el.val(this.contents.join(''))
  },


  keyDown: function(evt) {
    if (evt.keyCode == 9) {
      return this.performTab(evt);
    }
    else if (evt.keyCode == 8) {
      return this.performBackspace(evt);
    }
    // console.log("code", evt.keyCode);

    return true;
  },
  keyUp: function(evt) {
    this.updateContents();
    return true;
  },
  change: function() {
    this.updateContents();
  },
  updateContents: function() {
    this.contents = this.$el.val().split('');
  }


  performTab: function() {

    var cursorPosition = this.$el.prop("selectionStart");
    this.contents.splice(cursorPosition, 0, ' ',' ',' ',' ');

    this.render();

    return false;
  },

  performBackspace: function() {
    var cursorPosition = this.$el.prop("selectionStart");

    var chars = this.contents.slice(cursorPosition-4,cursorPosition).join('')
    if (chars == "    ") {
      this.contents.splice(cursorPosition-4,4)
      this.render();
      return false;
    }

    return true;
  },

  performReturn: function() {

  },

});


CodeWarsConsole = Backbone.View.extend({
  el: $('#console.codewars'),

  events: {
    "click .save": "saveEditor",
  },

  initialize: function() {

    this.editor = new AsmEditor({el: this.$(".editor")});
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