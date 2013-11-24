define(['backbone', 'redscript-model', 'redscript-collection'],
function(backbone,   RedScriptModel,    RedScriptCollection)
{

return Backbone.View.extend({
  el: '<table class="table">',

  events: {
  },

  initialize: function(options) {
    this.options = _.extend({
    }, options || {})

    this.collection = new RedScriptCollection();
    this.collection.on('add', this.addOne, this);
    this.collection.on('reset', this.addAll, this);
    // this.collection.on('all', this.render, this);
    this.collection.fetch();
  },

  addOne: function(redScript) {
    var $row = $("<tr></tr>");
    $row.append("<td>"+redScript.get("scriptName")+"</td>");
    $row.append("<td>"+redScript.get("mtime")+"</td>");

    this.$el.append($row);
  },

  addAll: function() {
    this.$el.empty();
    this.collection.each(this.addOne, this);
  },


  addRow: function(name, mtime) {
    var model = new RedScriptModel({
      'scriptName': name,
      'mtime': mtime,
    });
    console.log("model", model)
    this.addOne(model);
  }


});

});

