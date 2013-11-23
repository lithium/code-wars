

define(['backbone','mars','redasm','codewars-editor','codewars-help', 'codewars-visualizer', 'text!templates/console.html'], 
function(backbone,  mars,  redasm,  CodeWarsEditor,   CodeWarsHelp,    CodeWarsVisualizer,    consoleTemplate) 
{

return Backbone.View.extend({
  el: _.template(consoleTemplate),

  events: {
    "click .btn.debug": "animateToDebug",
    "click .btn.edit": "animateToEditor",
    "click .btn.inspector": "animateInspector",

    "click .clearMars": "clearMars",
    "click .stepMars": "stepMars",
    "click .runMars": "runMars",
    "click .toggleFlash": "toggleFlash",
  },


  animateToEditor: function() {
    this.$editPane.addClass('expanded')
    this.$debugPane.addClass('obscured')
    this.$inspectorPane.addClass('obscured')
  },
  animateToDebug: function() {
    this.$editPane.removeClass('expanded')
    this.$debugPane.removeClass('obscured')
  },
  animateInspector: function() {
    this.$inspectorPane.toggleClass('obscured')
  },

  initialize: function() {
    this.$editPane = this.$(".pane.edit")
    this.$debugPane = this.$(".pane.debug")
    this.$inspectorPane = this.$(".pane.inspector")

    this.$navTabs = this.$(".editors .nav.nav-pills")
    this.$tabContent = this.$(".editors .tab-content")
    this.editors = []

    this.addEditorTab();
    this.addEditorTab('foo','\n');

    this.$compilerMessages = this.$(".compilerMessages")



    this.mars = new Mars.MarsCore()
    // this.mars.on("mars:beforeCycleExecute", _.bind(this.beforeCycle, this));
    // this.mars.on("mars:threadDied", _.bind(this.threadDied, this));
    this.mars.on("mars:roundComplete", this.roundComplete, this);


    // this.cycleCount = this.$(".cycleCount");
    // this.stepCount = this.$(".stepCount");
    this.running = false;
    this.flash = false;
    this.toggleFlash();

    this.visualizer = new CodeWarsVisualizer({
      el: this.$(".memoryVisualizer"), 
      mars: this.mars,
    });


    this.help = new CodeWarsHelp()
    this.$('.helpContainer').html(this.help.$el)

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


  addEditorTab: function(name, initialScript) {
    var name = name || '(unnamed)';
    var initialScript = initialScript || '';

    var nav_template = _.template('<li><a href="#editor-tab<%= tabId %>" data-toggle="tab"><%= tabName %></a></li>');
    var tab_template = _.template('<div class="tab-pane " id="editor-tab<%= tabId %>"></div>');
    var context =  {
      tabId: this.editors.length,
      tabName: name,
      script: initialScript,
    }
    var $nav = $(nav_template(context));
    var $tab = $(tab_template(context));

    var editor = new CodeWarsEditor({
      'initialScript': initialScript,
    })
    editor.$nav = $nav;
    editor.$tab = $tab;
    $tab.append(editor.$el)
    this.editors.push(editor);

    editor.on("codewars:compilerMessage", this.compilerMessage, this);
    editor.on("codewars:helpContext", this.helpContext, this);
    editor.on("codewars:scriptDeployed", this.scriptDeployed, this);

    this.$navTabs.append($nav);
    this.$tabContent.append($tab);

    $tab.ready(function() {
     $nav.find('a').tab("show");
    })

  },

  compilerMessage: function(msg, type) {
    this.$compilerMessages.html(msg)
  },
  helpContext: function(mneumonic) {
    this.help.showHelpFor(mneumonic);
  },
  scriptDeployed: function(scriptName, compiledBytes) {
    this.animateToDebug();
    console.log("deploy", scriptName, compiledBytes)

    var player = {
      'name': scriptName,
      'compiledBytes': compiledBytes,
    };

    this.mars.deployPlayer(player);


  },

  // beforeCycle: function(thread, player) {
  //   this.cycleCount.html(this.mars.cycleCount);
  //   this.stepCount.html(this.mars.stepCount);

    // var slice = this.mars.memorySlice(thread.PC - 3, 7);
    // var source = RedAsm.decompile(slice);

    // var $monitor = $('<div class="monitor"></div>');
    // for (var i=0; i < slice.length; i++) {
    //   var $row = $('<div class="monitorRow"></div>');
    //   var $addr = $('<span class="address"></span>');
    //   var $hex = $('<span class="hexdump"></span>');
    //   var $assembly = $('<span class="assembly"></span>');

    //   $addr.html(RedAsm.hexdump(thread.PC-3+i, 3)+":");

    //   $hex.html(RedAsm.hexdump(slice[i]>>>0, 8));

    //   $assembly.html("; "+source[i]);

    //   if (i == 4) {
    //     $row.addClass("active");
    //   }

    //   $row.append($addr);
    //   $row.append($hex);
    //   $row.append($assembly);
    //   $monitor.append($row);
    // }

  //   var $output = this.$('.dissassembly.player'+player.playerNumber);

  //   if ($output.length < 1) {
  //     $output = $('<div class="col-md-6 dissassembly player'+player.playerNumber+'"></div>');
  //     this.output.append($output);
  //   }
  //   $output.empty();

  //   var $title = $('<h4></h4>');
  //   $title.html("Player"+player.playerNumber);
  //   $output.append($title)

  //   $output.append("Threads: "+player.runningThreadCount);
  //   // $output.append($monitor);


  //   // console.log(source);
  // },


  toggleFlash: function() {
    this.flash = !this.flash;
    if (this.flash) {
      this.clockDivider = 4;
      this.clockTimeout = 10;
    }
    else {
      this.clockDivider = 1;
      this.clockTimeout = 70;
    }

  },

  clearMars: function() {
    this.stopRunning();
    this.mars.reset();
  },

  stepMars: function() {
    this.mars.executeNextStep();
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


  // threadDied: function(thread) {
  //   console.log("thread died", thread)
  //   this.beforeCycle(thread, thread.owner);
  //   if (thread.$pc) {
  //     thread.$pc.remove();
  //     thread.$pc = null;
  //   }
  // },

  playerDied: function(player) {
    console.log("player died", player);

  },

  roundComplete: function(results) {
    this.stopRunning();
    console.log("roundComplete", results)
  },

  stopRunning: function() {
    this.running = false;
    // this.runButton.removeClass("btn-primary");
  },
  startRunning: function() {
    if (!this.running) {
      this.running = true;
      this.mars.startMatch();
      // this.runButton.addClass("btn-primary");
    }

  },
});


});
