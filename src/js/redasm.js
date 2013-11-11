var RedAsm = RedAsm || {}

_.extend(RedAsm, {
  OPCODE_MOV: 1,
  OPCODE_ADD: 2,
  OPCODE_SUB: 3,
  OPCODE_MUL: 4,
  OPCODE_DIV: 5,
  OPCODE_MOD: 6,
  OPCODE_SNE: 7,
  OPCODE_SEQ: 8,
  OPCODE_SLT: 9,
  OPCODE_SGT: 0xA,
  OPCODE_JMP:  0xD,
  OPCODE_FORK: 0xE,
  OPCODE_NOP:  0xF,

  ADDR_MODE_IMMEDIATE: 0,
  ADDR_MODE_RELATIVE: 1,
  ADDR_MODE_INDIRECT: 2,
});

_.extend(RedAsm, {
  MNEUMONICS: {
    'MOV': RedAsm.OPCODE_MOV,
    'ADD': RedAsm.OPCODE_ADD,
    'SUB': RedAsm.OPCODE_SUB,
    'MUL': RedAsm.OPCODE_MUL,
    'DIV': RedAsm.OPCODE_DIV,
    'MOD': RedAsm.OPCODE_MOD,
    'SEQ': RedAsm.OPCODE_SEQ,
    'SNE': RedAsm.OPCODE_SNE,
    'SLT': RedAsm.OPCODE_SLT,
    'SGT': RedAsm.OPCODE_SGT,
    'JMP': RedAsm.OPCODE_JMP,
    'FORK': RedAsm.OPCODE_FORK,
    'NOP': RedAsm.OPCODE_NOP,
    'HALT': RedAsm.OPCODE_HALT,
  }
});

_.extend(RedAsm, {
  OPERATORS: {
    '=': RedAsm.OPCODE_MOV,
    '+=': RedAsm.OPCODE_ADD,
    '-=': RedAsm.OPCODE_SUB,
    '*=': RedAsm.OPCODE_MUL,
    '/=': RedAsm.OPCODE_DIV,
    '%=': RedAsm.OPCODE_MOD,
  }
});

RedAsm.compile = function(assembly_string) {
  var output = []
  var lines = assembly_string.split(/\n/);

  var symbolTable = {}
  var lineNumber;


  var resolveRelative = function(operand) {
    if (/\(/.test(operand)) {
      operand = operand.replace(/[()]/g,'')
      return parseInt(operand);
    } else if (operand in symbolTable) {  // relative via label
      var address = symbolTable[operand];
      return address - lineNumber;
    }
    return null;
  }

  var resolveOperand = function(operand) {
    var rel;

    if (/^\*/.test(operand)) { // indirect addressing
      return [RedAsm.ADDR_MODE_INDIRECT, resolveRelative(operand.slice(1))];
    } 
    else if (/^(0x|-)?\d+/.test(operand)) { // immediate
      return [RedAsm.ADDR_MODE_IMMEDIATE, parseInt(operand)];
    } else if ((rel = resolveRelative(operand)) != null) { // relative address
      return [RedAsm.ADDR_MODE_RELATIVE, rel];
    }
    return null;
  };

  var lineNumber = 0;

  //take a first pass to build the symbol table 
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    line = line.replace(/\/\/.*$/,'');

    var colonIdx = line.indexOf(':');
    if (colonIdx != -1) { // label is present
      var label = line.substring(0, colonIdx).trim()
      line = line.substring(colonIdx+1);
      symbolTable[label] = lineNumber;
    }
    line = line.trim()

    if (!line)
      continue;
    lineNumber++;
  }

  // second pass to actually assemble
  lineNumber = 0;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    line = line.replace(/\/\/.*$/,'');

    var colonIdx = line.indexOf(':');
    if (colonIdx != -1) { // label is present
      var label = line.substring(0, colonIdx).trim()
      line = line.substring(colonIdx+1);
    }
    line = line.trim()

    if (!line)
      continue;
    tokens = line.split(/\s+/)


    var mneumonic = false;
    var firstOperand = false;
    var secondOperand = false;
    var instruction = RedAsm.parseInstruction(0); // create empty instruction
 

    var token = tokens[0].toLowerCase().trim();


    if (token == '.dat' || token == '.data') {
      var firstOperand = tokens[1].trim().replace(/,$/,'')
      output.push( parseInt(firstOperand.replace(/^\$/,'')) );
      lineNumber++;
      continue;
    }
    else
    if (token == "halt") {

    }
    else if (token == "jmp") {
      instruction.opcode = RedAsm.OPCODE_JMP;
      firstOperand = tokens[1];
    }
    else if (token == "fork") {
      instruction.opcode = RedAsm.OPCODE_FORK;
      firstOperand = tokens[1];
    }
    else if (token == "if") {
      firstOperand = tokens[1]
      secondOperand = tokens[3]
      var operator = tokens[2];
      switch (operator) {
        case '==':
          instruction.opcode = RedAsm.OPCODE_SNE;
          break;
        case '!=':
          instruction.opcode = RedAsm.OPCODE_SEQ;
          break;
        case '<':
          instruction.opcode = RedAsm.OPCODE_SLT;
          break;
        case '>':
          instruction.opcode = RedAsm.OPCODE_SGT;
          break;
        case '>=':
          instruction.opcode = RedAsm.OPCODE_SLT;
          firstOperand = tokens[3]
          secondOperand = tokens[1]
          break;
        case '<=':
          instruction.opcode = RedAsm.OPCODE_SGT;
          firstOperand = tokens[3]
          secondOperand = tokens[1]
          break;
        default:
          return {
            'success': false,
            'error': "Syntax error on line "+i+": Invalid comparison '"+operator+"'",
          }

      }
    }
    else {
      //arithmetic operator or mov

      var operator = tokens[1];
      if (operator in RedAsm.OPERATORS) {
        instruction.opcode = RedAsm.OPERATORS[operator];
      } else {
        return {
          'success': false,
          'error': "Syntax error on line "+i+": Invalid Operator: '"+operator+"'",
        }
      }

      firstOperand = tokens[0]
      secondOperand = tokens[2]

    }


    if (firstOperand) {
      firstOperand = firstOperand.trim().replace(/,$/,'')

      var a = resolveOperand(firstOperand)
      if (a) {
        instruction.mode1 = a[0];
        instruction.operand1 = a[1];
      } else {
        return {
          'success': false,
          'error': "Syntax error on line "+i+": Invalid Operand: '"+firstOperand+"'",
        }
      }
    }

    if (secondOperand) {
      var b = resolveOperand(secondOperand)
      if (b) {
        instruction.mode2 = b[0];
        instruction.operand2 = b[1];
      }
    }

    output.push( RedAsm.encodeInstruction(instruction) );
    lineNumber++;

  }

  return {
    'success': true,
    'compiledBytes': output,
  }
}


