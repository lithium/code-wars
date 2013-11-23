define(['backbone','text!templates/help.html'], 
function(backbone,  helpTemplate) 
{

return Backbone.View.extend({
  el: _.template(helpTemplate),

  events: {
  },

  initialize: function(options) {
    this.options = _.extend({
    }, options || {})

    // hide all topics
    this.showHelpFor();
  },

  showHelpFor: function(mneumonic) {
    this.$('section').hide();
    this.$('section#'+mneumonic).show();
  }

});


});
