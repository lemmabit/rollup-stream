import hypothetical from 'rollup-plugin-hypothetical';

export default {
  input: './entry.js',
  format: 'es',
  plugins: [hypothetical({
    files: {
      './entry.js': 'import x from "./x.js"; console.log(x);',
      './x.js': 'export default "Hello, World!";'
    }
  })]
};
