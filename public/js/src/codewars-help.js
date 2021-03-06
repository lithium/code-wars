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

    Backbone.history.on('route', this.onRoute, this);

  },

  showHelpFor: function(mneumonic) {
    this.$('section').hide();
    this.$('section#'+mneumonic).show();
  },

  onRoute: function(router, name, args) {
    // console.log("onRoute", arguments)
    var section = args[0] || 'index'
    if (name == this.options.templateName) {
      this.trigger("codewars:route", name, section)
      this.showHelpFor(section)
    }
  },


});


});
