  //EXECUTABLE
  // A CoffeeScript derivation with colon+end delimited blocks instead of indentation
var preprocess,
  indexOf = [].indexOf;

preprocess = function(source) {
  var code, converted, currentIndentation, decrement, delimiter, i, len, line, linenumber, match, multiline, nextIndentation, os, stripped;
  currentIndentation = 0;
  nextIndentation = 0;
  multiline = '';
  converted = [];
  for (linenumber = i = 0, len = source.length; i < len; linenumber = ++i) {
    line = source[linenumber];
    code = line.trim();
    if (multiline) {
      if (code.endsWith(multiline)) {
        multiline = '';
      }
      converted.push('  '.repeat(currentIndentation) + code);
      continue;
    } else if (match = code.match(/^(###|'''|""")/)) {
      multiline = match[1];
      stripped = code.replace(multiline);
      if (stripped.includes(multiline)) {
        multiline = '';
      }
      converted.push('  '.repeat(currentIndentation) + code);
      continue;
    }
    
    // Leading 'end/else/when/catch/finally': close previous block
    if (/^(end|else|when|catch|finally)\b/.test(code)) {
      decrement = /^end\s+switch\b/.test(code) ? 2 : 1;
      currentIndentation -= decrement;
      nextIndentation -= decrement;
      if (currentIndentation < 0) {
        break;
      }
      if (indexOf.call(process.argv, '--format') < 0) {
        code = code.replace(/^end(\s+\w+)?\s*/, '');
      }
    }
    
    // Trailing colon or arrow: open code block (ignore line if comment)
    if (/^(?!#).*(:|->|=>)$/.test(code)) {
      nextIndentation++;
      if (/\bswitch\b[^'"]*:$/.test(code)) {
        nextIndentation++;
      }
      if (indexOf.call(process.argv, '--format') < 0) {
        code = code.replace(/\s*:$/, '');
      }
    }
    // Send generated line to stdout, use 2 space indentation
    converted.push('  '.repeat(currentIndentation) + code);
    currentIndentation = nextIndentation;
  }
  if (currentIndentation) {
    delimiter = currentIndentation < 0 ? `colon or arrow before line ${linenumber + 1}` : "'end'";
    return `${linenumber + 1}: error: missing ${delimiter} `;
  }
  // Send converted file in one step to 'stdout'
  os = require('os');
  return console.log(converted.join(os.EOL));
};

(function() {  
  // ------------------------------------------------------------------------------
  var filename, fs, result, source;
  if (process.argv.length === 2) {
    console.log('CoffeeDelim 0.9\nUsage: node <path>coffeedelim [--format] <script>.coffee\n');
    process.exit(0);
  }
  fs = require('fs');
  filename = process.argv[process.argv.length - 1];
  try {
    source = fs.readFileSync(filename, 'utf8').split(/\r?\n/);
  } catch (error) {
    console.error(`File '${filename}' not found`);
    process.exit(1);
  }
  result = preprocess(source);
  if (result) {
    return console.error(`${filename}:${result}`);
  }
})();
