var Readable = require('stream').Readable;
var path = require('path');

module.exports = function rollupStream(options) {
  var stream = new Readable();
  stream._read = function() {  };
  
  var rollup = (options && options.rollup) || require('rollup');
  
  if(typeof options === 'object' && options !== null) {
    var options1 = {};
    for(var key in options) {
      if(key !== 'rollup') {
        options1[key] = options[key];
      }
    }
    options = Promise.resolve(options1);
  } else if(typeof options === 'string') {
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
  } else {
    options = Promise.reject(Error("options must be an object or a string!"));
  }
  
  options.then(function(options) {
    return rollup.rollup(options).then(function(bundle) {
      stream.emit('bundle', bundle);
      
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
