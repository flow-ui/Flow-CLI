const del = require('del');
const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const watch = require('./watch');
const buildCore = require('./build');
const getPaths = require('./paths');

let pathObj;
let reload;
let types;

let watchHandle = function(type, file) {
	let ext = file.match(/.*\.{1}([^.]*)$/)[1],
		delfile = function(){
			del(file.replace(new RegExp(pathObj.projectFolder), pathObj.distFolder),{
				dryRun:true
			}).then(function(paths) {
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
				buildCore.scriptLib(pathObj, type === 'add' ? null : reload);
			} else if (file.indexOf('\\js\\') > -1) {
				if (type === 'unlink') {
					delfile();
				} else {
					buildCore.scriptApp(pathObj, type === 'add' ? null : reload);
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
				buildCore.images(pathObj, type === 'add' ? null : reload);
			}
			break;
		case 'css':
			buildCore.css(pathObj, type === 'add' ? null : reload);
			break;
		case 'font':
			if (type === 'unlink') {
				delfile();
			} else {
				buildCore.font(pathObj, type === 'add' ? null : reload);
			}
			break;
		case 'html':
			if (type === 'unlink') {
				delfile();
			} else {
				buildCore.html(pathObj, type === 'add' ? null : reload);
			}
			break;
		default:
			console.log(file + '不在监听范围');
	}
};

let run = function(dir) {
	let watcher;
	pathObj = getPaths(dir);
	types = pathObj.types;
	watcher = watch(pathObj.projectFolder);

	buildCore.build(pathObj.projectFolder, function() {
		browserSync.init({
			server: {
				baseDir: './',
				directory: true
			},
			startPath: pathObj.distFolder + "/index.html",
			reloadDelay: 0,
			port: 3000
		}, function() {
			reload = browserSync.reload;
			console.log('服务已启动...');
			watcher.on('all', watchHandle);
			watcher.on('error', function(error){
				console.log(error);
			});
		});
	});
};

module.exports = run;