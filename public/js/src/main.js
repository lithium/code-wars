
require.config({
  baseUrl: '',
  shim: {
    'backbone': {
      deps: ['underscore','jquery'],
      exports: 'Backbone'
    },
    'underscore': {
      exports: '_'
    },
    'bootstrap': ['jquery'],
    'redasm': ['backbone'],
    'mars': ['redasm','backbone'],
  },
  paths: {
    text: 'js/text.require',
    jquery: 'js/jquery',
    bootstrap: 'js/bootstrap.min',
    underscore: 'js/underscore',
    backbone: 'js/backbone',
    ace: 'js/ace-min/ace',

    'codewars': 'js/src/codewars',
    'redasm': 'js/src/redasm',
    'mars': 'js/src/mars',
    'codewars-visualizer': 'js/src/codewars-visualizer',
    'codewars-console': 'js/src/codewars-console',
    'codewars-editor': 'js/src/codewars-editor',
  }
});


requirejs(['text','jquery','ace','bootstrap','underscore','backbone', 'codewars'], 
  function(text,   $,       ace,  bootstrap,  underscore,  backbone,   CodeWarsConsole) {

    console.log("main", arguments)
    
    $(function() {
      window.application = new CodeWarsConsole();
      if (window.userProfile) {
        window.application.login(window.userProfile);
      }
      $('body').html(application.$el) 
    })

  });

