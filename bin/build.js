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
const uglify = require('gulp-uglify');
const globalConfig = require('./paths')();
const ora = require('ora');
const tap = require('gulp-tap');
const pkg = require('../package.json');
const npmview = require('npmview');
const repl = require('repl');
let spinner = ora();

const isExist = function(dir) {
	try {
		return fs.statSync(dir).isDirectory() || fs.statSync(dir).isFile();
	} catch (e) {
		if (e.code != 'ENOENT')
			throw e;
		return false;
	}
};
const isContain = function(arr, str) {
	let i = arr.length;
	while (i--) {
		if (arr[i] === str) {
			return true;
		}
	}
	return false;
};
const insertBeforeStr = function(fileContents, search, str) {
	let index, start, end;
	index = fileContents.indexOf(search);
	if (index > -1) {
		start = fileContents.substr(0, index);
		end = fileContents.substr(index);
		return start + str + end;
	} else {
		return fileContents;
	}
};
//全局组件缓存
let widgets = {};
let getWidget = function(widgetName, type, page, isPath) {
	let includePath = path.join(globalConfig.paths.include, widgetName);
	let result;
	let sourcePath;
	if (isPath) {
		includePath = path.join(globalConfig.projectDir, widgetName);
	} else {
		includePath = path.join(globalConfig.paths.include, widgetName);
	}
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
				if (!isContain(widgets[widgetName].alise, page)) {
					widgets[widgetName].alise.push(page);
				}
			} else {
				result = fs.readFileSync(sourcePath).toString().trim();
				widgets[widgetName][type] = result;
			}
		} else {
			result = fs.readFileSync(sourcePath).toString().trim();
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

const isIncludeReg = /include\\([^\\]+)\\|include\\([^\\\.]+)\..+/;

const scriptLib = function(filePath, callback) {
	gulp.src(globalConfig.paths.scriptLib)
		.pipe(changed(globalConfig.dist.lib))
		.pipe(uglify())
		.pipe(gulp.dest(globalConfig.dist.lib));

	gulp.src(globalConfig.paths.scriptConcat)
		.pipe(concat('sea.js'))
		.pipe(replace(globalConfig.distHolder, globalConfig.distDir))
		.pipe(uglify())
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
		.pipe(replace(globalConfig.distHolder, globalConfig.distDir))
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
		var widgetMatch = filePath.match(isIncludeReg);
		if (widgetMatch) {
			if (widgets[widgetMatch[1]]) {
				//更新对应页面
				getWidget(widgetMatch[1], 'script', true);
				return html(widgets[widgetMatch[1]].alise, callback);
			}
		} else if (filePath.indexOf(path.normalize('modules/')) > -1) {
			return console.log('\n请打开 ' +
				gutil.colors.cyan(globalConfig.projectDir + '/lib/seajs/manifest.js') +
				' 更新对应模块');
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
		var widgetMatch = filePath.match(isIncludeReg);
		if (Array.isArray(widgetMatch)) {
			if (widgets[widgetMatch[1]]) {
				getWidget(widgetMatch[1], 'style', true);
				mainTarget = globalConfig.paths.cssMain;
				//更新css缓存
				needRefresh = true;
			}
		} else if (filePath.indexOf(path.normalize(path.join(globalConfig.projectDir, '/css/'))) > -1 || filePath.indexOf(path.normalize('_component/')) > -1) {
			//匹配 css
			mainTarget = globalConfig.paths.cssMain;
		} else {
			//其他
			otherTarget = filePath;
		}
	} else {
		mainTarget = globalConfig.paths.cssMain;
		otherTarget = globalConfig.paths.cssOther;
	}

	if (otherTarget) {
		let destTarget = globalConfig.distDir;
		if (otherTarget.split) {
			let getpathreg = new RegExp(globalConfig.projectDir + '\\\\([^\\\\]+)\\\\.+\\.[^\\.]+');
			let destmatch = otherTarget.match(getpathreg);
			if (Array.isArray(destmatch)) {
				destTarget = path.join(destTarget, '/' + destmatch[1]);
			}
		}
		gulp.src(otherTarget)
			.pipe(replace(globalConfig.projectHolder, globalConfig.projectDir))
			.pipe(less({
				plugins: [autoprefix],
				compress: true
			}))
			.pipe(replace(globalConfig.distHolder, globalConfig.distDir))
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
			.pipe(replace(globalConfig.projectHolder, globalConfig.projectDir))
			.pipe(less({
				plugins: [autoprefix],
				compress: true
			}))
			.pipe(replace(globalConfig.distHolder, globalConfig.distDir))
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
			var widgetMatch = filePath.match(isIncludeReg);
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
			//页面级组件缓存
			let pageWidget = {};
			let getPageWidget = function(name, type, refresh, isPath) {
				let result;
				if (refresh) {
					result = getWidget(name, type, true, isPath);
				} else if (pageWidget[name] && pageWidget[name][type]) {
					result = pageWidget[name][type];
				} else {
					result = getWidget(name, type, file.path, isPath);
					if (pageWidget[name]) {
						pageWidget[name][type] = result;
					} else {
						pageWidget[name] = {};
						pageWidget[name][type] = result;
					}
				}
				return result;
			};
			if (Array.isArray(matches)) {
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
					} else if (includeCommand[0] === 'include') {
						let widgetHTML = getPageWidget(includeName, 'temp', false, true);
						content = content.replace(matchStr, widgetHTML);
					}
				}
			}
			//清理 widgets
			for (let x in widgets) {
				if (widgets.hasOwnProperty(x)) {
					if (isContain(widgets[x].alise, file.path) && !pageWidget[x]) {
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
			//内联script
			let scriptWrap = '<script>';
			for (let x in pageWidget) {
				if (pageWidget.hasOwnProperty(x)) {
					if (pageWidget[x].script) {
						scriptWrap += `
define("${x}-script-inline",function(require) {
	${pageWidget[x].script}
});
seajs.use("${x}-script-inline");
`;
					}
				}
			}
			if (scriptWrap !== '<script>') {
				scriptWrap += '</script>';
				content += scriptWrap;
			}
			file.contents = Buffer.from(content);
			return file;
		}))
		.pipe(replace(globalConfig.distHolder, globalConfig.distDir))
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
		},
		startBuild = function(){
			spinner.text = '正在构建...';
			spinner.start();
			build.prototype.todoList.forEach(function(item, index) {
				item(null, resolve);
			});
		};
	if (!isExist(path.join('./', globalConfig.projectDir))) {
		console.log(globalConfig.projectDir + '不存在！');
		return process.exit();
	}
	if(!globalConfig.checkUpdate){
		return startBuild();	
	}
	npmview(pkg.name, function(err, version, moduleInfo) {
		let newV = version.split('.'),
			nowV = pkg.version.split('.'),
			hasUp;
		if (err) {
			console.error(err);
			return startBuild();
		}
		newV.forEach(function(e, i) {
			if (e > nowV[i]) {
				hasUp = true;
				return false;
			}
		});
		if (hasUp) {
			let myEval = function (cmd, context, filename, callback) {
				r.close();
				if (cmd && (cmd.toUpperCase().trim() === 'Y')) {
					startBuild();
				} else {
					process.exit();
				}
			}
			let r = repl.start({
				prompt: '> 发现新版本' + gutil.colors.magenta(version) + ',继续编译?(Y/N)',
				eval: myEval
			});
		} else {
			startBuild();
		}
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