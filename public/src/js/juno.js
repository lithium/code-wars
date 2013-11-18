var Juno;
if (typeof exports == "undefined") {
  Juno = Juno || {}
} else {
  Juno = exports
}



Juno.randomInstruction = function() {
  var instruction = {
    'opcode': parseInt(Math.random() * 12)+1,
    'mode1': parseInt(Math.random() * 3),
    'mode2': parseInt(Math.random() * 3),
    'operand1': parseInt(Math.random() * 4096),
    'operand2': parseInt(Math.random() * 4096),
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


