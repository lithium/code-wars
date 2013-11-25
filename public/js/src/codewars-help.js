define(['backbone','text!templates/help.html', 'text!templates/reference.html'], 
function(backbone,  helpTemplate,               referenceTemplate) 
{


return Backbone.View.extend({
  events: {
  },

  initialize: function(options) {
    this.options = _.extend({
      'templateName': 'help',
    }, options || {})

    var theTemplate = this.options.templateName == 'reference' ? referenceTemplate : helpTemplate;
    this.setElement(_.template(theTemplate, this), false);

    this.showHelpFor('index');
  },

  showHelpFor: function(mneumonic) {
    this.$('section').hide();
    this.$('section#'+mneumonic).show();
  }

});


});
