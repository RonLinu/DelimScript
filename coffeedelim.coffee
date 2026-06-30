#EXECUTABLE
# A CoffeeScript derivation with colon+end delimited blocks instead of indentation

preprocess = (source) ->
  currentIndentation = 0
  nextIndentation = 0
  multiline = ''
  converted = []

  for line, linenumber in source
    code = line.trim()

    if multiline
      if code.endsWith(multiline) then multiline = ''
      converted.push '  '.repeat(currentIndentation) + code
      continue
    else if match = code.match(/(^###|'''|""")/)
      multiline = match[1]
      stripped = code.replace(multiline)
      if stripped.includes(multiline) then multiline = ''
      converted.push '  '.repeat(currentIndentation) + code
      continue
      
    # Leading 'end/else/when/catch/finally': close previous block
    if/^(end|else|when|catch|finally)\b/.test(code)
      decrement = if /^end\s+switch\b/.test(code) then 2 else 1
      currentIndentation -= decrement
      nextIndentation -= decrement
      break if currentIndentation < 0
      if '--format' not in process.argv then code = code.replace(/^end(\s+\w+)?\s*/,'')
    
    # Trailing colon or arrow: open code block (ignore line if comment)
    if /^(?!#).*(:|->|=>)$/.test(code)
      nextIndentation++
      if /\bswitch\b[^'"]*:$/.test(code) then nextIndentation++
      if '--format' not in process.argv then code = code.replace(/\s*:$/,'')

    # Send generated line to stdout, use 2 space indentation
    converted.push '  '.repeat(currentIndentation) + code
    currentIndentation = nextIndentation

  if currentIndentation
    delimiter = if currentIndentation < 0 then "colon or arrow before line #{linenumber+1}" else "'end'"
    return "#{linenumber+1}: error: missing #{delimiter} "

  # Send converted file in one step to 'stdout'
  os = require 'os'
  console.log converted.join(os.EOL)
    
# ------------------------------------------------------------------------------
do ->
  if process.argv.length == 2
    console.log 'CoffeeDelim 0.9\nUsage: node <path>coffeedelim [--format] <script>.coffee\n'
    process.exit 0

  fs = require 'fs'
  
  filename =  process.argv[ process.argv.length-1]
  try
    source = fs.readFileSync(filename, 'utf8').split(/\r?\n/)
  catch
    console.error "File '#{filename}' not found"
    process.exit 1

  result = preprocess(source)
  if result then console.error "#{filename}:#{result}"
