const path = require('path');

const del = require('del');
const gulp = require('gulp');
const gutil = require('gulp-util');
const browserSync = require('browser-sync').create();
const ora = require('ora');

const watch = require('./watch');
const buildCore = require('./build');
const globalConfig = require('./paths')(process.configName);
const types = globalConfig.types;
const util = require('./util');

const isPathInDir = function(filePath, dir) {
	filePath = filePath.replace(/\\/g, path.sep);
	return filePath.indexOf(dir) === 0;
};
let spinner = ora();
let reload;

let watchHandle = function(type, file) {
	let ext = file.match(/.*\.{1}([^.]*)$/) ? file.match(/.*\.{1}([^.]*)$/)[1] : null,
		compileExt,
		delfile = function() {
			let delfilepath = path.join( globalConfig.dist.base, file.replace(new RegExp(globalConfig.projectDir), ''));
			if (compileExt === 'css' || compileExt === 'js') {
				delfilepath = delfilepath.replace('.' + ext, '.' + compileExt);
			}
			del(delfilepath, {force:true}).then(function(paths) {
				if (paths.length) {
					console.log(gutil.colors.magenta('\ndelete: ') + paths.join(' '));
				}
			});
		},
		copyFile;
	if(Array.isArray(globalConfig.extendsPath) && globalConfig.extendsPath.length){
		globalConfig.extendsPath.forEach(function(ext, index) {
			if (isPathInDir(file, ext.split('/*')[0])) {
				copyFile = file;
				return null;
			}
		});
	}
	if(copyFile){
		return buildCore.copy(copyFile);
	}
	for (let key in types) {
		if (types.hasOwnProperty(key)) {
			if (types[key].indexOf(ext) > -1) {
				compileExt = key;
				break;
			}
		}
	}
	switch (compileExt) {
		case 'script':
			if (type === 'unlink') {
				delfile();
			} else {
				buildCore.script(file, type === 'add' ? null : reload);
			}
			break;
		case 'img':
			if (type === 'unlink') {
				delfile();
			} else {
				buildCore.image(file, type === 'add' ? null : reload);
			}
			break;
		case 'css':
			if (type === 'unlink') {
				delfile();
			} else {
				buildCore.css(file, type === 'add' ? null : reload);
			}
			break;
		case 'font':
			if (type === 'unlink') {
				delfile();
			} else {
				buildCore.font(file, type === 'add' ? null : reload);
			}
			break;
		case 'html':
			if (type === 'unlink') {
				delfile();
			} else {
				buildCore.html(file, type === 'add' ? null : reload);
			}
			break;
		default:
			if (type === 'unlink' || type === 'unlinkDir') {
				delfile();
			}
	}
};

let run = function() {
	let watcher = watch(globalConfig.projectDir);
	let freshTimer = 0;
	buildCore.build(function() {
		browserSync.init({
			server: {
				baseDir: globalConfig.root,
				directory: true
			},
			startPath: globalConfig.distDir + "/" + globalConfig.homePage,
			reloadDelay: globalConfig.reloadDelay,
			reloadDebounce: globalConfig.reloadDelay,
			port: globalConfig.port,
			ghostMode: false,
			online: false,
			notify: false,
			scrollProportionally: false,
			logLevel: "silent"
		}, function() {
			reload = function() {
				spinner.text = ("localhost:" + gutil.colors.green(globalConfig.port) + ' reload(' + gutil.colors.magenta(++freshTimer) + ')');
				spinner.render();
				browserSync.reload();
			};
			console.log(
				gutil.colors.green(" ----------- ----- ---- --- -- -  -   -    -") +
				gutil.colors.green("\n|") +" 开发路径: " + process.cwd() + path.sep + globalConfig.projectDir +
				gutil.colors.green("\n|") +" 编译路径: " + process.cwd() + path.sep + globalConfig.dist.base +
				gutil.colors.green("\n|") +" 发布端口: " + "localhost:" + globalConfig.port + 
				gutil.colors.green("\n ----------- ----- ---- --- -- -  -   -    -")
			);
			spinner.text = '服务已启动...';
			spinner.succeed();
			watcher.on('all', watchHandle);
			watcher.on('error', function(error) {
				console.log(error);
			});
		});
	});
};

module.exports = run;