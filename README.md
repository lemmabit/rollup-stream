# rollup-stream [![npm][npm-image]][npm-url] [![Dependency Status][david-image]][david-url] [![Build Status][travis-image]][travis-url]
This is a simple wrapper around [Rollup] that returns a readable stream instead
of a Promise, like Browserify's bundle() method. It's designed to make using
Rollup with [gulp] easier, but if you find another use for it, go ahead!

The options object is passed to Rollup's rollup() and generate() methods. This
currently works because there's no overlap between the names of the options
those methods take. Hopefully that won't change any time soon!

## Installation
```bash
npm install --save-dev rollup-stream
```

## Basic usage
```js
var gulp = require('gulp'),
    rollup = require('rollup-stream'),
    source = require('vinyl-source-stream');

gulp.task('rollup', function() {
  return rollup({
      input: './src/main.js'
    })
    
    // give the file the name you want to output with.
    .pipe(source('app.js'))
    
    // and output to ./dist/app.js as normal.
    .pipe(gulp.dest('./dist'));
});
```

## Usage with sourcemaps
```js
var gulp = require('gulp'),
    rollup = require('rollup-stream'),
    sourcemaps = require('gulp-sourcemaps'),
//  rename = require('gulp-rename'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer');

gulp.task('rollup', function() {
  return rollup({
      input: './src/main.js',
      sourcemap: true
    })
    
    // point to the entry file.
    .pipe(source('main.js', './src'))
    
    // buffer the output. most gulp plugins, including gulp-sourcemaps, don't support streams.
    .pipe(buffer())
    
    // tell gulp-sourcemaps to load the inline sourcemap produced by rollup-stream.
    .pipe(sourcemaps.init({loadMaps: true}))
        
        // transform the code further here.
        
    // if you want to output with a different name from the input file, use gulp-rename here.
//  .pipe(rename('index.js'))
    
    // write the sourcemap alongside the output file.
    .pipe(sourcemaps.write('.'))
    
    // and output to ./dist/main.js as normal.
    .pipe(gulp.dest('./dist'));
});
```

## Usage with caching
```js
var gulp = require('gulp'),
    rollup = require('rollup-stream'),
    source = require('vinyl-source-stream');

var cache;
gulp.task('rollup', function() {
  return rollup({
      input: './src/main.js',
      cache: cache
    })
    
    .on('bundle', function(bundle) {
      cache = bundle;
    })
    
    // after listening for the 'bundle' event, proceed as usual.
    .pipe(source('app.js'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('watch', function() {
  gulp.watch('./src/**/*.js', ['rollup']);
});
```

## Usage with newer, older, or custom Rollup
```js
var gulp = require('gulp'),
    rollup = require('rollup-stream'),
    source = require('vinyl-source-stream');

gulp.task('rollup', function() {
  return rollup({
      input: './src/main.js',
      rollup: require('rollup')
    })
    
    // after passing options.rollup, proceed as usual.
    .pipe(source('app.js'))
    .pipe(gulp.dest('./dist'));
});
```

## Usage with Rollup config file
```js
var gulp = require('gulp'),
    rollup = require('rollup-stream'),
    source = require('vinyl-source-stream');

gulp.task('rollup', function() {
  return rollup('rollup.config.js')
    .pipe(source('app.js'))
    .pipe(gulp.dest('./dist'));
});
```


[npm-url]: https://npmjs.org/package/rollup-stream
[npm-image]: https://img.shields.io/npm/v/rollup-stream.svg
[david-url]: https://david-dm.org/Permutatrix/rollup-stream
[david-image]: https://img.shields.io/david/Permutatrix/rollup-stream/master.svg
[travis-url]: https://travis-ci.org/Permutatrix/rollup-stream
[travis-image]: https://img.shields.io/travis/Permutatrix/rollup-stream/master.svg

[Rollup]: https://www.npmjs.com/package/rollup
[gulp]: http://gulpjs.com/
