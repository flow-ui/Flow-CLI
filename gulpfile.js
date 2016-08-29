/*
 * name: gulpfile.js
 * version: v0.1.0
 * update: build
 * date: 2016-8-19
 */

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
const argv = require('yargs').argv;
const extract = require('extract-zip');
const projectFolder = 'src';
const distFolder = 'dist';

const types = {
	script: 'js',
	css: 'css,less',
	img: 'JPG,jpg,png,gif',
	html: 'html',
	font: 'eot,svg,ttf,woff'
};
const paths = {
	scriptConcat: [path.join(__dirname, projectFolder, './lib/seajs/sea.js'), path.join(__dirname, projectFolder, './seajs.config.js'), path.join(__dirname, projectFolder, './lib/seajs/manifest.js'), path.join(__dirname, projectFolder, './lib/seajs/seajs-localcache.js')],
	scriptApp: [path.join(__dirname, projectFolder, './js/*')],
	scriptLib: [path.join(__dirname, projectFolder, './lib/*')],
	images: [path.join(__dirname, projectFolder, './img/**/*.{' + types.img + '}')],
	css: [path.join(__dirname, projectFolder, './css/style.less')],
	cssAll: [path.join(__dirname, projectFolder, './css/**/*.less'), path.join(__dirname, './component/**/*.less'), path.join(__dirname, projectFolder, './include/**/*.less')],
	font: [path.join(__dirname, projectFolder, './font/*')],
	html: path.join(__dirname, projectFolder, './*.html'),
	htmlAll: path.join(__dirname, projectFolder, '**/*.html'),
	include: path.join(__dirname, projectFolder, './include')
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
				includePaths: [path.join(__dirname, './component'), path.join(__dirname, projectFolder, './css'), path.join(__dirname, projectFolder, './include')]
			}))
			.pipe(less())
			.pipe(autoprefixer({
				browsers: ['last 3 versions'],
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
						includePaths: [path.join(__dirname, projectFolder, './include')]
					}))
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

gulp.task('default', ['build', 'serve']);
gulp.task('build', ['script', 'images', 'font', 'css', 'html']);
gulp.task('init', function(){
	extract(path.resolve(path.join(__dirname, './template.zip')), {
		dir: './'
	}, function(err) {
		if (err) {
			throw new Error(err);
		}
	});
	console.log('项目初始化完成！')
});