var rollup = require('rollup').rollup,
    Readable = require('stream').Readable;

module.exports = function rollupStream(options) {
  var stream = new Readable();
  stream._read = function() {  };
  
  if(options && options.sourceMap) {
    options.sourceMap = 'inline';
  }
  
  rollup(options).then(function(bundle) {
    bundle = bundle.generate();
    var code = bundle.code, map = bundle.map;
    
    if(options.sourceMap) {
      code += '\n//# sourceMappingURL=' + map.toUrl();
    }
    
    stream.push(code);
    stream.push(null);
  }, function(reason) {
    stream.emit('error', reason);
  });
  
  return stream;
};
