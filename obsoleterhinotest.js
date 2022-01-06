var testers = JSON.parse(readFile('./testers.json'));

// We'll need this for the tests
var global = {};

// This function is needed to run the tests and was extracted from:
// https://github.com/kangax/compat-table/blob/gh-pages/node.js
function __createIterableObject (arr, methods) {
  methods = methods || {}
  if (typeof Symbol !== 'function' || !Symbol.iterator) {
    return {}
  }

  arr.length++
  var iterator = {
    next: function () {
      return {
        value: arr.shift(),
        done: arr.length <= 0
      }
    },
    'return': methods['return'],
    'throw': methods['throw']
  }
  var iterable = {}
  iterable[Symbol.iterator] = function () { return iterator }

  return iterable
}

global.__createIterableObject = __createIterableObject;

var output = {
  _version: 'UNKNOWN',
  _engine: 'Rhino',
}

var versions = Object.keys(testers)
function next (ver) {
  if (!ver) return write()

  var completed = 0
  var results = output[ver] = {
    _successful: 0,
    _count: Object.keys(testers[ver]).length,
    _percent: 0
  }
  Object.keys(testers[ver]).forEach(function (name) {
    var script = testers[ver][name].code
    results[name] = false // make SURE it makes it to the output

    run(name, script, function (result) {
      // expected results: `e.message` or true/false
      results[name] = typeof result === 'string' ? result : !!result
      if (results[name] === true) results._successful++

      if (++completed === results._count) {
        results._percent = results._successful / results._count
		// In the future this needs to become setTimeout
		// so that we can support Promises
		next(versions.pop());
      }
    })
  })
}
next(versions.pop());

function run (name, script, cb) {
  // The variable "supportVersion" should have been set in "rhinoall.sh" to tell us
  // approximately what version of Rhino we're using. This is necessary because the
  // tests below don't just fail, but cause Rhino to crash in older versions.

  if (supportVersion <= 10 && /__define[GS]etter__.+ToObject/.test(name)) {
	  return cb(false);
  }

  if (supportVersion <= 7 && /trailing commas in function syntax/.test(name)) {
    return cb(false);
  }

  if (supportVersion <= 7 && /incomplete patterns and quantifiers/.test(name)) {
	  return cb(false);
  }

  // kangax's Promise tests reply on a asyncTestPassed function.
  var async = /asyncTestPassed/.test(script)
  if (async) {
    runAsync(script, function (result) {
      return cb(result)
    })
  } else {
    var result = runSync(script)
    return cb(result)
  }
}

function runAsync (script, cb) {

  try {
    var fn = new Function('asyncTestPassed', script)

    fn(function () {
	  // TODO eventually do this async. We don't have that today.
	  cb(true);
    })
  } catch (e) {
    cb(e.message)
  }
}

function runSync (script) {
  try {
    var fn = new Function(script)
    return fn() || false
  } catch (e) {
    return e.message
  }
}

function write () {
  print(JSON.stringify(output, null, 2));
}
