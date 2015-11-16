var expect = require('chai').expect;
var rollup = require('..');
var Readable = require('stream').Readable;


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
  
  it("should emit an error if options.entry isn't present", function(done) {
    var s = rollup({});
    s.on('error', function(err) {
      expect(err.message).to.equal("You must supply options.entry to rollup");
      done();
    });
    s.on('data', function() {
      done(Error("No error was emitted."));
    });
  });
});

describe("sourcemaps", function() {
  it("should be added when options.sourceMap is true", function() {
    return collect(rollup({entry: './entry.js', sourceMap: true, plugins: [{
      load: function() {
        return 'console.log("Hello, World!");';
      }
    }]})).then(function(data) {
      expect(data).to.have.string('\n//# sourceMappingURL=data:application/json;');
    });
  });
  
  it("should not be added otherwise", function() {
    return collect(rollup({entry: './entry.js', plugins: [{
      load: function() {
        return 'console.log("Hello, World!");';
      }
    }]})).then(function(data) {
      expect(data).to.not.have.string('//# sourceMappingURL=');
    });
  });
});
