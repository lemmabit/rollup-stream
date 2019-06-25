const Readable  = require('stream').Readable;
const path      = require('path');

module.exports = function rollupStream(options) {
  const stream = new Readable();
  stream._read = () => {};
  
  if(typeof options === 'object' && options !== null) {
    options = Promise.resolve(options);
  } else if(typeof options === 'string') {
    const optionsPath = path.resolve(options);
    options = require('rollup').rollup({
      input: optionsPath,
      onwarn: warning => {
        if(warning.code !== 'UNRESOLVED_IMPORT') {
          console.warn(warning.message);
        }
      }
    })
    .then( bundle => bundle.generate({ format: 'cjs' }) )
    .then( result => {
      // don't look at me. this is how Rollup does it.
      const defaultLoader = require.extensions['.js'];
      
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
  
  options.then( options0 => {
    let rollup = options0.rollup;
    let hasCustomRollup = true;
    if(!rollup) {
      rollup = require('rollup');
      hasCustomRollup = false;
    }
    
    const options = {};
    for(const key in options0) {
      if(key === 'sourceMap' && !hasCustomRollup) {
        console.warn(
          "The sourceMap option has been renamed to \"sourcemap\" " +
          "(lowercase \"m\") in Rollup. The old form is now deprecated " +
          "in rollup-stream."
        );
        options.sourcemap = options0.sourceMap;
      } else if(key !== 'rollup') {
        options[key] = options0[key];
      }
    }
    
    return rollup.rollup(options)
      .then( bundle => {
        stream.emit('bundle', bundle);
      
        return bundle.generate(options);
      })
      .then( result => {
        for (const chunkOrAsset of result.output) {
          if (chunkOrAsset.isAsset) {
            stream.push(chunkOrAsset.source);
          } else {
            const code = chunkOrAsset.code, map = chunkOrAsset.map;
            stream.push(code);

            if(options.sourcemap || options.sourceMap) {
              stream.push('\n//# sourceMappingURL=');
              stream.push(map.toUrl());
            }
          }
        }

        stream.push(null);
      });
  })
  .catch( reason => {
    setImmediate( () => {
      stream.emit('error', reason);
    });
  });
  
  return stream;
};
