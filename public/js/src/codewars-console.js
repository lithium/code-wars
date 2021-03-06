

define(['backbone',
        'mars',
        'redasm',
        'codewars-editor',
        'codewars-help', 
        'codewars-visualizer', 
        'codewars-inspector', 
        'codewars-storage', 
        'codewars-rankings', 
        'redscript-collection', 
        'text!templates/console.html'], 
function(backbone,  
         mars,  
         redasm,  
         CodeWarsEditor,   
         CodeWarsHelp,    
         CodeWarsVisualizer,    
         CodeWarsInspector,    
         CodeWarsStorage,    
         CodeWarsRankings,    
         RedScriptCollection,
         consoleTemplate) 
{



return Backbone.View.extend({
  el: _.template(consoleTemplate),

  events: {
    "click .btn.newEditorTab": "newEditorTab",

    "click .clearMars": "clearMars",
    "click .stepMars": "clickStepMars",
    "click .runMars": "runMars",
    "click .resetMars": "resetMars",
    "click .toggleFlash": "toggleFlash",
    "click .toggleDebug": "toggleDebug",

    "click .contextForward": "contextForward",
    "click .contextBack": "contextBack",
  },


  initialize: function() {
    this.$editPane = this.$(".pane.edit")
    this.$debugPane = this.$(".pane.debug")
    this.$inspectorPane = this.$(".pane.inspector")

    this.$navTabs = this.$(".editors .nav.nav-pills")
    this.$tabContent = this.$(".editors .tab-content")
    this.editors = []


    this.$compilerMessages = this.$(".compilerMessages")

    this.$stepCount = this.$(".stepCount")
    this.$cycleCount = this.$(".cycleCount")


    this.scriptCollection = new RedScriptCollection();


    this.mars = new Mars.MarsCore()
    this.mars.on("mars:roundComplete", this.roundComplete, this);
    this.roundStarted = false

    this.$flash = this.$(".toggleFlash");
    this.$runButton = this.$(".runMars");
    this.running = false;
    this.flash = false;
    this.toggleFlash();



    this.visualizer = new CodeWarsVisualizer({
      mars: this.mars,
    });
    this.$('.visualizerContainer').html(this.visualizer.$el)


    this.help = new CodeWarsHelp({'templateName': 'help'})
    this.$('.helpContainer').html(this.help.$el)

    this.reference = new CodeWarsHelp({'templateName': 'reference'})
    this.$('.referenceContainer').html(this.reference.$el)

    this.inspector = new CodeWarsInspector({
      'mars': this.mars,
    })
    this.$('.inspectorContainer').html(this.inspector.$el)
    this.visualizer.on('mars:inspectAddress', this.inspectAddress, this);
    this.visualizer.on('mars:inspectPC', this.inspectPC, this);
    this.inspector.on('mars:closeInspector', this.closeInspector, this);

    this.storageBrowser = new CodeWarsStorage({
      'collection': this.scriptCollection,
    })
    this.$('.storageContainer').html(this.storageBrowser.$el);

    this.storageBrowser.on('codewars:editScript', this.openScriptInTab, this);

    this.rankings = new CodeWarsRankings({
    })
    this.$('.rankingsContainer').html(this.rankings.$el);
    this.rankings.on('codewars:openScript', this.openRankingScript, this);

    this.openEditors = {}

    this.playerScript = this.scriptCollection.add()
    this.playerScriptEditor = this.addEditorTab(this.playerScript);
    
    this.clearMars();

    this.$('a[href="#contextHelp"]').click(_.bind(function() {
      this.help.showHelpFor('index');
    }, this));
    this.$('a[href="#contextReference"]').click(_.bind(function() {
      this.reference.showHelpFor('index');
    }, this));

    this.reference.on('codewars:route', this.showReference, this);
    this.help.on('codewars:route', this.showHelp, this);

    this.startingHistory = history.length;
  },

  openDebug: function() {
    this.$editPane.removeClass('expanded')
    this.$debugPane.removeClass('obscured')
  },
  toggleDebug: function() {
    this.$debugPane.toggleClass('obscured')
    this.$editPane.toggleClass('expanded')
    if (this.$debugPane.hasClass('obscured'))
      this.closeInspector();
  },
  openInspector: function() {
    this.$inspectorPane.removeClass('obscured')
  },
  closeInspector: function() {
    this.$inspectorPane.addClass('obscured')
  },

  showReference: function() {
    this.$('a[href="#contextReference"]').tab("show");
    this.closeInspector();
  },
  showHelp: function() {
    this.$('a[href="#contextHelp"]').tab("show");
    this.closeInspector();
  },

  openRankingScript: function(script) {
    var redScript = this.scriptCollection.add({});
    console.log("redscript",redScript)
    redScript.set({
      'scriptName': script.username+"'s "+script.scriptName,
      'contents': script.source,
    })
    this.openScriptInTab(redScript);


  },

  openScriptInTab: function(redScript) {
    if (redScript.cid in this.openEditors) {
      var $editor = this.openEditors[redScript.cid];
      if ($.contains(document.body, $editor.$nav[0])) {
        $editor.$nav.find('a').tab("show");
        return;
      }
    }
    
    var $editor = this.addEditorTab(redScript);
    this.openEditors[redScript.cid] = $editor;
  },

  inspectAddress: function(mars, position, $cell) {
    this.inspector.inspectAddress(mars, position, $cell);
    this.openInspector();
  },

  inspectPC: function(mars, thread, $pc) {
    this.inspector.inspectPC(mars, thread, $pc);
    this.openInspector();
  },

  render: function() {

  },

  login: function(profile) {
    this.profile = profile;


    if (this.profile) {
      var $h1 = this.$('h1')
      $h1.empty();
      $h1.append("> Welcome ");
      $h1.append(this.profile.username);

      var $login = this.$('.login')
      $login.empty()
      if (this.profile.avatar) {
        $login.append( $('<img class="avatar" src="'+this.profile.avatar+'">') );
      }
      $login.append(this.profile.username)

      if (this.profile.script && this.playerScriptEditor) {
        this.playerScriptEditor.setValue(this.profile.script.source);
        this.playerScriptEditor.setName(this.profile.script.scriptName);
      }
    }


  },


  addEditorTab: function(redScript, hideCloseButton) {
    var name = redScript != null ? redScript.get("scriptName") : '(unnamed)';
    var hideCloseButton = hideCloseButton != null ? hideCloseButton : false;

    var nav_template = _.template('<li><a href="#editor-tab<%= tabId %>" data-toggle="tab"><span class="tabName"><%= tabName %></span><% if (close) { %> <button type="button" class="close" aria-hidden="true">&times;</button> <% } %></a></li>');
    var tab_template = _.template('<div class="tab-pane " id="editor-tab<%= tabId %>"></div>');
    var context =  {
      tabId: this.editors.length,
      tabName: name,
      close: !hideCloseButton,
    }
    var $nav = $(nav_template(context));
    var $tab = $(tab_template(context));

    var editor = new CodeWarsEditor({
      'collection': this.scriptCollection,
      'model': redScript,
    })
    editor.$nav = $nav;
    editor.$tab = $tab;
    $tab.append(editor.$el)
    this.editors.push(editor);

    editor.on("codewars:compilerMessage", this.compilerMessage, this);
    editor.on("codewars:helpContext", this.helpContext, this);
    editor.on("codewars:scriptDeployed", this.scriptDeployed, this);
    editor.on("codewars:scriptNameChanged", function(editor, newName) {
      $nav.find('a .tabName').html(newName)
    }, this);

    $nav.find('.close').on('click', _.bind(function() {
      var done = _.bind(function() {
        var wasActive = $nav.hasClass("active");
        $nav.remove();
        $tab.remove();
        if (wasActive) {
          this.$navTabs.find('a:last').tab('show')
        }
      }, this);

      if (editor.isDirty) {
        this.compilerMessage('File is not saved', done)
      }
      else if (this.$navTabs.find('li').length > 1) {
        done();
      }
    }, this));

    $nav.on("click", _.bind(function() {
      // this.compilerMessage('');
    }, this));

    this.$navTabs.append($nav);
    this.$tabContent.append($tab);

    $tab.ready(_.bind(function() {
      $nav.find('a').tab("show");
      this.compilerMessage('');
    }, this))

    return editor;
  },

  compilerMessage: function(msg, type) {
    this.$compilerMessages.html(msg)
  },
  helpContext: function(mneumonic) {
    this.help.showHelpFor(mneumonic);
    this.showHelp();
  },
  scriptDeployed: function(scriptName, compiledBytes) {
    this.openDebug();

    var player = {
      'name': scriptName,
      'compiledBytes': compiledBytes,
    };

    this.mars.deployPlayer(player);
    this.message("> "+scriptName+" deployed.");
  },


  toggleFlash: function() {
    this.flash = !this.flash;
    if (this.flash) {
      this.clockDivider = 4;
      this.clockTimeout = 10;
      this.$flash.parent().addClass('active')
    }
    else {
      this.clockDivider = 1;
      this.clockTimeout = 70;
      this.$flash.parent().removeClass('active')
    }

    return false;
  },

  clearMars: function() {
    this.stopRunning();
    this.mars.reset();
    this.visualizer.reset();
    this.$stepCount.html(0)
    this.$cycleCount.html(0)
    this.closeInspector();
    this.message("> M.A.R.S. cleared.");
    return false;
  },

  clickStepMars: function() {
    if (this.mars.players.length < 2) {
      this.message("> Deploy at least 2 scripts first.");
      return;
    }

    this.stepMars();
    this.message("> Step");
  },

  stepMars: function() {
    if (!this.roundStarted) {
      this.mars.startMatch();
      this.roundStarted = true;
    }
    this.mars.executeNextStep();


    this.$stepCount.html(this.mars.stepCount)
    this.$cycleCount.html(this.mars.cycleCount)
    return false;
  },
  resetMars: function() {
    if (this.mars.players.length < 2) {
      this.message("> Deploy at least 2 scripts first.");
      return;
    }
    this.stopRunning();
    this.visualizer.reset();
    this.mars.resetMatch();
    this.roundStarted = false;
    this.$stepCount.html(0)
    this.$cycleCount.html(0)
    this.message("> New round.");
    return false;
  },


  runMars: function() {
    if (this.mars.players.length < 2) {
      this.message("> Deploy at least 2 scripts first.");
      return;
    }

    if (!this.running) {
      this.startRunning();
      this._runcycle();
      this.message("> Round started");
    } else {
      this.stopRunning();
      this.message("> Round paused");
    }
    return false;
  },

  _runcycle: function() {
    for (var i=0; this.running && i < this.clockDivider; i++) {
      this.stepMars();
    }
    if (this.running) 
      setTimeout(_.bind(this._runcycle, this), this.clockTimeout);
  },
  stopRunning: function() {
    this.running = false;
    this.$runButton.parent().removeClass("active");
  },
  startRunning: function() {
    if (!this.running) {
      this.running = true;
      this.$runButton.parent().addClass("active");
    }

  },

  playerDied: function(player) {
    console.log("player died", player);

  },

  roundComplete: function(results) {
    this.roundStarted = false;
    this.stopRunning();
    this.message("> Round complete.");
  },

  message: function(msg) {
    var $h1 = this.$('h1')
    $h1.empty();
    $h1.append(msg);
  },

  newEditorTab: function() {
    this.addEditorTab();
    return false;
  },

  contextForward: function() {
    history.forward();
    return false
  },
  contextBack: function() {
    history.back();
    return false
  },
});


});
