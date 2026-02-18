/**
 * webpack.config.js - Webpackの設定ファイル
 */

const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    'content-bundle': './src/js/content.js',
    'popup': './src/js/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist/data'),
    filename: 'js/[name].js'
  },
  devtool: 'source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/manifest.json', to: './' },
        { from: './src/html', to: './html' },
        { from: './src/css', to: './css' },
        { from: './src/images', to: './images' },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js']
  },
};
