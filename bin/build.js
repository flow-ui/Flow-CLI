const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const gutil = require('gulp-util');
const replace = require('gulp-replace');
const imagemin = require('gulp-imagemin');
const less = require('gulp-less');
const LessAutoprefix = require('less-plugin-autoprefix');
const autoprefix = new LessAutoprefix();
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const changed = require('gulp-changed');
const globalConfig = require('./paths')();
const ora = require('ora');
const tap = require('gulp-tap');
const isExist = function(dir) {
	try {
		return fs.statSync(dir).isDirectory() || fs.statSync(dir).isFile();
	} catch (e) {
		if (e.code != 'ENOENT')
			throw e;
		return false;
	}
};
const contains = function(arr, str) {
	let i = arr.length;
	while (i--) {
		if (arr[i] === str) {
			return true;
		}
	}
	return false;
};
let spinner = ora('正在构建...').start();
let widgets = {};
let getWidget = function(widgetName, type, page) {
	let includePath = path.join(globalConfig.paths.include, widgetName);
	let result;
	let sourcePath;

	if (!(/\.html$/).test(widgetName)) {
		switch (type) {
			case "temp":
				sourcePath = path.join(includePath, '/temp.html');
				break;
			case "style":
				sourcePath = path.join(includePath, '/style.less');
				break;
			case "script":
				sourcePath = path.join(includePath, '/script.js');
				break;
			case "alise":
				sourcePath = widgetName + 'alise';
				break;
			default:
				return console.log('getWidget @type 变量异常!');
		}
	} else {
		sourcePath = includePath;
		type = 'temp';
	}
	if (sourcePath === (widgetName + 'alise')) {
		result = widgets[widgetName] ? widgets[widgetName].alise.length : 0;
	} else if (isExist(sourcePath)) {
		if (widgets[widgetName]) {
			if (page.split && widgets[widgetName][type]) {
				result = widgets[widgetName][type];
				if (!contains(widgets[widgetName].alise, page)) {
					widgets[widgetName].alise.push(page);
				}
			} else {
				result = fs.readFileSync(sourcePath).toString();
				widgets[widgetName][type] = result;
			}
		} else {
			result = fs.readFileSync(sourcePath).toString();
			widgets[widgetName] = {
				alise: [page]
			};
			widgets[widgetName][type] = result;
		}
	} else {
		//console.log(sourcePath+'不存在')
	}
	return result;
};

