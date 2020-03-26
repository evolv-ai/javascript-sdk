const path = require('path');
const webpack = require('webpack');

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
    http: 'http',
    https: 'https',
    deepmerge: 'deepmerge',
    'base64-arraybuffer': 'base64-arraybuffer'
  }
};
