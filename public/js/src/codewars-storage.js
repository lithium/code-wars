define(['backbone', 'redscript-model', 'redscript-collection'],
function(backbone,   RedScriptModel,    RedScriptCollection)
{

return Backbone.View.extend({
  el: '<table class="table">',

  events: {
  },

  initialize: function(options) {
    this.options = _.extend({
      'collection': new RedScriptCollection(),
    }, options || {})

    this.collection = this.options.collection;
    this.collection.on('add', this.addOne, this);
    this.collection.on('reset', this.addAll, this);
    this.collection.on('destroy', this.destroy, this);
    // this.collection.on('all', this.render, this);
    this.collection.fetch();
  },

  addOne: function(redScript) {
    var $row = $("<tr></tr>");
    var $name = $("<td>"+redScript.get("scriptName")+"</td>");
    $row.append($name);
    // $row.append("<td>"+redScript.get("mtime")+"</td>");

    redScript.$row = $row;

    var $actions = $row.append('<td class="actions">'+
      '<button class="btn btn-link edit"><span class="glyphicon glyphicon-edit"></span></button>'+
      '<button class="btn btn-link delete"><span class="glyphicon glyphicon-trash"></span></button>'+
      '</td>');
    $actions.find('.edit').on('click', _.bind(function() {
      this.trigger("codewars:editScript", redScript);
    }, this))
    $actions.find('.delete').on('click', _.bind(function() {
      redScript.destroy();
    }, this))

    redScript.on('change', function(model) {
      $name.html(model.get("scriptName"))
    })

    this.$el.append($row);
  },

  addAll: function() {
    this.$el.empty();
    this.collection.each(this.addOne, this);
  },


  addRow: function(name, mtime) {
    var model = this.collection.create({
      'scriptName': name,
      'mtime': mtime,
    });
    this.addOne(model);
  },

  destroy: function(model, collection, status) {
    model.$row.remove();
  },


});

});

