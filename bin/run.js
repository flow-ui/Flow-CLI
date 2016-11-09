const del = require('del');
const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const watch = require('./watch');
const buildCore = require('./build');
const globalConfig = require('./paths')();
const types = globalConfig.types;
const clc = require('cli-color');
const ora = require('ora');
let spinner = ora();
let reload;

let watchHandle = function(type, file) {
	let ext = file.match(/.*\.{1}([^.]*)$/) ? file.match(/.*\.{1}([^.]*)$/)[1] : null,
		delfile = function() {
			del(file.replace(new RegExp(globalConfig.projectDir), globalConfig.distDir)).then(function(paths) {
				console.log('已删除:\n', paths.join('\n'));
			});
		};
	for (let key in types) {
		if (types.hasOwnProperty(key)) {
			if (types[key].indexOf(ext) > -1) {
				ext = key;
				break;
			}
		}
	}
	switch (ext) {
		case 'script':
			if (file.indexOf('\\lib\\') > -1 || file.indexOf('seajs.config') > -1) {
				buildCore.scriptLib(file, type === 'add' ? null : reload);
			} else if (file.indexOf('\\js\\') > -1) {
				if (type === 'unlink') {
					delfile();
				} else {
					buildCore.scriptApp(file, type === 'add' ? null : reload);
				}
			} else if (type === 'change' && typeof reload === 'function') {
				reload();
			} else {
				console.log('script 未命中:' + file);
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

	buildCore.build(function() {
		browserSync.init({
			server: {
				baseDir: './',
				directory: true
			},
			startPath: globalConfig.distDir + "/" + globalConfig.homePage,
			reloadDelay: 0,
			port: globalConfig.port,
			logLevel: "silent"
		}, function() {
			reload = function() {
				console.warn(clc.white('浏览器刷新...'));
				browserSync.reload();
			};
			console.log(
				clc.green("[开发路径] ") + "/" + globalConfig.projectDir +
				clc.green("\n[编译路径] ") + "/" + globalConfig.distDir +
				clc.green("\n[发布地址] ") + "http://localhost:" + globalConfig.port
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