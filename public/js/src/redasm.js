var RedAsm;
if (typeof exports == "undefined") {
  RedAsm = RedAsm || {}
} else {
  RedAsm = exports
}

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
  OPCODE_SGE: 0xA,
  OPCODE_JZ:  0xB,
  OPCODE_JNZ: 0xC,
  OPCODE_JMP: 0xD,
  OPCODE_FORK:0xE,

  ADDR_MODE_IMMEDIATE: 0,
  ADDR_MODE_RELATIVE:  1,
  ADDR_MODE_INDIRECT:  2,

  ADDR_MODE_NO_INCDEC: 0,
  ADDR_MODE_PRE_DEC:   1,
  ADDR_MODE_PRE_INC:   2,
  ADDR_MODE_POST_DEC:  3,
  ADDR_MODE_POST_INC:  4,
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
    'SGE': RedAsm.OPCODE_SGE,
    'JZ': RedAsm.OPCODE_JZ,
    'JNZ': RedAsm.OPCODE_JNZ,
    'JMP': RedAsm.OPCODE_JMP,
    'FORK': RedAsm.OPCODE_FORK,
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
    var ret = {
      'incdec': 0,
      'value': null,
    }

    if (/^--/.test(operand)) {
      ret.incdec = RedAsm.ADDR_MODE_PRE_DEC
    }
    else
    if (/^\+\+/.test(operand)) {
      ret.incdec = RedAsm.ADDR_MODE_PRE_INC;
    }
    else
    if (/--$/.test(operand)) {
      ret.incdec = RedAsm.ADDR_MODE_POST_DEC;
    }
    else
    if (/\+\+$/.test(operand)) {
      ret.incdec = RedAsm.ADDR_MODE_POST_INC;
    }
    operand = operand.replace(/[-+]+/g,'').trim()


    if (/\(/.test(operand)) {
      operand = operand.replace(/[()]/g,'')
      ret.value = parseInt(operand);
      return ret;
    } else if (operand in symbolTable) {  // relative via label
      var address = symbolTable[operand];
      ret.value = address - lineNumber;
      return ret;
    }

    //invalid
    return null;
  }

  var resolveOperand = function(operand) {
    var ret = {
      'mode': null,
      'incdec': 0,
      'value': null,
    }
    var rel;

    if (/^\*/.test(operand)) { // indirect addressing
      var operand = operand.slice(1)
      ret = resolveRelative(operand);
      if (ret == null)
        return null;
      ret.mode = RedAsm.ADDR_MODE_INDIRECT;
      return ret;
    } 
    else if (/^(0x|-)?\d+/.test(operand)) { // immediate
      ret.mode = RedAsm.ADDR_MODE_IMMEDIATE
      ret.value = parseInt(operand)
      return ret;
    } else if ((ret = resolveRelative(operand)) != null) { // relative address
      ret.mode = RedAsm.ADDR_MODE_RELATIVE;
      return ret;
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
    else if (token == "jz") {
      instruction.opcode = RedAsm.OPCODE_JZ;
      firstOperand = tokens[1];
      secondOperand = tokens[2];
    }
    else if (token == "jnz") {
      instruction.opcode = RedAsm.OPCODE_JNZ;
      firstOperand = tokens[1];
      secondOperand = tokens[2];
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
          instruction.opcode = RedAsm.OPCODE_SGE;
          firstOperand = tokens[3]
          secondOperand = tokens[1]
          break;
        case '>':
          instruction.opcode = RedAsm.OPCODE_SGE;
          break;
        case '<=':
          instruction.opcode = RedAsm.OPCODE_SLT;
          break;
        case '>=':
          instruction.opcode = RedAsm.OPCODE_SLT;
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
        instruction.mode1 = a.mode;
        instruction.operand1 = a.value;
        instruction.incdec1 = a.incdec;
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
        instruction.mode2 = b.mode;
        instruction.operand2 = b.value;
        instruction.incdec2 = b.incdec;
      }
    }

    // console.log("instruction", instruction)
    output.push( RedAsm.encodeInstruction(instruction) );
    lineNumber++;

  }

  return {
    'success': true,
    'compiledBytes': output,
  }
}


RedAsm.decompileToRedcode = function(compiledBytes) {
  var rows=[]
  for (var i=0; i<compiledBytes.length; i++) {
    var instruction = RedAsm.parseInstruction(compiledBytes[i]);

    var stmt= RedAsm.mneumonicFromOpcode(instruction.opcode);
    if (!stmt) { //unknown opcode
      stmt = ".DATA 0x"+RedAsm.hexdump(compiledBytes[i]>>>0,8)
    } else {
      //the only ones without operand2 are: JMP(0xB), FORK(0xC)
      if (instruction.opcode < RedAsm.OPCODE_JMP)
        stmt += " "+RedAsm.decorateAddressing(instruction.mode2, RedAsm.signedCast12(instruction.operand2), instruction.incdec2)+",";
      stmt += " "+RedAsm.decorateAddressing(instruction.mode1, RedAsm.signedCast12(instruction.operand1), instruction.incdec1);
    }
    rows.push(stmt);
  }
  return rows;
}

