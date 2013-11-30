define(['backbone'],
function(backbone)
{

return Backbone.Router.extend({

  routes: {
    "help": 'help',
    'help/:mneumonic': 'help',

    'ref': 'reference',
    'ref/:topic': 'reference',

    '': 'reference',
  },


});

});
