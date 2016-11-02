const path = require('path');

let projectFolder;
let distFolder;
let paths;
let dist;
const types = {
	script: 'js',
	css: 'css,less',
	img: 'JPG,jpg,png,gif',
	html: 'html',
	font: 'eot,svg,ttf,woff'
};

const getPaths = function(sourceDir) {
	if (sourceDir) {
		projectFolder = sourceDir;
	} else {
		projectFolder = '_src';
	}
	distFolder = 'dist' + projectFolder;
	paths = {
		scriptConcat: [path.join(projectFolder, './lib/seajs/sea.js'), path.join(projectFolder, './seajs.config.js'), path.join(projectFolder, './lib/seajs/manifest.js'), path.join(projectFolder, './lib/seajs/seajs-localcache.js')],
		scriptApp: [path.join(projectFolder, './js/*')],
		scriptLib: [path.join(projectFolder, './lib/*')],
		images: [path.join(projectFolder, './img/**/*.{' + types.img + '}')],
		css: [path.join(projectFolder, './css/style.less')],
		cssAll: [path.join(projectFolder, './css/**/*.less'), path.join('./_component/**/*.less'), path.join(projectFolder, './include/**/*.less')],
		font: [path.join(projectFolder, './font/*')],
		html: path.join(projectFolder, './*.html'),
		htmlAll: path.join(projectFolder, '**/*.html'),
		include: path.join(projectFolder, './include')
	};
	dist = {
		lib: path.join(distFolder, './lib'),
		js: path.join(distFolder, './js'),
		css: path.join(distFolder, './css'),
		font: path.join(distFolder, './font'),
		img: path.join(distFolder, './img'),
		html: path.join(distFolder)
	};
	return {
		projectFolder: projectFolder,
		distFolder: distFolder,
		paths: paths,
		dist: dist,
		types: types
	};
};

module.exports = getPaths;