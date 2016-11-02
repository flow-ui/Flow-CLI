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
const getPaths = require('./paths');

const scriptLib = function(pathObj, callback) {
	gulp.src(pathObj.paths.scriptLib)
		.pipe(gulp.dest(pathObj.dist.lib));
	gulp.src(pathObj.paths.scriptConcat)
		.pipe(concat('sea.js'))
		.pipe(replace('__folder', '/' + pathObj.distFolder))
		.pipe(gulp.dest(pathObj.dist.lib))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

const scriptApp = function(pathObj, callback) {
	gulp.src(pathObj.paths.scriptApp)
		.pipe(gulp.dest(pathObj.dist.js))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let script = function(pathObj, callback) {
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
		item(pathObj, resolve);
	});
};
script.prototype.todoList = [scriptLib, scriptApp];

let images = function(pathObj, callback) {
	gulp.src(pathObj.paths.images)
		.pipe(imagemin())
		.pipe(gulp.dest(pathObj.dist.img))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let font = function(pathObj, callback) {
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

let css = function(pathObj, callback) {
	gulp.src(pathObj.paths.css)
		.pipe(includer({
			extensions: ['css', 'less'],
			hardFail: true,
			includePaths: [path.join('./_component'), path.join(pathObj.projectFolder, './css'), path.join(pathObj.projectFolder, './include')]
		}))
		.pipe(less({
			plugins: [autoprefix],
			compress: true
		}))
		.pipe(gulp.dest(pathObj.dist.css))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let html = function(pathObj, callback) {
	gulp.src(pathObj.paths.html)
		.pipe(includer({
			includePaths: [path.join(pathObj.projectFolder, './include')]
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

let build = function(dir, callback) {
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
					console.log('项目构建完成！');
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
		},
		pathObj = getPaths(dir);
	
	if (!isExist()) {
		console.log(pathObj.projectFolder + '不存在！');
		return process.exit();
	}
	build.prototype.todoList.forEach(function(item, index) {
		item(pathObj, resolve);
	});
};
build.prototype.todoList = [script, images, font, css, html];

module.exports = {
	build: build,
	script: script,
	scriptLib: scriptLib,
	scriptApp: scriptApp,
	images: images,
	font: font,
	css: css,
	html: html
};