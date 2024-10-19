'use strict'
const path = require('path');

module.exports = {
    entry: {
        main: ['./src/main.js']
    },
    output: {
        path: path.resolve(__dirname, './build'),
        filename: '[name].js'
    },
    module: {
        rules: [
          {
            test: /\.js$/, // Handle JavaScript files
            include: path.resolve(__dirname, './src'),
            loader: 'babel-loader'
          },
          {
            test: /\.(sass|css)$/,
            use: ['style-loader', 'css-loader', 'less-loader', 'sass-loader']
          },
          {
            test: /\.(png|jpe?g|gif|svg)$/i, // Handle image files
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: '[name].[ext]',
                  outputPath: 'images/', // Output folder for images
                },
              },
            ],
          }
        ]
      },
    plugins: [],
    devServer: {
        static: './public',
        host: 'localhost',
        port: 8080,
        historyApiFallback: true, // This ensures the index.html is served for all routes
    }
}