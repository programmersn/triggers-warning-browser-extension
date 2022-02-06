const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	devtool: 'source-map',
	stats: 'errors-only',
	entry: {
		backgroundPopupState: './src/backgroundPopupState',
		backgroundSubtitlesFetcher: './src/backgroundSubtitlesFetcher',
		popup: './src/popup',
		options: './src/options'
	},
	output: {
		// @todo Find a way to replicate as output in dist directory the tree structure of src 
		// directory (made out of folders popup, background, options ect ...) to better organize the 
		// code
		path: path.join(__dirname, 'dist'),
		filename: '[name].js'
	},
	resolve: {
		modules: [
			path.resolve('./src'),
			path.resolve('./node_modules')
		]
	},
	plugins: [
		new CopyWebpackPlugin(
			{
				patterns: [
					{ from: "src" },
					{ from: 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js' },
					{ from: 'node_modules/dompurify/dist/purify.min.js'}
				],
			},
		)
	],
	optimization: {
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					mangle: false,
					compress: false,
					output: {
						beautify: true,
						indent_level: 2 // eslint-disable-line camelcase
					}
				}
			})
		]
	}
};
