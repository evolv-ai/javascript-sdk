const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js'
  },
  node: false,
  target: 'node',
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    })
  ],
  externals: {
    http: { commonjs: 'http' },
    https: { commonjs: 'https' },
    deepmerge: { commonjs2: 'deepmerge' },
    'base64-arraybuffer': { commonjs2: 'base64-arraybuffer' }
  }
};