const scriptLib = function(filePath, callback) {

	gulp.src(globalConfig.paths.scriptLib)
		.pipe(changed(globalConfig.dist.lib))
		.pipe(gulp.dest(globalConfig.dist.lib));

	gulp.src(globalConfig.paths.scriptConcat)
		.pipe(concat('sea.js'))
		.pipe(replace('__folder', '/' + globalConfig.distDir))
		.pipe(gulp.dest(globalConfig.dist.lib))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

const scriptApp = function(filePath, callback) {
	gulp.src(globalConfig.paths.scriptApp)
		.pipe(changed(globalConfig.dist.js))
		.pipe(gulp.dest(globalConfig.dist.js))
		.on('end', function() {
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let script = function(filePath, callback) {
	let got = 0,
		todoList = script.prototype.todoList,
		resolve = function() {
			got++;
			if (got >= todoList.length) {
				got = null;
				resolve = null;
				todoList = null;
				delete script.prototype.todoList;
				if (typeof(callback) === 'function') {
					callback();
				}
			}
		};
	if (filePath && filePath.split) {
		var widgetMatch = filePath.match(/include\\([^\\]+)\\script.js/);
		if (widgetMatch) {
			if (widgets[widgetMatch[1]]) {
				//更新对应页面
				getWidget(widgetMatch[1], 'script', true);
				return html(widgets[widgetMatch[1]].alise, callback);
			}
		}
	}

	script.prototype.todoList.forEach(function(item, index) {
		item(filePath, resolve);
	});
};
script.prototype.todoList = [scriptLib, scriptApp];

let image = function(filePath, callback) {
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

let css = function(filePath, callback) {
	let importList = [];
	let needRefresh;
	let mainTarget;
	let otherTarget;
	for (let x in widgets) {
		if (widgets.hasOwnProperty(x)) {
			if (widgets[x].style) {
				importList.push(path.join(globalConfig.paths.include, x, '/style.less'));
			}
		}
	}
	if (filePath && filePath.split) {
		var widgetMatch = filePath.match(/include\\([^\\]+)\\style.less/);
		if (widgetMatch) {
			if (widgets[widgetMatch[1]]) {
				getWidget(widgetMatch[1], 'style', true);
				if (widgets[widgetMatch[1]].alise.length > 1) {
					mainTarget = globalConfig.paths.css;
					//更新css缓存
					needRefresh = true;
				} else {
					//更新对应页面
					return html(widgets[widgetMatch[1]].alise, callback);
				}
			}
		} else if (filePath.indexOf(path.normalize(path.join(globalConfig.projectDir,'/css/')))>-1) {
			//匹配 css
			mainTarget = globalConfig.paths.css;
		} else {
			//其他
			otherTarget = filePath;
		}
	} else {
		mainTarget = globalConfig.paths.css;
		otherTarget = globalConfig.paths.cssAll;
	}
	if (otherTarget) {
		let destTarget = globalConfig.distDir;
		if(otherTarget.split){
			let destmatch = otherTarget.match(/_src\\([^\\]+)\\style.less/);
			destTarget = path.join(destTarget,'/'+destmatch[1]);
		}
		gulp.src(otherTarget)
			.pipe(less({
				plugins: [autoprefix],
				compress: true
			}))
			.pipe(replace('__folder', '/' + globalConfig.distDir))
			.pipe(gulp.dest(destTarget));
	}
	if (mainTarget) {
		gulp.src(mainTarget)
			.pipe(tap(function(file) {
				let content = file.contents.toString();
				let importHTML = '';
				if (importList.length) {
					importList.forEach(function(path) {
						importHTML += ('@import "' + path + '";\n');
					});
					content += importHTML;
				}
				if (needRefresh) {
					content += ('\n/* refresh:' + new Date() + ' */');
				}
				file.contents = Buffer.from(content);
				return file;
			}))
			.pipe(sourcemaps.init())
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
	}
};

let html = function(filePath, callback) {
	let compileTarget;
	if (filePath) {
		if (filePath.split) {
			var widgetMatch = filePath.match(/include\\([^\\]+)\\temp.html|include\\([^\\\.]+\.html)/);
			if (widgetMatch) {
				//1.include
				if (widgets[widgetMatch[1]]) {
					//更新组件缓存
					getWidget(widgetMatch[1], 'temp', true);
					compileTarget = widgets[widgetMatch[1]].alise;
				} else if (widgets[widgetMatch[2]]) {
					//更新链接缓存
					getWidget(widgetMatch[2], 'temp', true);
					compileTarget = widgets[widgetMatch[2]].alise;
				}
			} else {
				//2.page
				compileTarget = filePath;
			}
		} else if (Array.isArray(filePath)) {
			//3.alise
			compileTarget = filePath;
		}
	} else {
		//4.initial
		compileTarget = globalConfig.paths.html;
		gulp.src(path.join(globalConfig.projectDir, './*.ico'))
			.pipe(gulp.dest(globalConfig.dist.html));
	}

	gulp.src(compileTarget)
		.pipe(tap(function(file) {
			let content = file.contents.toString();
			let matches = content.match(/^(\s+)?(\/\/|\/\*|\#|\<\!\-\-)(\s+)?=(\s+)?(include|require)(.+$)/mg);
			let pageWidget = {};
			let getPageWidget = function(name, type, refresh) {
				let result;
				if (refresh) {
					result = getWidget(name, type, true);
				} else if (pageWidget[name] && pageWidget[name][type]) {
					result = pageWidget[name][type];
				} else {
					result = getWidget(name, type, file.path);
					if (pageWidget[name]) {
						pageWidget[name][type] = result;
					} else {
						pageWidget[name] = {};
						pageWidget[name][type] = result;
					}
				}
				return result;
			};

			for (let i = 0, l = matches.length; i < l; i++) {
				let matchStr = matches[i].trim();
				let includeCommand = matchStr
					.replace(/(\/\/|\/\*|\#|<!--)(\s+)?=(\s+)?/g, "")
					.replace(/(\*\/|-->)$/g, "")
					.replace(/['"]/g, "")
					.split(' ');
				let includeName = includeCommand[1];
				if (includeCommand[0] === 'require') {
					let widgetHTML = getPageWidget(includeName, 'temp');
					content = content.replace(matchStr, widgetHTML);
					if (!(/\.html$/).test(includeName)) {
						getPageWidget(includeName, 'style');
						getPageWidget(includeName, 'script');
					}
				}
			}
			//清理 widgets
			for (let x in widgets) {
				if (widgets.hasOwnProperty(x)) {
					if (contains(widgets[x].alise, file.path) && !pageWidget[x]) {
						let _ = widgets[x].alise;
						widgets[x].alise.forEach(function(page, i) {
							if (page === file.path) {
								_.splice(i, 1);
								return null;
							}
						});
						widgets[x].alise = _;
					}
				}
			}

			//插入script
			var scriptWrap = '<script>';
			for (let x in pageWidget) {
				if (pageWidget.hasOwnProperty(x)) {
					if (pageWidget[x].script) {
						scriptWrap += `
define("${x}-script-inline",function(require) {
	${pageWidget[x].script}
});
seajs.use("${x}-script-inline");
`
					}
				}
			}
			scriptWrap += '</script>';
			content += scriptWrap;
			file.contents = Buffer.from(content);
			return file;
		}))
		.pipe(replace('__folder', '/' + globalConfig.distDir))
		.pipe(gulp.dest(globalConfig.dist.html))
		.on('end', function() {
			if (!filePath) {
				//初次编译，调起css
				css();
			}
			if (typeof(callback) === 'function') {
				callback();
			}
		});
};

let build = function(callback) {
	let got = 0,
		start = process.hrtime(),
		diff,
		todoList = build.prototype.todoList,
		resolve = function() {
			got++;
			if (got >= todoList.length) {
				got = null;
				resolve = null;
				todoList = null;
				delete build.prototype.todoList;
				diff = process.hrtime(start);
				spinner.text = '构建完成, 耗时:' + (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2) + 'ms';
				spinner.succeed();
				if (typeof(callback) === 'function') {
					callback();
				} else {
					process.exit();
				}
			}
		};
	if (!isExist(path.join('./', globalConfig.projectDir))) {
		console.log(globalConfig.projectDir + '不存在！');
		return process.exit();
	}

	build.prototype.todoList.forEach(function(item, index) {
		item(null, resolve);
	});
};
build.prototype.todoList = [script, image, font, html];

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