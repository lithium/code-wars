define(['backbone','localstorage', 'redscript-model'],
function(backbone,  localstorage,   RedScriptModel)
{

return Backbone.Collection.extend({
  model: RedScriptModel,
  localStorage: new Backbone.LocalStorage("codewars-redscripts"),
});

});
