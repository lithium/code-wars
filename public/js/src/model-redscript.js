define(['backbone'],
function(backbone)
{

return RedScriptModel = Backbone.Model.extend({
  defaults: function() {
    return {
      scriptName: "",
      mtime: null,
      contents: null,
    }
  }

});

});
