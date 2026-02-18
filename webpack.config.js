/**
 * webpack.config.js - Webpackの設定ファイル
 *
 * このファイルはソースコードのビルドと難読化のための設定を提供します。
 */

const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  // 環境情報をログ表示
  console.log(`ビルドモード: ${isProduction ? '本番（難読化あり）' : '開発'}`);

  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      'content-bundle': './src/js/content.js',
      'popup': './src/js/popup.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist/data'),
      filename: 'js/[name].js'
    },
    // 開発時のみソースマップを生成
    devtool: isProduction ? false : 'source-map',
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
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
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
            },
            mangle: true,
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],
    },
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
    // 開発サーバー設定 (webpack-dev-serverを使用する場合)
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist/data'),
      },
      compress: true,
      port: 9000,
    }
  };
};
