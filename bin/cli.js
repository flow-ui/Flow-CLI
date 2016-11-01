const fs = require('fs');
const path = require('path');
const del = require('del');
const gulp = require('gulp');
const replace = require('gulp-replace');
const includer = require('gulp-include');
const imagemin = require('gulp-imagemin');
const less = require('gulp-less');
const LessAutoprefix = require('less-plugin-autoprefix');
const autoprefix = new LessAutoprefix();
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const download = require('download-git-repo');
const ora = require('ora');
const chokidar = require('chokidar');

const types = {
	script: 'js',
	css: 'css,less',
	img: 'JPG,jpg,png,gif',
	html: 'html',
	font: 'eot,svg,ttf,woff'
};

let projectFolder;
let distFolder;
let paths;
let dist;

const getPaths = function(sourceDir){
	if(sourceDir){
		projectFolder = sourceDir;
		distFolder = path.join('./dist_'+projectFolder);
	}else{
		projectFolder = './_src';
		distFolder = path.join('./dist');
	}
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
		html: distFolder
	};
};

let reload;

const scriptLib = function(callback) {
	gulp.src(paths.scriptLib)
		.pipe(gulp.dest(dist.lib));
	gulp.src(paths.scriptConcat)
		.pipe(concat('sea.js'))
		.pipe(replace('__folder', '/' + distFolder))
		.pipe(gulp.dest(dist.lib))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

const scriptApp = function(callback) {
	gulp.src(paths.scriptApp)
		.pipe(gulp.dest(dist.js))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let script = function(callback) {
	var got = 0,
		todoList = script.prototype.todoList,
		resolve = function() {
			got++;
			if (got >= todoList.length && typeof(callback) === 'function') {
				callback();
				got = null;
				resolve = null;
				todoList = null;
			}
		};
	script.prototype.todoList.forEach(function(item, index) {
		item(resolve);
	});
};
script.prototype.todoList = [scriptLib, scriptApp];

let images = function(callback) {
	gulp.src(paths.images)
		.pipe(imagemin())
		.pipe(gulp.dest(dist.img))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let font = function(callback) {
	del(dist.font, {
		force: true
	}).then(function() {
		return gulp.src(paths.font)
			.pipe(gulp.dest(dist.font))
			.on('end', function() {
				if (typeof(callback) === 'function') {
					callback();
				}
			});
	});
};

let css = function(callback) {
	gulp.src(paths.css)
		.pipe(includer({
			extensions: ['css', 'less'],
			hardFail: true,
			includePaths: [path.join('./_component'), path.join(projectFolder, './css'), path.join(projectFolder, './include')]
		}))
		.pipe(less({
			plugins: [autoprefix],
			compress: true
		}))
		.pipe(gulp.dest(dist.css))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let html = function(callback) {
	gulp.src(paths.html)
		.pipe(includer({
			includePaths: [path.join(projectFolder, './include')]
		}))
		.pipe(replace('__folder', '/' + distFolder))
		.pipe(gulp.dest(dist.html))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
	gulp.src(path.join(projectFolder, './*.ico'))
		.pipe(gulp.dest(dist.html));
};

let watchHandle = function(type, file) {
	let ext = file.match(/.*\.{1}([^.]*)$/)[1];
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
				scriptLib(type === 'add' ? null : reload);
			} else if (file.indexOf('\\js\\') > -1) {
				if (type === 'unlink') {
					let tmp = file.replace(/_src/, 'dist');
					del([tmp], {
						force: true
					}).then(function() {
						console.log(tmp + '已删除');
					});
				} else {
					scriptApp(type === 'add' ? null : reload);
				}
			} else if (type === 'change' && typeof reload === 'function') {
				reload();
			} else {
				console.log('script 未命中:' + file);
			}
			break;
		case 'img':
			if (type === 'unlink') {
				let tmp = file.replace(/_src/, 'dist');
				del([tmp], {
					force: true
				}).then(function() {
					console.log(tmp + '已删除');
				});
			} else {
				images(type === 'add' ? null : reload);
			}
			break;
		case 'css':
			if (type === 'unlink') {
				let tmp = file.replace(/_src/, 'dist');
				del([tmp], {
					force: true
				}).then(function() {
					console.log(tmp + '已删除');
				});
			} else {
				css(type === 'add' ? null : reload);
			}
			break;
		case 'font':
			if (type === 'unlink') {
				let tmp = file.replace(/_src/, 'dist');
				del([tmp], {
					force: true
				}).then(function() {
					console.log(tmp + '已删除');
				});
			} else {
				font(type === 'add' ? null : reload);
			}
			break;
		case 'html':
			if (type === 'unlink') {
				let tmp = file.replace(/_src/, 'dist');
				del([tmp], {
					force: true
				}).then(function() {
					console.log(tmp + '已删除');
				});
			} else {
				html(type === 'add' ? null : reload);
			}
			break;
		default:
			console.log(file + '不在监听范围');
	}
};

const watch = chokidar.watch(['./_component', './_src', './modules'], {
	ignored: /[\/\\]\.|(\.[^\.]*TMP[^\.]*$)/,
	awaitWriteFinish: {
		stabilityThreshold: 300,
		pollInterval: 300
	}
});

const watcher = function() {
	watch.on('all', watchHandle);
};

let serve = function(callback) {
	browserSync.init({
		server: {
			baseDir: './',
			directory: true
		},
		startPath: distFolder + "/index.html",
		reloadDelay: 0,
		port: 3000
	}, function() {
		reload = browserSync.reload;
		console.log('服务已启动...');
		if (typeof(callback) === 'function') {
			callback();
		}
	});
};

let build = function(callback) {
	var got = 0,
		todoList = build.prototype.todoList,
		resolve = function() {
			got++;
			if (got >= todoList.length) {
				got = null;
				resolve = null;
				todoList = null;
				if (typeof(callback) === 'function') {
					callback();
				} else {
					console.log('项目构建完成！');
					process.exit();
				}
			}
		};
	build.prototype.todoList.forEach(function(item, index) {
		item(resolve);
	});
};
build.prototype.todoList = [script, images, font, css, html];

let run = function(callback) {
	var got = 0,
		todoList = run.prototype.todoList,
		resolve = function() {
			got++;
			if (got >= todoList.length && typeof(callback) === 'function') {
				callback();
				got = null;
				resolve = null;
				todoList = null;
			}
		};
	run.prototype.todoList.forEach(function(item, index) {
		item(resolve);
	});
};
run.prototype.todoList = [build, serve];

const init = function() {
	const spinner = ora('正在下载模板');
	spinner.color = 'yellow';
	spinner.start();
	download('tower1229/front-flow-template', '.', function(err) {
		if (err) return console.log(err);
		spinner.text = '项目初始化完成！';
		spinner.succeed();
		process.exit();
	});
};

const program = require('commander');
const pkg = require('../package.json');

program
	.version(pkg.version)
	.usage('flow [command] <option>');

program
	.command('init')
	.description('初始化一个front-flow模板项目')
	.action(function(project) {
		init();
	});

program
	.command('run [dir]')
	.description('运行开发服务')
	.action(function(dir) {
		getPaths(dir);
		run(watcher);
	});

program
	.command('build [dir]')
	.description('编译打包')
	.action(function(dir) {
		getPaths(dir);
		build();
	});

program.parse(process.argv);