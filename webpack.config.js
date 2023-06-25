const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    displayeditor: './advancewars/displayeditor.ts',
    hearty: './boorus/hearty.user.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        use: {
          loader: 'babel-loader',
        },
        exclude: /node_modules/,
      },
      {
        test: /\.s?css$/,
        use: [
          'css-loader',
          'sass-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
};
