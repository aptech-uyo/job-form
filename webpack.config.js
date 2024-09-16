const GasPlugin = require("gas-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const path = require("path")

const entry = "./build/index.js"
const output = {
  path: path.resolve(__dirname, "dist"),
  filename: "Code.js",
}

module.exports = {
  // we always use dev mode because bundle size is unimportant - code runs server-side
  mode: "development",
  context: __dirname,
  entry,
  output,
  plugins: [
    new GasPlugin({
      autoGlobalExportsFiles: [entry],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, "appsscript.json") },
        { from: "src/*.html", to: "[name][ext]" },
      ],
    }),
  ],
  devtool: false,
}
