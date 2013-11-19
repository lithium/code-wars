var Juno;
if (typeof exports == "undefined") {
  Juno = Juno || {}
} else {
  Juno = exports
}


Juno.randomOpcode = function() {
  return parseInt(Math.random() * 12)+1
}
Juno.randomOperand = function() {
  return parseInt(Math.random() * 4096)
}
Juno.randomAddressMode = function() {
  return parseInt(Math.random() * 3)
}

Juno.randomInstruction = function() {
  var instruction = {
    'opcode': Juno.randomOpcode(),
    'mode1': Juno.randomAddressMode(),
    'mode2': Juno.randomAddressMode(),
    'operand1': Juno.randomOperand(),
    'operand2': Juno.randomOperand(),
  };
  return RedAsm.encodeInstruction(instruction);
}

Juno.randomWarrior = function(minSize, maxSize) {
  var minSize = minSize || 10
  var maxSize = maxSize || 20;
  var size = parseInt(Math.random()*(maxSize - minSize) + minSize);
  var compiled = Array(size);
  for (var i=0; i < size; i++) {
    compiled[i] = Juno.randomInstruction();
  }
  return compiled;
}

Juno.viableWarrior = function(minSize, maxSize) {
  var warrior;
  do {
    warrior = Juno.randomWarrior(minSize, maxSize)
  } while (warrior && !Juno.isWarriorViable(warrior));
  return warrior;
}

Juno.isWarriorViable = function(compiledWarrior, numCycles) {
  var numCycles = numCycles || 4096;
  var core = new Mars.MarsCore();
  var self = {
    compiledBytes: compiledWarrior,
  }
  core.startMatch([self]);
  for (var i=0; core.remainingPlayerCount > 0 && i < numCycles; i++) {
    core.executeNextStep();
  }
  return (core.remainingPlayerCount > 0);
}


Juno.randomFromWeightedTable = function(table)
{
  var total = 0;
  var index = []
  for (var key in table) {
    var weight = table[key];
    index.push([key, total])
    total += weight;
  }

  var choice = Math.random() * total;

  for (var i=index.length-1; i>=0; i--) {
    var tuple = index[i];
    if (choice > tuple[1])
      return tuple[0]
  }
}


Juno.breedWarriors = function(compiledParent1, compiledParent2, options) {
  var options = _.extend({
    'mutationRate': 0.60,
    'mutationAmount': 8,
    'mutationChance': {
      'opcode': 0.10,
      'mode1': 0.16,
      'mode2': 0.16,
      'operand1': 0.34,
      'operand2': 0.34,
    },
    'dominantParent': 0, // either 1 or 2.  0 is random
    'mutationType': 0, // either 'point' or 'crossover', 0 is random
  }, options || {})

  var child;

  // only 10% chance of crossover mutation
  var mutationType = options.mutationType || Math.random() <= 0.10 ? 'crossover' : 'point';
  if (mutationType == 'crossover') {
    child = _.clone(compiledParent1)
    var crossover1 = parseInt(Math.random()*compiledParent1.length);
    var crossover2 = parseInt(Math.random()*compiledParent2.length);
    child = compiledParent1.slice(0,crossover1);
    child.push.apply(child, compiledParent2.slice(crossover2));
  }
  else 
    // if (mutationType == 'point') 
  {
    var dominant;
    var recessive;
    var dom = options.dominantParent || parseInt(Math.random() * 2)+1
    if (dom == 1) {
      dominant = compiledParent1;
      recessive = compiledParent2;
    } else {
      dominant = compiledParent2;
      recessive = compiledParent1;
    }
    child = _.clone(dominant);


    if (Math.random() <= options.mutationRate) {
      var numMutations = Math.random()*options.mutationAmount;
      for (var i=0; i < numMutations; i++) {
        var ofs = Math.random() * child.length;
        var instruction = RedAsm.parseInstruction(child[ofs]);

        switch (Juno.randomFromWeightedTable(options.mutationChance)) {
          case 'opcode':
            instruction.opcode = Juno.randomOpcode();
            break;
          case 'mode1':
            instruction.mode1 = Juno.randomAddressMode();
            break;
          case 'mode2':
            instruction.mode2 = Juno.randomAddressMode();
            break;
          case 'operand1':
            instruction.operand1 = Juno.randomOperand();
            break;
          case 'operand2':
            instruction.operand2 = Juno.randomOperand();
            break;
        }

        child[ofs] = RedAsm.encodeInstruction(instruction);
      }
    }
  }

  return child;
}

