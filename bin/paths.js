const fs = require('fs');
const path = require('path');
const isExist = function(file) {
	try {
		return fs.statSync(file).isFile();
	} catch (e) {
		if (e.code != 'ENOENT')
			throw e;
		return false;
	}
};
const configFile = path.join(process.cwd(), './config.json');
const types = {
	script: 'js',
	css: 'css,less',
	img: 'JPG,jpg,png,gif',
	html: 'html',
	font: 'eot,svg,ttf,woff'
};
const getPath = function() {
	if (isExist(configFile)) {
		let userConfig = require(configFile);
		let globalConfig = {
			types: types,
			paths: {
				scriptConcat: [path.join(userConfig.projectDir, './lib/seajs/sea.js'), path.join(userConfig.projectDir, './seajs.config.js'), path.join(userConfig.projectDir, './lib/seajs/manifest.js'), path.join(userConfig.projectDir, './lib/seajs/seajs-localcache.js')],
				scriptApp: [path.join(userConfig.projectDir, './js/*')],
				scriptLib: [path.join(userConfig.projectDir, './lib/*'), '!**/seajs'],
				image: [path.join(userConfig.projectDir, './img/**/*.{' + types.img + '}')],
				imageALL: [path.join(userConfig.projectDir, './**/*.{' + types.img + '}'), '!' + path.join(userConfig.projectDir, './img/**/*.{' + types.img + '}')],
				css: [path.join(userConfig.projectDir, './css/style.less')],
				cssAll: [path.join(userConfig.projectDir, './**/*.{' + types.css + '}'), '!' + path.join(userConfig.projectDir, './include/*'), '!' + path.join(userConfig.projectDir, './css/*')],
				font: [path.join(userConfig.projectDir, './font/*.{' + types.font + '}')],
				html: path.join(userConfig.projectDir, './*.html'),
				htmlAll: path.join(userConfig.projectDir, '**/*.html'),
				include: path.join(userConfig.projectDir, './include')
			},
			dist: {
				lib: path.join(userConfig.distDir, './lib'),
				js: path.join(userConfig.distDir, './js'),
				css: path.join(userConfig.distDir, './css'),
				font: path.join(userConfig.distDir, './font'),
				img: path.join(userConfig.distDir, './img'),
				html: path.join(userConfig.distDir)
			}
		};
		for (let x in userConfig) {
			if (userConfig.hasOwnProperty(x)) {
				globalConfig[x] = userConfig[x];
			}
		}
		return globalConfig;
	} else {
		console.log('config.json不存在！');
		return process.exit();
	}
};

module.exports = getPath;