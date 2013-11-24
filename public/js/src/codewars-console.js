

define(['backbone',
        'mars',
        'redasm',
        'codewars-editor',
        'codewars-help', 
        'codewars-visualizer', 
        'codewars-inspector', 
        'codewars-storage', 
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
         RedScriptCollection,
         consoleTemplate) 
{



return Backbone.View.extend({
  el: _.template(consoleTemplate),

  events: {
    "click .btn.newEditorTab": "newEditorTab",

    "click .clearMars": "clearMars",
    "click .stepMars": "stepMars",
    "click .runMars": "runMars",
    "click .resetMars": "resetMars",
    "click .toggleFlash": "toggleFlash",
    "click .toggleDebug": "toggleDebug",
  },


  initialize: function() {
    this.$editPane = this.$(".pane.edit")
    this.$debugPane = this.$(".pane.debug")
    this.$inspectorPane = this.$(".pane.inspector")

    this.$navTabs = this.$(".editors .nav.nav-pills")
    this.$tabContent = this.$(".editors .tab-content")
    this.editors = []


    this.$compilerMessages = this.$(".compilerMessages")


    this.scriptCollection = new RedScriptCollection();


    this.mars = new Mars.MarsCore()
    this.mars.on("mars:roundComplete", this.roundComplete, this);


    this.$flash = this.$(".toggleFlash");
    this.$runButton = this.$(".runMars");
    this.running = false;
    this.flash = false;
    this.toggleFlash();

    this.visualizer = new CodeWarsVisualizer({
      el: this.$(".memoryVisualizer"), 
      mars: this.mars,
    });


    this.help = new CodeWarsHelp()
    this.$('.helpContainer').html(this.help.$el)


    this.inspector = new CodeWarsInspector({
      'mars': this.mars,
    })
    this.$('.inspectorContainer').html(this.inspector.$el)
    this.visualizer.on('mars:inspectAddress', this.inspectAddress, this);
    this.inspector.on('mars:closeInspector', this.closeInspector, this);

    this.storageBrowser = new CodeWarsStorage({
      'collection': this.scriptCollection,
    })
    this.$('.storageContainer').html(this.storageBrowser.$el);

    this.storageBrowser.on('codewars:editScript', this.openScriptInTab, this);

    this.addEditorTab();

    this.clearMars();
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

  openScriptInTab: function(redScript) {
    this.addEditorTab(redScript);
  },

  inspectAddress: function(mars, position, $cell) {
    this.inspector.inspectAddress(mars, position, $cell);
    this.openInspector();
  },

  render: function() {
    var $h1 = this.$('h1')

    if (this.profile) {
      $h1.empty();
      $h1.append("> Welcome ");
      if (this.profile.avatar)
        $h1.append( $('<img class="avatar" src="'+this.profile.avatar+'">') );
      $h1.append(this.profile.username);
    }

    if (this.profile.script) {
      this.editor.setValue(this.profile.script.source);
      this.scriptName.val(this.profile.script.scriptName);
    }
  },

  login: function(profile) {
    this.profile = profile;
    this.render();
  },


  addEditorTab: function(redScript) {
    var name = redScript != null ? redScript.get("scriptName") : '(unnamed)';

    var nav_template = _.template('<li><a href="#editor-tab<%= tabId %>" data-toggle="tab"><span class="tabName"><%= tabName %></span> <button type="button" class="close" aria-hidden="true">&times;</button> </a></li>');
    var tab_template = _.template('<div class="tab-pane " id="editor-tab<%= tabId %>"></div>');
    var context =  {
      tabId: this.editors.length,
      tabName: name,
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
      var done = function() {
        $nav.remove();
        $tab.remove();
      }

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

  },

  compilerMessage: function(msg, type) {
    this.$compilerMessages.html(msg)
  },
  helpContext: function(mneumonic) {
    this.help.showHelpFor(mneumonic);
  },
  scriptDeployed: function(scriptName, compiledBytes) {
    this.openDebug();

    var player = {
      'name': scriptName,
      'compiledBytes': compiledBytes,
    };

    this.mars.deployPlayer(player);
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

  },

  clearMars: function() {
    this.stopRunning();
    this.mars.reset();
    this.visualizer.reset();
  },

  stepMars: function() {
    if (!this.roundStarted) {
      this.mars.startMatch();
      this.roundStarted = true;
    }
    this.mars.executeNextStep();
  },
  resetMars: function() {
    this.visualizer.reset();
    this.mars.resetMatch();
    this.roundStarted = false;
  },


  runMars: function() {
    if (!this.running) {
      this.startRunning();
      this._runcycle();
    } else {
      this.stopRunning();
    }
  },

  _runcycle: function() {
    for (var i=0; this.running && i < this.clockDivider; i++) {
      this.stepMars();
    }
    if (this.running) 
      setTimeout(_.bind(this._runcycle, this), this.clockTimeout);
  },


  playerDied: function(player) {
    console.log("player died", player);

  },

  roundComplete: function(results) {
    this.roundStarted = false;
    this.stopRunning();
    console.log("roundComplete", results)
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

  newEditorTab: function() {
    this.addEditorTab();
  }
});


});