RedAsm.decompileToRedscript = function(compiledBytes) {
  var rows=[]
  for (var i=0; i<compiledBytes.length; i++) {
    var instruction = RedAsm.parseInstruction(compiledBytes[i]);
    var op1 = RedAsm.decorateAddressing(instruction.mode1, RedAsm.signedCast12(instruction.operand1), instruction.incdec1);
    var op2 = RedAsm.decorateAddressing(instruction.mode2, RedAsm.signedCast12(instruction.operand2), instruction.incdec2);
    switch (instruction.opcode) {
      case RedAsm.OPCODE_MOV:
        rows.push(op1+" = "+op2+"\n")
        break;
      case RedAsm.OPCODE_ADD:
        rows.push(op1+" += "+op2+"\n")
        break;
      case RedAsm.OPCODE_SUB:
        rows.push(op1+" -= "+op2+"\n")
        break;
      case RedAsm.OPCODE_MUL:
        rows.push(op1+" *= "+op2+"\n")
        break;
      case RedAsm.OPCODE_DIV:
        rows.push(op1+" /= "+op2+"\n")
        break;
      case RedAsm.OPCODE_MOD:
        rows.push(op1+" %= "+op2+"\n")
        break;
      case RedAsm.OPCODE_SNE:
        rows.push("if "+op1+" == "+op2+"\n  ")
        break;
      case RedAsm.OPCODE_SEQ:
        rows.push("if "+op1+" != "+op2+"\n  ")
        break;
      case RedAsm.OPCODE_SLT:
        rows.push("if "+op1+" < "+op2+"\n  ")
        break;
      case RedAsm.OPCODE_SGE:
        rows.push("if "+op1+" >= "+op2+"\n  ")
        break;
      case RedAsm.OPCODE_JZ:
        rows.push("jz "+op1+", "+op2+"\n");
        break;
      case RedAsm.OPCODE_JNZ:
        rows.push("jnz "+op1+", "+op2+"\n");
        break;
      case RedAsm.OPCODE_JMP:
        rows.push("jmp "+op1+"\n");
        break;
      case RedAsm.OPCODE_FORK:
        rows.push("fork "+op1+"\n");
        break;
      default:
        rows.push(".data "+RedAsm.hexdump(compiledBytes[i]>>>0, 8)+"\n");
        // rows.push(RedAsm.mneumonicFromOpcode(instruction.opcode))
        break;
    }
  }
  return rows;
}


RedAsm.decompile = RedAsm.decompileToRedcode

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



/*

  Instructions are 46-bit words packed into a Number .
  Since bitwise operators are 32 bits only, and Number has
  0..+2^52, we pack a 30 bit and 22 bit word into a Number

  4-bits:  Instruction
  6-bits:  Operand1 Mode
  6-bits:  Operand2 Mode
  15-bits: Operand1 Value
  15-bits: Operand2 Value

|------ upper 22 bits ------| 
 00 0000 0000 0000 0000 0000   
         1111                           opcode    0x00f000
               111                      incdec1   0x000700
                    111                 incdec2   0x000070
                        11              mode1     0x00000C
                          11            mode2     0x000003

|----------- lower 30 bits -----------|
 00 0000 0000 0000 0000 0000 0000 0000  
 11 1111 1111 1111 1                    operand1  0x3fff8000
                    111 1111 1111 1111  operand2  0x00007fff

 */

RedAsm.parseInstruction = function(instruction) {
  var lo = RedAsm.int52_lo(instruction);
  var hi = RedAsm.int52_hi(instruction);
  var opcode    = (hi & 0xF000) >>> 12;                    
  var incdec1   = (hi & 0x0700) >>> 8;
  var incdec2   = (hi & 0x0070) >>> 4;
  var mode1     = (hi & 0x00C) >>> 2;
  var mode2     = (hi & 0x003) >>> 0;
  var operand1  = (lo & 0x3FFF8000) >>> 15;
  var operand2  = (lo & 0x00007FFF) >>> 0;

  return {
    'opcode': opcode,
    'mode1': mode1,
    'mode2': mode2,
    'operand1': operand1,
    'operand2': operand2,
    'incdec1': incdec1,
    'incdec2': incdec2,
  }
}
RedAsm.encodeInstruction = function(instruction) {
  var hi = 0;
  var lo = 0;

  hi |= (instruction.opcode & 0xF) << 12;
  hi |= (instruction.incdec1 & 0x7) << 8;
  hi |= (instruction.incdec2 & 0x7) << 4;
  hi |= (instruction.mode1 & 0x3) << 2;
  hi |= (instruction.mode2 & 0x3);

  lo |= (instruction.operand1 & 0x7FFF) << 15;
  lo |= (instruction.operand2 & 0x7FFF);

  return RedAsm.int52(lo, hi);
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

RedAsm.decorateAddressing = function(mode, value, incdec) {
  if (mode == RedAsm.ADDR_MODE_IMMEDIATE)
    return "0x"+parseInt(value).toString(16);

  var ret = "("+value+")";
  if (incdec == RedAsm.ADDR_MODE_PRE_DEC) {
    ret = "--"+ret;
  }
  else if (incdec == RedAsm.ADDR_MODE_PRE_INC) {
    ret = "++"+ret;
  }
  else if (incdec == RedAsm.ADDR_MODE_POST_DEC) {
    ret = ret+"--";
  }
  else if (incdec == RedAsm.ADDR_MODE_POST_INC) {
    ret = ret+"++";
  }
  if (mode == RedAsm.ADDR_MODE_INDIRECT)
    ret = "*"+ret;
  return ret;
}

RedAsm.mneumonicFromOpcode = function(opcode) {
  for (var mn in RedAsm.MNEUMONICS) {
    if (RedAsm.MNEUMONICS[mn] == opcode) {
      return mn;
    }
  }
  return null;
}



/*
 * int52_lo(n)
 *  Given a Number, return the low order 30 bits.
 */
RedAsm.int52_lo = function(n) {
  return n & 0x3fffffff;
}
/*
 * int52_hi(n)
 *  Given a Number, return the high order 22 bits.
 */
RedAsm.int52_hi = function(n) {
  return (n - (n & 0x3fffffff)) / 0x40000000;
}

RedAsm.int52 = function(lo, hi) {
  return (hi & 0x3fffff) * 0x40000000 + (lo & 0x3fffffff);
}
