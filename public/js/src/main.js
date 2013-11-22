
var main = function($, bootstrap,  underscore,  backbone,  ace, codewars) {

  console.log("main.js")

  window.application = new CodeWarsConsole();
  if (window.userProfile) {
    window.application.login(window.userProfile);
  }

};


require.config({
  baseUrl: 'js',
  shim: {
    'backbone': {
      deps: ['underscore','jquery'],
      exports: 'Backbone'
    },
    'underscore': {
      exports: '_'
    },
    'bootstrap': ['jquery'],
    'codewars-visualizer': ['backbone'],
    'codewars-console': ['backbone','ace'],
  },
  paths: {
    ace: 'ace-min/ace',
    bootstrap: 'bootstrap.min',

    'codewars': 'src/codewars',
    'codewars-visualizer': 'src/codewars-visualizer',
    'codewars-console': 'src/codewars-console',
  }
});


requirejs(['jquery','bootstrap','underscore','backbone','ace', 'codewars'], main);

