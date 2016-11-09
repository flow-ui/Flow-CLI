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
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const changed = require('gulp-changed');
const cache = require('gulp-cached');
const pathObj = require('./paths');
const ora = require('ora');

let spinner = ora('项目构建完成！');

const scriptLib = function(file, callback) {
	gulp.src(pathObj.paths.scriptLib)
		.pipe(changed(pathObj.dist.lib))
		.pipe(gulp.dest(pathObj.dist.lib));
	gulp.src(pathObj.paths.scriptConcat)
		.pipe(cache('scriptConcat'))
		.pipe(concat('sea.js'))
		.pipe(replace('__folder', '/' + pathObj.distFolder))
		.pipe(gulp.dest(pathObj.dist.lib))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

const scriptApp = function(file, callback) {
	gulp.src(pathObj.paths.scriptApp)
		.pipe(changed(pathObj.dist.js))
		.pipe(gulp.dest(pathObj.dist.js))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let script = function(file, callback) {
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
		item(file, resolve);
	});
};
script.prototype.todoList = [scriptLib, scriptApp];

let image = function(file, callback) {
	gulp.src(pathObj.paths.imageALL)
		.pipe(changed(pathObj.distFolder))
		.pipe(imagemin())
		.pipe(gulp.dest(pathObj.distFolder));

	gulp.src(pathObj.paths.image)
		.pipe(changed(pathObj.dist.img))
		.pipe(imagemin())
		.pipe(gulp.dest(pathObj.dist.img))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let font = function(file, callback) {
	del(pathObj.dist.font, {
		force: true
	}).then(function() {
		return gulp.src(pathObj.paths.font)
			.pipe(gulp.dest(pathObj.dist.font))
			.on('end', function() {
				if (typeof(callback) === 'function') {
					callback();
				}
			});
	});
};

let css = function(file, callback) {
	gulp.src(pathObj.paths.cssAll)
		.pipe(cache('cssAll'))
		.pipe(less({
			plugins: [autoprefix],
			compress: true
		}))
		.pipe(replace('__folder', '/' + pathObj.distFolder))
		.pipe(gulp.dest(pathObj.distFolder));

	gulp.src(pathObj.paths.css)
		.pipe(sourcemaps.init())
		.pipe(includer({
			extensions: ['css', 'less'],
			hardFail: true,
			includePaths: [path.join('./_component'), path.join(pathObj.projectFolder, './css'), pathObj.paths.include]
		}))
		.pipe(cache('css'))
		.pipe(less({
			plugins: [autoprefix],
			compress: true
		}))
		.pipe(replace('__folder', '/' + pathObj.distFolder))
		.pipe(sourcemaps.write('./maps'))
		.pipe(gulp.dest(pathObj.dist.css))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let html = function(file, callback) {
	gulp.src(pathObj.paths.html)
		.pipe(changed(pathObj.dist.html))
		.pipe(includer({
			includePaths: [pathObj.paths.include]
		}))
		.pipe(replace('__folder', '/' + pathObj.distFolder))
		.pipe(gulp.dest(pathObj.dist.html))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
	gulp.src(path.join(pathObj.projectFolder, './*.ico'))
		.pipe(gulp.dest(pathObj.dist.html));
};

let build = function(callback) {
	let got = 0,
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
					spinner.succeed();
					process.exit();
				}
			}
		},
		isExist = function() {
			try {
				return fs.statSync(path.join('./', pathObj.projectFolder)).isDirectory();
			} catch (e) {
				if (e.code != 'ENOENT')
					throw e;

				return false;
			}
		};
	
	if (!isExist()) {
		console.log(pathObj.projectFolder + '不存在！');
		return process.exit();
	}
	build.prototype.todoList.forEach(function(item, index) {
		item(pathObj, resolve);
	});
};
build.prototype.todoList = [script, image, font, css, html];

module.exports = {
	build: build,
	script: script,
	scriptLib: scriptLib,
	scriptApp: scriptApp,
	image: image,
	font: font,
	css: css,
	html: html
};