RedAsm = {

  MNEUMONICS: {
    'LD': 1,
    'ADD': 2,
    'JMP': 4,
  },

  compile: function(assembly_string) {
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
        return [2, resolveRelative(operand.slice(1))];
      } 
      else if (/^(0|\$|-)?\d+/.test(operand)) { // immediate
        operand = operand.replace(/^\$/,'')
        return [0, parseInt(operand)];
      } else if ((rel = resolveRelative(operand)) != null) { // relative address
        return [1, rel];
      }
      return null;
    };

    for (lineNumber = 0; lineNumber < lines.length; lineNumber++) {
      var line = lines[lineNumber];
      var colonIdx = line.indexOf(':');
      if (colonIdx != -1) { // label is present
        var label = line.substring(0, colonIdx).trim()
        line = line.substring(colonIdx+1);
        symbolTable[label] = lineNumber;
      }
      line = line.trim()
      if (!line)
        continue;
      tokens = line.split(/\s+/)
      // console.log("tokens",tokens)

      var mneumonic = tokens[0].toUpperCase();
      var firstOperand = tokens[1].trim().replace(/,$/,'')
      var secondOperand = (tokens[2] || "").trim();

      if (mneumonic in RedAsm.MNEUMONICS) {
        var opcode = RedAsm.MNEUMONICS[mneumonic];
        var firstOperand = tokens[1].trim().replace(/,$/,'')
        var secondOperand = (tokens[2] || "").trim();

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

        // console.log(opcode,a,b)

        //opcode is bits 31..28
        var outbyte = opcode<<28;
        //addressing mode for first operand bits 27,26
        outbyte |= (a[0]&0x3)<<26;
        //addressing mode for first operand bits 25,24
        outbyte |= (b[0]&0x3)<<24;
        //first operand bits 12..23
        outbyte |= (a[1]&0x0fff)<<12;
        //second operand bits 0..11
        outbyte |= (b[1]&0x0fff);

        output.push( outbyte )
      } 
      else if (mneumonic == '.BYTE') {
        output.push( parseInt(firstOperand.replace(/^\$/,'')) );
      }
      else {
        return {
          'success': false,
          'error': "Syntax error on line "+lineNumber+": No such operation '"+tokens[0]+"'",
        };
      }

    }

    // console.log("symbols",symbolTable)

    return {
      'success': true,
      'compiledBytes': output,
    }
  },

  disassemble: function(compiledBytes) {
    var _bytehex = function(number, padding) {
      var padding = padding || 2;
      var number = number.toString(16);
      if (padding > 2 && number < 32) 
        number = "0"+number;
      if (padding > 1 && number < 16) 
        number = "0"+number;
      return number;
    }
    var _signedcast = function(number) {
      // cast to 12 bit signed integer
      if ((number & 0xF00) == 0xF00) {
        var n = (number & 0xFFF)-1;
        return -(0xFFF - n);
      } 
      return number;
    }
    var _addrmode = function(mode, value) {
      if (mode == 0)
        return "$"+value;
      else if (mode == 1)
        return "("+value+")";
      else if (mode == 2)
        return "@"+value;
      return value;
    }
    var rows=[]
    for (var i=0; i<compiledBytes.length; i++) {
      var word  = compiledBytes[i];
      var opcode = (word & 0xF0000000)>>28;
      var mode1 =  (word & 0x0C000000)>>26;
      var mode2 =  (word & 0x03000000)>>24;
      var operand1 = (word & 0x00FFF000)>>12;
      var operand2 = (word & 0x0000FFF);

      var stmt;
      for (var mn in RedAsm.MNEUMONICS) {
        if (RedAsm.MNEUMONICS[mn] == opcode) {
          stmt = mn.toLowerCase();
          break;
        }
      }
      if (!stmt) { //unknown opcode
        stmt = ".BYTE 0x"+_bytehex(word,8)
      } else {
        stmt += " "+_addrmode(mode1, _signedcast(operand1));
        if (opcode != 4)
          stmt += ", "+_addrmode(mode2, _signedcast(operand2));
      }

      var row =  [_bytehex(i,4),
                  _bytehex(opcode),
                  _bytehex(mode1, 1),
                  _bytehex(mode2, 1),
                  _bytehex(operand1, 3),
                  _bytehex(operand2, 3),
                  stmt];

      rows.push(row);
    }
    return rows;
  },


}