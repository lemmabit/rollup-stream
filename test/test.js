var expect = require('chai').expect;
var rollup = require('..');
var Readable = require('stream').Readable;
var hypothetical = require('rollup-plugin-hypothetical');

function collect(stream) {
  return new Promise(function(resolve, reject) {
    var data = '';
    stream.on('end', function() {
      resolve(data);
    });
    stream.on('error', function(err) {
      reject(err);
    });
    stream.on('data', function(chunk) {
      data += chunk.toString();
    });
  });
}


describe("rollup-stream", function() {
  it("should export a function", function() {
    expect(rollup).to.be.a('function');
  });
  
  it("should return a readable stream", function() {
    expect(rollup()).to.be.an.instanceof(Readable);
  });
  
  it("should emit an error if options isn't passed", function(done) {
    var s = rollup();
    s.on('error', function(err) {
      expect(err.message).to.equal("options must be an object or a string!");
      done();
    });
    s.on('data', function() {
      done(Error("No error was emitted."));
    });
  });
  
  it("should emit an error if options.input isn't present", function(done) {
    var s = rollup({});
    s.on('error', function(err) {
      expect(err.message).to.equal("You must supply options.input to rollup");
      done();
    });
    s.on('data', function() {
      done(Error("No error was emitted."));
    });
  });
  
  it("should take a snapshot of options when the function is called", function() {
    var options = {
      input : './entry.js',
      format: 'es',
      plugins: [hypothetical({
        files: {
          './entry.js': 'import x from "./x.js"; console.log(x);',
          './x.js': 'export default "Hello, World!";'
        }
      })]
    };
    var s = rollup(options);
    options.entry = './nonexistent.js';
    return collect(s).then(function(data) {
      expect(data).to.have.string('Hello, World!');
    });
  });
  
  it("should use a custom Rollup if options.rollup is passed", function() {
    var options = {
      rollup: {
        rollup: function(options) {
          expect(options).to.equal(options);
          return Promise.resolve({
            generate: function(options) {
              expect(options).to.equal(options);
              return Promise.resolve({ code: 'fake code' });
            }
          });
        }
      }
    };
    return collect(rollup(options)).then(function(data) {
      expect(data).to.equal('fake code');
    });
  });
  
  it("shouldn't raise an alarm when options.rollup is passed", function() {
    return collect(rollup({
      input : './entry.js',
      format: 'es',
      rollup: require('rollup'),
      plugins: [{
        resolveId: function(id) {
          return id;
        },
        load: function() {
          return 'console.log("Hello, World!");';
        }
      }]
    })).then(function(data) {
      expect(data).to.have.string('Hello, World!');
    });
  });
  
  it("should import config from the specified file if options is a string", function() {
    return collect(rollup('test/fixtures/config.js')).then(function(data) {
      expect(data).to.have.string('Hello, World!');
    });
  });
  
  it("should reject with any error thrown by the config file", function(done) {
    var s = rollup('test/fixtures/throws.js');
    s.on('error', function(err) {
      expect(err.message).to.include("bah! humbug");
      done();
    });
    s.on('data', function() {
      done(Error("No error was emitted."));
    });
  });
  
  it("should emit a 'bundle' event when the bundle is output", function(done) {
    var s = rollup({
      input : './entry.js',
      format: 'es',
      plugins: [{
        resolveId: function(id) {
          return id;
        },
        load: function() {
          return 'console.log("Hello, World!");';
        }
      }]
    });
    var bundled = false;
    s.on('bundle', function(bundle) {
      bundled = true;
      bundle.generate({ format: 'es' }).then(function(result) {
        if(/Hello, World!/.test(result.code)) {
          done();
        } else {
          done(Error("The bundle doesn't contain the string \"Hello, World!\""));
        }
      }).catch(done.fail);
    });
    s.on('error', function(err) {
      done(Error(err));
    });
    s.on('data', function() {
      if(!bundled) {
        done(Error("No 'bundle' event was emitted."));
      }
    });
  });
});

describe("sourcemaps", function() {
  it("should be added when options.sourcemap is true", function() {
    return collect(rollup({
      input: './entry.js',
      format: 'es',
      sourcemap: true,
      plugins: [{
        resolveId: function(id) {
          return id;
        },
        load: function() {
          return 'console.log("Hello, World!");';
        }
      }]
    })).then(function(data) {
      expect(data).to.have.string('\n//# sourceMappingURL=data:application/json;');
    });
  });
  
  it("should still be added when options.sourceMap is true", function() {
    return collect(rollup({
      input: './entry.js',
      format: 'es',
      sourceMap: true,
      plugins: [{
        resolveId: function(id) {
          return id;
        },
        load: function() {
          return 'console.log("Hello, World!");';
        }
      }]
    })).then(function(data) {
      expect(data).to.have.string('\n//# sourceMappingURL=data:application/json;');
    });
  });
  
  it("should not be added otherwise", function() {
    return collect(rollup({
      input: './entry.js',
      format: 'es',
      plugins: [{
        resolveId: function(id) {
          return id;
        },
        load: function() {
          return 'console.log("Hello, World!");';
        }
      }]
    })).then(function(data) {
      expect(data).to.not.have.string('//# sourceMappingURL=');
    });
  });
});
