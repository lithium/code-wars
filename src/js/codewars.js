CodeWarsConsole = Backbone.View.extend({
  el: $('#console.codewars'),

  events: {
    "click .save": "saveEditor",
  },

  initialize: function() {

    this.editor = this.$(".editor.asm");

  },

  render: function() {

  },

  saveEditor: function() {
    console.log(this.editor.val())

  },

})