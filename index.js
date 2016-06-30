var Readable = require('stream').Readable;
var path = require('path');

module.exports = function rollupStream(options) {
  var stream = new Readable();
  stream._read = function() {  };
  
  if(typeof options !== 'string') {
    options = Promise.resolve(options);
  } else {
    var optionsPath = path.resolve(options);
    options = require('rollup').rollup({
      entry: optionsPath,
      onwarn: function(message) {
        if(!/Treating .+ as external dependency/.test(message)) {
          console.error(message);
        }
      }
    }).then(function(bundle) {
      var code = bundle.generate({ format: 'cjs' }).code;
      
      // don't look at me. this is how Rollup does it.
      var defaultLoader = require.extensions['.js'];
      
      require.extensions['.js'] = function(m, filename) {
        if(filename === optionsPath) {
          m._compile(code, filename);
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
  }
  
  options.then(function(options) {
    var rollup = (options && options.rollup) || require('rollup');
    if(options && 'rollup' in options) {
      delete options.rollup;
    }
    
    return rollup.rollup(options).then(function(bundle) {
      bundle = bundle.generate(options);
      var code = bundle.code, map = bundle.map;
      
      stream.push(code);
      if(options.sourceMap) {
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
