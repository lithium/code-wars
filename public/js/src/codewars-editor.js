define(['backbone','ace/ace', 'redasm', 'redscript-model', 'murmurhash', 'text!templates/editor.html'], 
function(backbone,  ace,       RedAsm,   RedScriptModel,    murmurhash, editorTemplate) 
{

return Backbone.View.extend({
  el: _.template(editorTemplate),

  events: {
    "click .btn.save": "saveScript",
    "click .btn.compile": "compileScript",
    "click .btn.deploy": "deployScript",
    "click .pane.compiledBytes .close": "closeCompilePane",
    "change input.scriptName": "updateScriptName",
  },

  initialize: function(options) {
    this.options = _.extend({
      'model': null,
      'collection': null,
      'hashSeed': 42,
    }, options || {})

    this.model = this.options.model || null;
    if (this.model) {
      this.model.on('change', this.render, this)
      // this.model.on('destroy')
    } else if (this.collection) {
      this.model = this.collection.add({})
    } else {
      this.model = new RedScriptModel()
    }


    this.$editorPane = this.$(".pane.fileEditor")
    this.$compiledPane = this.$(".pane.compiledBytes");
    this.$compiledContents = this.$(".pane.compiledBytes .contents");

    this.$saveButton = this.$("button.save");

    this.$messages = this.$(".compileMessages");
    this.$scriptName = this.$("input.scriptName");
    this.$compiled = this.$(".compiledOutput");
    this.$editor = this.$(".aceEditor");

    this.editor = ace.edit(this.$editor[0]);
    this.editor.setTheme("ace/theme/github");
    this.editor.setOption("firstLineNumber", 0);

    this.editor.selection.on("changeCursor", _.bind(this.editorCursorChanged, this));
    this.editor.on("change", _.bind(function() {
      this.setDirty(true);
    }, this));
    this.editor.focus();




    this.setDirty(false);
    this.saved = false;

    this.render();
  },

  generateHashName: function() {
    var hash = murmurhash(this.editor.getValue(), this.options.hashSeed);
    return RedAsm.hexdump(hash);
  },

  render: function() {
    this.editor.setValue(this.model.get('contents'));
    this.$scriptName.val(this.model.get('scriptName').trim());
  },


  setDirty: function(dirty) {
    var old = this.isDirty;
    this.isDirty = (dirty == null ? true : dirty)

    if (old == this.isDirty)
      return;

    var $icon = this.$saveButton.find('.glyphicon')
    var $label = this.$saveButton.find('.btn-label')

    if (this.isDirty) {
      $icon.removeClass().addClass('glyphicon glyphicon-floppy-disk')
      $label.html('Save')
      this.$saveButton.removeAttr("disabled")
      this.$saveButton.removeClass("btn-success").addClass("btn-primary")
    } else if (this.saved) {
      this.$saveButton.attr("disabled","disabled")
      $icon.removeClass().addClass('glyphicon glyphicon-floppy-saved')
      $label.html('Saved')
      this.$saveButton.removeClass("btn-primary").addClass("btn-success")
    } else {
      this.$saveButton.attr("disabled","disabled")
      $icon.removeClass().addClass('glyphicon glyphicon-floppy-remove')
      $label.html('Unsaved')
      this.$saveButton.removeClass("btn-primary").addClass("btn-default")
    }
  },

  scriptName: function() {
    return this.$scriptName.val() || '(unnamed)';
  },

  updateScriptName: function() {
    this.trigger("codewars:scriptNameChanged", this, this.scriptName())
    this.setDirty(true);
  },

  editorCursorChanged: function(evt, selection) {

      //get current line
      var cursor = selection.getCursor()
      var line = this.editor.session.getLine(cursor.row).toLowerCase()

      //strip label
      if (line.indexOf(':') != -1)
        line = line.replace(/.+:/,'')

      jumpTable = {
        'data': /\.dat/,
        'add': /\+=/,
        'sub': /-=/,
        'mul': /\*=/,
        'div': /\/=/,
        'mod': /%=/,
        'mov': /[^=!<>+\-*\/%]=/,
        'seq': /!=/,
        'sne': /==/,
        'sge.1': /<[^=]/,
        'sge.2': />[^=]/,
        'slt.1': />=/,
        'slt.2': /<=/,
        'jmp': /jmp/,
        'fork': /fork/,
      }
      for (var mneumonic in jumpTable) {
        if (jumpTable[mneumonic].test(line)) {
          this.trigger("codewars:helpContext", mneumonic)
          break;
        }
      }
  },


  saveAndCompile: function() {
    this.saveScript();
    this.compileScript();
  },


  message: function(msg, type) {
    var type = type || 'info'

    this.trigger("codewars:compilerMessage", msg, type)
  },


  saveScript: function() {
    var playerScript = this.editor.getValue();
    var scriptName = this.$scriptName.val().trim();

    if (playerScript.trim().length < 1) 
      return false;

    if (!scriptName) {
      scriptName = this.generateHashName();
    }

    var form = {'name': scriptName, 'source': playerScript}

    var done = _.bind(function() { 
      this.saved = true;
      this.setDirty(false);
    }, this);


    // HACK!
    if (this.model.localStorage || (this.model.collection && this.model.collection.localStorage)) { 
      this.model.save(form);
      done();
    } else {
      $.ajax({
        type: "POST",
        url: '/script/',
        data: form,
        success: function(data) {
          // this.message(JSON.stringify(data));
          done();
        },
        error: _.bind(function(xhr) {
          console.log("error", arguments)
          this.message("Save Error: "+xhr.responseText)
        }, this),
      });

    }


    // this.trigger("codewars:scriptSaved", scriptName, playerScript);
  },

  compileScript: function() {
    var script = this.editor.getValue();

    if (script.trim().length < 1) 
      return false;

    var result = RedAsm.compile(script);
    if (result.success) {
      this.compiledBytes = result.compiledBytes;
      var disasm = RedAsm.disassemble(result.compiledBytes);
      var o = [];
      for (var i=0; i < disasm.length; i++) {
        o.push('<div class="nowrap">'+disasm[i][0]+": "+disasm[i][6]+'</div>');
      }

      this.$compiled.html(o.join(""));
      this.showCompilePane();


      this.message('Compiled successfully.','success');
      return true;
    }

    this.closeCompilePane();
    this.message(result.error, 'danger');
    return false;
  },

  deployScript: function() {
    if (this.compileScript()) {
      this.trigger("codewars:scriptDeployed", this.scriptName(), this.compiledBytes);
    }

  },

  showCompilePane: function() {
    if (!this.compiledShown) { 
      this.$compiledContents.show();
      this.$compiledPane.toggleClass("col-md-0 col-md-3")
      this.$editorPane.toggleClass("col-md-12 col-md-9")
      this.compiledShown = true;
    }
  },

  closeCompilePane: function() {
    if (this.compiledShown) {
      this.$compiledContents.hide();
      this.$compiledPane.toggleClass("col-md-0 col-md-3")
      this.$editorPane.toggleClass("col-md-12 col-md-9")
      this.compiledShown = false;
    }
  },

  setValue: function(contents) {
    this.model.set({'contents': contents})
  },

  setName: function(name) {
    this.model.set({'scriptName': name})
  },


});

});
