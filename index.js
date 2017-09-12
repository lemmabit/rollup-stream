var Readable = require('stream').Readable;
var path = require('path');

function isObject(obj) {
  return typeof obj === 'object' && obj !== null;
}

var assign = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
};

module.exports = function rollupStream(options) {
  var stream = new Readable();
  stream._read = function() {  };
  
  if(isObject(options)) {
    options = Promise.resolve(options);
  } else if(typeof options === 'string') {
    var optionsPath = path.resolve(options);
    options = require('rollup').rollup({
      input: optionsPath,
      onwarn: function(warning) {
        if(warning.code !== 'UNRESOLVED_IMPORT') {
          console.warn(warning.message);
        }
      }
    }).then(function(bundle) {
      return bundle.generate({ format: 'cjs' });
    }).then(function(result) {
      // don't look at me. this is how Rollup does it.
      var defaultLoader = require.extensions['.js'];
      
      require.extensions['.js'] = function(m, filename) {
        if(filename === optionsPath) {
          m._compile(result.code, filename);
        } else {
          defaultLoader(m, filename);
        }
      };
      
      try {
        return require(optionsPath);
      } finally {
        require.extensions['.js'] = defaultLoader;
      }
    });
  } else {
    options = Promise.reject(Error("options must be an object or a string!"));
  }
  
  options.then(function(options0) {
    if (options0.output === undefined || !isObject(options0.output)) {
      return Promise.reject(new Error("You must specify options.output and it must be an object"));
    }

    var rollup = options0.rollup;
    var hasCustomRollup = true;
    if(!rollup) {
      rollup = require('rollup');
      hasCustomRollup = false;
    }
    
    var options = {};
    var outputOptions = {};

    for(var key in options0) {
      if(key === 'sourceMap' && !hasCustomRollup) {
        console.warn(
          "The sourceMap option has been renamed to \"sourcemap\" " +
          "(lowercase \"m\") in Rollup. The old form is now deprecated " +
          "in rollup-stream."
        );
        outputOptions.sourcemap = options0.sourceMap;
      } else if(key !== 'rollup') {
        options[key] = options0[key];
        outputOptions[key] = options0[key];
      }
    }
    
    assign(outputOptions, options0.output);

    return rollup.rollup(options).then(function(bundle) {
      stream.emit('bundle', bundle);
      
      return bundle.generate(outputOptions);
    }).then(function(result) {
      var code = result.code, map = result.map;
      
      stream.push(code);
      if(outputOptions.sourcemap) {
        stream.push('\n//# sourceMappingURL=');
        stream.push(map.toUrl());
      }
      stream.push(null);
    });
  }).catch(function(reason) {
    setImmediate(function() {
      stream.emit('error', reason);
    });
  });
  
  return stream;
};