RedAsm.decompile = function(compiledBytes) {
  var rows=[]
  for (var i=0; i<compiledBytes.length; i++) {
    var instruction = RedAsm.parseInstruction(compiledBytes[i]);

    var stmt= RedAsm.mneumonicFromOpcode(instruction.opcode);
    if (!stmt) { //unknown opcode
      stmt = ".DATA 0x"+RedAsm.hexdump(compiledBytes[i],8)
    } else {
      //the only ones without operand2 are: JMP(0xD), FORK(0xE) and NOP(0xF) 
      if (instruction.opcode < 0xD)
        stmt += " "+RedAsm.decorateAddressing(instruction.mode2, RedAsm.signedCast12(instruction.operand2))+",";
      //everything except NOP(0xF) has at least 1 operand
      if (instruction.opcode < 0xF) 
        stmt += " "+RedAsm.decorateAddressing(instruction.mode1, RedAsm.signedCast12(instruction.operand1));
    }
    rows.push(stmt);
  }
  return rows;
}


RedAsm.disassemble = function(compiledBytes) {
  var stmts = RedAsm.decompile(compiledBytes);
  var rows = [];
  for (var i=0; i<compiledBytes.length; i++) {
    var instruction = RedAsm.parseInstruction(compiledBytes[i]);
    var row = [RedAsm.hexdump(i,4),
                RedAsm.hexdump(instruction.opcode,2),
                RedAsm.hexdump(instruction.mode1, 1),
                RedAsm.hexdump(instruction.mode2, 1),
                RedAsm.hexdump(instruction.operand1, 3),
                RedAsm.hexdump(instruction.operand2, 3),
                stmts[i]];
    rows.push(row);
  }
  return rows;
}

RedAsm.parseInstruction = function(instruction) {
  var opcode = (instruction & 0xF0000000)>>>28;
  var mode1 =  (instruction & 0x0C000000)>>>26;
  var mode2 =  (instruction & 0x03000000)>>>24;
  var operand1 = (instruction & 0x00FFF000)>>>12;
  var operand2 = (instruction & 0x00000FFF);

  return {
    'opcode': opcode,
    'mode1': mode1,
    'mode2': mode2,
    'operand1': operand1,
    'operand2': operand2,
  }
}
RedAsm.encodeInstruction = function(instruction) {

  var outbyte = instruction.opcode<<28;
  //addressing mode for first operand bits 27,26
  outbyte |= (instruction.mode1&0x3)<<26;
  //addressing mode for first operand bits 25,24
  outbyte |= (instruction.mode2&0x3)<<24;
  //first operand bits 12..23
  outbyte |= (instruction.operand1&0x0fff)<<12;
  //second operand bits 0..11
  outbyte |= (instruction.operand2&0x0fff);

  return outbyte;
}

RedAsm.signedCast12 = function(number) {
  // cast to 12 bit signed integer
  if ((number & 0xF00) == 0xF00) {
    var n = (number & 0xFFF)-1;
    return -(0xFFF - n);
  } 
  return number;
}

RedAsm.hexdump = function(number, padding) {
  var padding = padding || 2;
  var out = parseInt(number).toString(16);
  padding -= out.length;
  while (padding-- > 0) {
      out = "0"+out;
  }
  return out;
}

RedAsm.decorateAddressing = function(mode, value) {
  if (mode == RedAsm.ADDR_MODE_IMMEDIATE)
    return "0x"+parseInt(value).toString(16);
  else if (mode == RedAsm.ADDR_MODE_RELATIVE)
    return "("+value+")";
  else if (mode == RedAsm.ADDR_MODE_INDIRECT)
    return "@"+value;
  return value;
}

RedAsm.mneumonicFromOpcode = function(opcode) {
  for (var mn in RedAsm.MNEUMONICS) {
    if (RedAsm.MNEUMONICS[mn] == opcode) {
      return mn;
    }
  }
  return null;
}
