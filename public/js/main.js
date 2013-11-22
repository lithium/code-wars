
require.config({
  shim: {
    'backbone': {
      deps: ['underscore','jquery'],
      exports: 'Backbone'
    },
    'underscore': {
      exports: '_'
    },
    'bootstrap': ['jquery'],
    'redasm': {
      exports: 'RedAsm',
      deps: ['backbone'],
    },
    'mars': {
      deps: ['redasm','backbone'],
      exports: 'Mars',
    },
  },
  paths: {
    text: 'text.require',
    bootstrap: 'bootstrap.min',

    'codewars': 'src/codewars',
    'redasm': 'src/redasm',
    'mars': 'src/mars',
    'codewars-visualizer': 'src/codewars-visualizer',
    'codewars-console': 'src/codewars-console',
    'codewars-editor': 'src/codewars-editor',
  }
});


requirejs(['text','jquery','ace/ace','bootstrap','underscore','backbone', 'codewars'], 
  function(text,   $,       ace,      bootstrap,  underscore,  backbone,   CodeWarsConsole) {

    $(function() {
      window.application = new CodeWarsConsole();
      if (window.userProfile) {
        window.application.login(window.userProfile);
      }
      $('body').html(application.$el) 
    })

  });

