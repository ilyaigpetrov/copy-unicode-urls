import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [{
  input: './src/worker.mjs',
  output: {
    file: './bundle.mjs',
    format: 'es',
  },
  plugins: [nodeResolve({ preferBuiltins: false })],
}];
