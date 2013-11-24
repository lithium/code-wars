
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
    'localstorage': {
      deps: ['backbone']
    }
  },
  paths: {
    text: 'text.require',
    bootstrap: 'bootstrap.min',
    localstorage: 'backbone.localStorage',

    'redasm': 'src/redasm',
    'mars': 'src/mars',
    'codewars-console': 'src/codewars-console',
    'codewars-visualizer': 'src/codewars-visualizer',
    'codewars-editor': 'src/codewars-editor',
    'codewars-help': 'src/codewars-help',
    'codewars-inspector': 'src/codewars-inspector',
    'codewars-storage': 'src/codewars-storage',

    'redscript-collection': 'src/collection-redscript',
    'redscript-model': 'src/model-redscript',
  }
});


requirejs(['text','jquery','ace/ace','bootstrap','underscore','backbone', 'codewars-console'], 
  function(text,   $,       ace,      bootstrap,  underscore,  backbone,   CodeWarsConsole) {

    $(function() {
      window.application = new CodeWarsConsole();
      if (window.userProfile) {
        window.application.login(window.userProfile);
      }
      $('body').html(application.$el) 
    })

  });

