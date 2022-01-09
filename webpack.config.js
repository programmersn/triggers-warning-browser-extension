const path = require('path');
//const SizePlugin = require('size-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	devtool: 'source-map',
	stats: 'errors-only',
	entry: {
		backgroundHelperFunctions: './src/backgroundHelperFunctions',
		backgroundPopupState: './src/backgroundPopupState',
		backgroundSubtitlesFetcher: './src/backgroundSubtitlesFetcher',
		contentScriptSubtitlesSelector: './src/contentScriptSubtitlesSelector',
		popup: './src/popup',
		options: './src/options'

	},
	output: {
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
		//new SizePlugin(),
		new CopyWebpackPlugin(
			{
				patterns: [
					{ from: "src" },
					{ from: 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js' }
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
