const fs = require('fs');
const path = require('path');
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
const globalConfig = require('./paths')();
const ora = require('ora');
let spinner = ora('正在构建...').start();

const scriptLib = function(file, callback) {

	gulp.src(globalConfig.paths.scriptLib)
		.pipe(changed(globalConfig.dist.lib))
		.pipe(gulp.dest(globalConfig.dist.lib));

	gulp.src(globalConfig.paths.scriptConcat)
		.pipe(cache('scriptConcat'))
		.pipe(concat('sea.js'))
		.pipe(replace('__folder', '/' + globalConfig.distDir))
		.pipe(gulp.dest(globalConfig.dist.lib))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

const scriptApp = function(file, callback) {
	gulp.src(globalConfig.paths.scriptApp)
		.pipe(changed(globalConfig.dist.js))
		.pipe(gulp.dest(globalConfig.dist.js))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let script = function(file, callback) {
	let got = 0,
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
	gulp.src(globalConfig.paths.imageALL)
		.pipe(changed(globalConfig.distDir))
		.pipe(imagemin())
		.pipe(gulp.dest(globalConfig.distDir));

	gulp.src(globalConfig.paths.image)
		.pipe(changed(globalConfig.dist.img))
		.pipe(imagemin())
		.pipe(gulp.dest(globalConfig.dist.img))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let font = function(file, callback) {
	gulp.src(globalConfig.paths.font)
		.pipe(gulp.dest(globalConfig.dist.font))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let css = function(file, callback) {
	gulp.src(globalConfig.paths.cssAll)
		.pipe(includer({
			extensions: ['css', 'less'],
			hardFail: true,
			includePaths: [path.join(globalConfig.projectDir, './css')]
		}))
		.pipe(cache('cssAll'))
		.pipe(less({
			plugins: [autoprefix],
			compress: true
		}))
		.pipe(replace('__folder', '/' + globalConfig.distDir))
		.pipe(gulp.dest(globalConfig.distDir));

	gulp.src(globalConfig.paths.css)
		.pipe(sourcemaps.init())
		.pipe(includer({
			extensions: ['css', 'less'],
			hardFail: true,
			includePaths: [path.join('./_component'), path.join(globalConfig.projectDir, './css'), globalConfig.paths.include]
		}))
		.pipe(cache('css'))
		.pipe(less({
			plugins: [autoprefix],
			compress: true
		}))
		.pipe(replace('__folder', '/' + globalConfig.distDir))
		.pipe(sourcemaps.write('./maps'))
		.pipe(gulp.dest(globalConfig.dist.css))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let html = function(file, callback) {
	gulp.src(path.join(globalConfig.projectDir, './*.ico'))
		.pipe(gulp.dest(globalConfig.dist.html));

	gulp.src(globalConfig.paths.html)
		.pipe(changed(globalConfig.dist.html))
		.pipe(includer({
			includePaths: [globalConfig.paths.include]
		}))
		.pipe(replace('__folder', '/' + globalConfig.distDir))
		.pipe(gulp.dest(globalConfig.dist.html))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
	
};

let build = function(callback) {
	let got = 0,
		todoList = build.prototype.todoList,
		start = process.hrtime(),
		diff,
		resolve = function() {
			got++;
			if (got >= todoList.length) {
				got = null;
				resolve = null;
				todoList = null;
				diff = process.hrtime(start);
				spinner.text = '构建完成, 耗时:' + (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2) + 'ms';
				spinner.succeed();
				if (typeof(callback) === 'function') {
					callback();
				} else {
					process.exit();
				}
			}
		},
		isExist = function(dir) {
			try {
				return fs.statSync(dir).isDirectory();
			} catch (e) {
				if (e.code != 'ENOENT')
					throw e;
				return false;
			}
		};
	if (!isExist(path.join('./', globalConfig.projectDir))) {
		console.log(globalConfig.projectDir + '不存在！');
		return process.exit();
	}

	build.prototype.todoList.forEach(function(item, index) {
		item(globalConfig, resolve);
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