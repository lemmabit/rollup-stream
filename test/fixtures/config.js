import hypothetical from 'rollup-plugin-hypothetical';

export default {
  entry: './entry.js',
  plugins: [hypothetical({
    files: {
      './entry.js': 'import x from "./x.js"; console.log(x);',
      './x.js': 'export default "Hello, World!";'
    }
  })]
};
