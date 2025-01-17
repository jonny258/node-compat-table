var testers = JSON.parse(readFile('./testers.json'));

supportVersion = 100;

// We'll need this for the tests
var global = {};

var DEBUG = false;

// This function is needed to run the tests and was extracted from:
// https://github.com/kangax/compat-table/blob/gh-pages/node.js
function __createIterableObject(arr, methods) {
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
function next(ver) {
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
        setTimeout(next, 10, versions.pop());
      }
    })
  })
}

setTimeout(next, 10, versions.pop());

function run(name, script, cb) {
  // kangax's Promise tests reply on a asyncTestPassed function.
  var async = /asyncTestPassed/.test(script)
  if (async) {
    runAsync(name, script, function (result) {
      return cb(result);
    });
  } else {
    var result = runSync(script);
    return cb(result);
  }
}

function runAsync(name, script, cb) {
  if (DEBUG) {
    print('started ' + name);
  }

  var timer = setTimeout(function () {
    if (DEBUG) {
      print('timeout: ' + name);
    }
    cb(false);
  }, 5000)

  try {
    // This confusing bit of JS creates a function that runs the
    // code called "script" and assigns the name "asyncTestPassed"
    // to its first argument. All the test scripts will call that!
    var fn = new Function('asyncTestPassed', script);

    fn(function () {
      if (DEBUG) {
        print('success: ' + name);
      }
      clearTimeout(timer);
      setTimeout(function () {
        if (DEBUG) {
          print('moving on: ' + name);
        }
        cb(true);
      });
    })
  } catch (e) {
    clearTimeout(timer);
    setTimeout(function () {
      if (DEBUG) {
        print('failure: ' + name);
      }
      cb(e.message);
    });
  }
}

function runSync(script) {
  if (DEBUG) {
    print('***\n' + script + '*** ...');
  }
  try {
    var fn = new Function(script)
    var result = fn() || false;
    if (DEBUG) {
      print(result + '\n');
    }
    return result;
  } catch (e) {
    if (DEBUG) {
      print(e.message + '\n');
    }
    return e.message
  }
}

function write() {
  print(JSON.stringify(output, null, 2));
}
