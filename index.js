var Readable = require('stream').Readable;

module.exports = function rollupStream(options) {
  var stream = new Readable();
  stream._read = function() {  };
  
  var rollup = options && options.rollup;
  if(options && 'rollup' in options) {
    delete options.rollup;
  }
  if(!rollup) {
    rollup = require('rollup');
  }
  
  rollup.rollup(options).then(function(bundle) {
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
