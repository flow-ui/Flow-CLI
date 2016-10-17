#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const del = require('del');
const replace = require('gulp-replace');
const includer = require('gulp-include');
const imagemin = require('gulp-imagemin');
const less = require('gulp-less');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const download = require('download-git-repo');
const ora = require('ora');

const projectFolder = './_src';
const distFolder = './dist';

const types = {
	script: 'js',
	css: 'css,less',
	img: 'JPG,jpg,png,gif',
	html: 'html',
	font: 'eot,svg,ttf,woff'
};
const paths = {
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
const dist = {
	lib: distFolder + '/lib',
	js: distFolder + '/js',
	css: distFolder + '/css',
	font: distFolder + '/font',
	img: distFolder + '/img',
	html: distFolder + ''
};

let reload;

const scriptLibHandle = function() {
	del(dist.lib, {
		force: true
	}).then(function() {
		gulp.src(paths.scriptLib)
			.pipe(gulp.dest(dist.lib));
		return gulp.src(paths.scriptConcat)
			.pipe(concat('sea.js'))
			.pipe(replace('__folder', '/' + distFolder))
			.pipe(gulp.dest(dist.lib))
			.on('end', function() {
				reload && reload()
			});
	});
};
gulp.task('scriptLib', scriptLibHandle);

const scriptAppHandle = function() {
	del(dist.js, {
		force: true
	}).then(function() {
		return gulp.src(paths.scriptApp)
			.pipe(gulp.dest(dist.js))
			.on('end', function() {
				reload && reload()
			});
	});
};
gulp.task('scriptApp', scriptAppHandle);

gulp.task('script', ['scriptLib', 'scriptApp']);

const imageHandle = function() {
	return gulp.src(paths.images)
		.pipe(imagemin())
		.pipe(gulp.dest(dist.img));
};
gulp.task('images', imageHandle);

const fontHandle = function() {
	del(dist.font, {
		force: true
	}).then(function() {
		return gulp.src(paths.font)
			.pipe(gulp.dest(dist.font));
	})
};
gulp.task('font', fontHandle);

const cssHandle = function() {
	del(dist.css, {
		force: true
	}).then(function() {
		return gulp.src(paths.css)
			.pipe(includer({
				extensions: ['css', 'less'],
				hardFail: true,
				includePaths: [path.join('./_component'), path.join(projectFolder, './css'), path.join(projectFolder, './include')]
			}))
			.pipe(less())
			.pipe(autoprefixer({
				browsers: ['last 2 versions'],
				cascade: false
			}))
			.pipe(gulp.dest(dist.css))
			.on('end', function() {
				reload && reload()
			});
	});
};
gulp.task('css', cssHandle);

const htmlHandle = function() {
	del(dist.html + '/*.html', {
		force: true
	}).then(function() {
		return gulp.src(paths.include + '/link/*.html')
			.pipe(replace('__folder', '/' + distFolder))
			.pipe(gulp.dest(projectFolder + '/include'))
			.on('end', function() {
				gulp.src(paths.html)
					.pipe(includer({
						includePaths: [path.join(projectFolder, './include')]
					}))
					.pipe(replace('__folder', '/' + distFolder))
					.pipe(gulp.dest(dist.html))
					.on('end', function() {
						del(paths.include + '/*.html');
						reload && reload()
					});
			})
	});
};
gulp.task('html', htmlHandle);

gulp.task('watch', function() {
	let watcher = gulp.watch(projectFolder + '/**/*');
	watcher.on('change', function(event) {
		let ext = event.path.match(/.*\.{1}([^.]*)$/)[1];
		for (let key in types) {
			if (types.hasOwnProperty(key)) {
				if (types[key].indexOf(ext) > -1) {
					ext = key;
					break;
				}
			}
		};
		switch (ext) {
			case 'script':
				if (event.path.indexOf('\\lib\\') > -1) {
					scriptLibHandle()
				} else if (event.path.indexOf('\\js\\') > -1) {
					scriptAppHandle()
				} else {
					console.log('script 未命中:' + event.path)
				};
				break;
			case 'img':
				imageHandle()
				break;
			case 'css':
				cssHandle()
				break;
			case 'font':
				fontHandle()
				break;
			case 'html':
				htmlHandle()
				break;
		}
	});
});

gulp.task('serve', ['watch'], function() {
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
	});
});

gulp.task('default', ['build', 'serve'], function() {
	console.log('服务已启动...')
});
gulp.task('build', ['script', 'images', 'font', 'css', 'html'], function() {
	console.log('项目构建完成！')
});
gulp.task('init', function() {
	var DOWNLOAD_DIR = path.join(__dirname, './template.zip');
	var spinner = ora('downloading template')
  	spinner.start()
	download('tower1229/front-flow-template', './', function(err) {
		if (err) return console.log(err);
		spinner.stop();
		console.log('项目初始化完成！')
	});

});

const command = process.argv.slice(2)[0];
switch (command) {
	case 'run':
		gulp.run('default');
		break;
	case 'init':
		gulp.run('init');
		break;
	case 'build':
		gulp.run('build');
		break;
	default:
		console.log(`
命令"${command}"有误，请检查输入:
flow run --运行开发监听服务
flow init --初始化一个frontend框架项目
flow build --编译打包
			`)
		break;
};