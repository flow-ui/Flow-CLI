const util = require('./util');
const path = require('path');

const configFile = path.join(process.cwd(), './config.json');
const types = {
	script: 'js,coffee',
	css: 'css,less',
	img: 'JPG,jpg,png,gif',
	html: 'htm,html',
	font: 'eot,svg,ttf,woff'
};
const getPath = function() {
	if (util.isExist(configFile)) {
		let userConfig = require(configFile);
		let globalConfig = {};
		for (let x in userConfig) {
			if (userConfig.hasOwnProperty(x)) {
				globalConfig[x] = userConfig[x];
			}
		}
		globalConfig.types = types;
		globalConfig.paths = {
			scriptConcat: [path.join(userConfig.projectDir, '/lib/seajs/sea.js'), globalConfig.compress ? path.join(userConfig.projectDir, '/seajs.config.js') : '', path.join(userConfig.projectDir, '/lib/seajs/manifest.js'), path.join(userConfig.projectDir, '/lib/seajs/seajs-localcache.js')],
			scriptApp: [path.join(userConfig.projectDir, '/js/*.{' + types.script + '}')],
			scriptLib: [path.join(userConfig.projectDir, '/lib/**'), '!' + path.join(userConfig.projectDir, '/lib/seajs/**')],
			imageAll: [path.join(userConfig.projectDir, '/**/*.{' + types.img + '}')],
			cssMain: ['/css/style.less', '/css/resp-smal.less', '/css/resp-midd.less', '/css/config.less', '/css/responsive.less', '_component/'],
			cssMainTarget: path.join(globalConfig.projectDir, '/css/style.less'),
			cssOther: [path.join(userConfig.projectDir, '/**/*.{' + types.css + '}'), '!' + path.join(userConfig.projectDir, '/include/**'), '!' + path.join(userConfig.projectDir, '/css/style.less'), '!' + path.join(userConfig.projectDir, '/css/resp-smal.less'), '!' + path.join(userConfig.projectDir, '/css/resp-midd.less'), '!' + path.join(userConfig.projectDir, '/css/config.less'), '!' + path.join(userConfig.projectDir, '/css/responsive.less')],
			font: [path.join(userConfig.projectDir, '/font/*.{' + types.font + '}')],
			html: path.join(userConfig.projectDir, '/*.{' + types.html + '}'),
			htmlAll: path.join(userConfig.projectDir, '**/*.{' + types.html + '}'),
			include: path.join(userConfig.projectDir, '/include')
		};
		globalConfig.dist = {
			lib: path.join(userConfig.distDir, './lib'),
			js: path.join(userConfig.distDir, './js'),
			css: path.join(userConfig.distDir, './css'),
			font: path.join(userConfig.distDir, './font'),
			img: path.join(userConfig.distDir, './img'),
			html: path.join(userConfig.distDir, './')
		};
		return globalConfig;
	} else {
		console.log('config.json不存在！');
		return process.exit();
	}
};

module.exports = getPath;