// webpack.reportgen.config.js
// Webpack configuration for building report generation module for Node.js
// Context: Bundles the report generation code for server-side execution

const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production',
  target: 'node',
  entry: './src/reportGeneration/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist/reportGeneration'),
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  externals: [nodeExternals()],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.reportgen.json',
            transpileOnly: true
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  optimization: {
    minimize: false // Keep readable for debugging
  }
};