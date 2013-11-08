var RedAsm = RedAsm || {}

_.extend(RedAsm, {
  OPCODE_LD: 1,
  OPCODE_ADD: 2,
  OPCODE_SUB: 3,
  OPCODE_MUL: 4,
  OPCODE_DIV: 5,
  OPCODE_MOD: 6,
  OPCODE_CMP: 7,
  OPCODE_BRZ: 8,
  OPCODE_JMP: 0xD,
  OPCODE_FORK: 0xE,
  OPCODE_NOP: 0xF,

  ADDR_MODE_IMMEDIATE: 0,
  ADDR_MODE_RELATIVE: 1,
  ADDR_MODE_INDIRECT: 2,
});

_.extend(RedAsm, {
  MNEUMONICS: {
    'LD': RedAsm.OPCODE_LD,
    'ADD': RedAsm.OPCODE_ADD,
    'SUB': RedAsm.OPCODE_SUB,
    'MUL': RedAsm.OPCODE_MUL,
    'DIV': RedAsm.OPCODE_DIV,
    'MOD': RedAsm.OPCODE_MOD,
    'CMP': RedAsm.OPCODE_CMP,
    'BRZ': RedAsm.OPCODE_BRZ,
    'JMP': RedAsm.OPCODE_JMP,
    'FORK': RedAsm.OPCODE_FORK,
    'NOP': RedAsm.OPCODE_NOP,
  }
});

RedAsm.compile = function(assembly_string) {
  var output = []
  var lines = assembly_string.split(/[\n;]/);

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

    if (/^@/.test(operand)) { // indirect addressing
      return [RedAsm.ADDR_MODE_INDIRECT, resolveRelative(operand.slice(1))];
    } 
    else if (/^(0|\$|-)?\d+/.test(operand)) { // immediate
      operand = operand.replace(/^\$/,'')
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

    var colonIdx = line.indexOf(':');
    if (colonIdx != -1) { // label is present
      var label = line.substring(0, colonIdx).trim()
      line = line.substring(colonIdx+1);
    }
    line = line.trim()
    if (!line)
      continue;
    tokens = line.split(/\s+/)

    var mneumonic = tokens[0].toUpperCase();
    if (mneumonic in RedAsm.MNEUMONICS) {
      var opcode = RedAsm.MNEUMONICS[mneumonic];


      //opcode is bits 31..28
      var outbyte = opcode<<28;


      var firstOperand = tokens[1]
      var secondOperand;

      if (firstOperand) {
        firstOperand = firstOperand.trim().replace(/,$/,'')
        secondOperand = (tokens[2] || "").trim();

        var a = resolveOperand(firstOperand)

        if (!a || !a[1]) {
          return {
            'success': false,
            'error': "Syntax error on line "+lineNumber+": Invalid Operand: '"+firstOperand+"'",
          }
        }
        var b = resolveOperand(secondOperand)
        if (!b) 
          b = [0,0]

        //addressing mode for first operand bits 27,26
        outbyte |= (a[0]&0x3)<<26;
        //addressing mode for first operand bits 25,24
        outbyte |= (b[0]&0x3)<<24;
        //first operand bits 12..23
        outbyte |= (a[1]&0x0fff)<<12;
        //second operand bits 0..11
        outbyte |= (b[1]&0x0fff);
      }

      output.push( outbyte )
      lineNumber++;
    } 
    else if (mneumonic == '.BYTE') {
      var firstOperand = tokens[1].trim().replace(/,$/,'')
      output.push( parseInt(firstOperand.replace(/^\$/,'')) );
    }
    else {
      return {
        'success': false,
        'error': "Syntax error on line "+lineNumber+": No such operation '"+tokens[0]+"'",
      };
    }

  }

  return {
    'success': true,
    'compiledBytes': output,
  }
}

RedAsm.disassemble =  function(compiledBytes) {
  var _addrmode = function(mode, value) {
    if (mode == RedAsm.ADDR_MODE_IMMEDIATE)
      return "$"+parseInt(value).toString(16);
    else if (mode == RedAsm.ADDR_MODE_RELATIVE)
      return "("+value+")";
    else if (mode == RedAsm.ADDR_MODE_INDIRECT)
      return "@"+value;
    return value;
  }
  var rows=[]
  for (var i=0; i<compiledBytes.length; i++) {
    var instruction = RedAsm.parseInstruction(compiledBytes[i]);

    var stmt='';
    for (var mn in RedAsm.MNEUMONICS) {
      if (RedAsm.MNEUMONICS[mn] == instruction.opcode) {
        stmt = mn.toLowerCase();
        break;
      }
    }
    if (!stmt) { //unknown opcode
      stmt = ".BYTE 0x"+RedAsm.hexdump(compiledBytes[i],8)
    } else {
      //everything except NOP(0xF) has at least 1 operand
      if (instruction.opcode < 0xF) 
        stmt += " "+_addrmode(instruction.mode1, RedAsm.signedCast12(instruction.operand1));
      //the only ones without operand2 are: JMP(0xD), FORK(0xE) and NOP(0xF) 
      if (instruction.opcode < 0xD)
        stmt += ", "+_addrmode(instruction.mode2, RedAsm.signedCast12(instruction.operand2));
    }

    var row =  [RedAsm.hexdump(i,4),
                RedAsm.hexdump(instruction.opcode,2),
                RedAsm.hexdump(instruction.mode1, 1),
                RedAsm.hexdump(instruction.mode2, 1),
                RedAsm.hexdump(instruction.operand1, 3),
                RedAsm.hexdump(instruction.operand2, 3),
                stmt];

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
  while (padding > 1) {
    if (number < 1<<(padding+2))
      out = "0"+out;
    padding--;
  }
  return out;
}

