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

        console.log(opcode,a,b)

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
      'output': output,
    }
  },

  decompile: function(compiled_bytes) {
    //TODO
    return compiled_bytes.join('');
  },



}