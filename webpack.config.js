// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'production',
  // point at your entry‐point file:
  entry: path.resolve(__dirname, 'src/index.jsx'),
  output: {
    // emit to `dist/widget.js` (or wherever you like)
    filename: 'widget.js',
    path: path.resolve(__dirname, 'dist'),
    // UMD so it works in any <script> tag
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: path.resolve(__dirname, 'src'),
        use: {
          loader: 'babel-loader',
          options: {
            // compile JSX + modern JS
            presets: [
              ['@babel/preset-env', { targets: "defaults" }],
              '@babel/preset-react'
            ]
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
