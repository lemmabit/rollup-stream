var rollup = require('rollup').rollup,
    Readable = require('stream').Readable;

module.exports = function rollupStream(options) {
  var stream = new Readable();
  stream._read = function() {  };
  
  rollup(options).then(function(bundle) {
    bundle = bundle.generate(options);
    var code = bundle.code, map = bundle.map;
    
    stream.push(code);
    if(options.sourceMap) {
      stream.push('\n//# sourceMappingURL=');
      stream.push(map.toUrl());
    }
    stream.push(null);
  }).catch(function(reason) {
    setImmediate(function() {
      stream.emit('error', reason);
    });
  });
  
  return stream;
};
