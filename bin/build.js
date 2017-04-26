const os = require('os');
const fs = require('fs');
let path = require('path');

const repl = require('repl');
const ora = require('ora');
const npmview = require('npmview');
const gulp = require('gulp');
const gutil = require('gulp-util');
const plumber = require('gulp-plumber');
const replace = require('gulp-replace');
const imagemin = require('gulp-imagemin');
const less = require('gulp-less');
const LessAutoprefix = require('less-plugin-autoprefix');
const autoprefix = new LessAutoprefix();
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const changed = require('gulp-changed');
const uglify = require('gulp-uglify');
const tap = require('gulp-tap');
const filter = require('gulp-filter');

const util = require('./util');
const globalConfig = require('./paths')(process.configName);
const pkg = require('../package.json');
const isAbsolute = path.isAbsolute;
if (os.type() === 'Windows_NT') {
	path = path.win32.posix;
}

let distHolderFinal = path.format({
	dir: globalConfig.serverRoot,
	base: globalConfig.distDir
});

let spinner = ora();
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
				sourcePath = path.join(includePath, 'temp.html');
				break;
			case "style":
				sourcePath = path.join(includePath, 'style.less');
				break;
			case "script":
				sourcePath = path.join(includePath, 'script.js');
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
	} else if (util.isExist(sourcePath)) {
		if (widgets[widgetName]) {
			if (page.split && widgets[widgetName][type]) {
				result = widgets[widgetName][type];
				if (!util.isContain(widgets[widgetName].alise, page)) {
					widgets[widgetName].alise.push(page);
				}
			} else {
				result = util.readFileSync(sourcePath);
				widgets[widgetName][type] = result;
			}
		} else {
			result = util.readFileSync(sourcePath);
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
//全局打包缓存
let packages = {};

const isIncludeReg = /include\\([^\\]+)\\|include\\([^\\\.]+\..+)/;
const uglifySet = {
	output: {
		quote_keys: true
	}
};
//脚本合并
const scriptsConcat = function(option) {
	// {
	// 	src:
	// 	name:
	// 	dest:
	// 	mapsrc:
	// 	beforeConcat:
	// 	callback
	// }
	if (!option || !option.src || !option.name || !option.name.split || !option.dest || !option.dest.split) {
		return console.log('scriptsConcat()参数错误！');
	}
	if (!option.mapsrc) {
		option.mapsrc = './';
	}
	gulp.src(option.src)
		.pipe(plumber())
		.pipe(tap(function(file) {
			if (file.contents) {
				let content = file.contents.toString();
				let result;
				if (typeof(option.beforeConcat) === 'function') {
					result = option.beforeConcat(file);
				}
				if (result && result.split) {
					content = result;
				}
				file.contents = Buffer.from(content);
			}
			return file;
		}))
		.pipe(globalConfig.compress ? sourcemaps.init() : gutil.noop())
		.pipe(concat(option.name))
		.pipe(replace(globalConfig.rootHolder, globalConfig.serverRoot))
		.pipe(replace(globalConfig.projectHolder, globalConfig.projectDir))
		.pipe(replace(globalConfig.distHolder, distHolderFinal))
		.pipe(globalConfig.compress ? uglify(uglifySet) : gutil.noop())
		.pipe(globalConfig.compress ? sourcemaps.write(option.mapsrc) : gutil.noop())
		.pipe(gulp.dest(option.dest))
		.on('end', function() {
			if (typeof(option.callback) === 'function') {
				option.callback();
			}
		})
		.on('error', function() {
			console.log('scriptsConcat()内部错误！');
		});
};
const scriptsNormalOut = function(option) {
	// {
	// 	src:
	// 	dest:
	// 	mapsrc:
	//  compress:
	// 	callback
	// }
	if (!option || !option.src || !option.dest.split) {
		return console.log('scriptsNormalOut()参数错误！');
	}
	if (!option.mapsrc) {
		option.mapsrc = './';
	}
	gulp.src(option.src)
		.pipe(plumber())
		.pipe(changed(option.dest))
		.pipe(option.compress && globalConfig.compress ? sourcemaps.init() : gutil.noop())
		.pipe(replace(globalConfig.rootHolder, globalConfig.serverRoot))
		.pipe(replace(globalConfig.projectHolder, globalConfig.projectDir))
		.pipe(replace(globalConfig.distHolder, distHolderFinal))
		.pipe(option.compress && globalConfig.compress ? uglify(uglifySet) : gutil.noop())
		.pipe(option.compress && globalConfig.compress ? sourcemaps.write(option.mapsrc) : gutil.noop())
		.pipe(gulp.dest(option.dest))
		.on('end', function() {
			if (typeof(option.callback) === 'function') {
				option.callback();
			}
		})
		.on('error', function() {
			console.log('scriptsNormalOut()内部错误！');
		});
};
const cssNormalOut = function(option) {
	// {
	// 	src:
	// 	dest:
	// 	mapsrc:
	//  before:
	//  compress:
	// 	callback
	// }
	if (!option || !option.src || !option.dest || !option.dest.split) {
		return console.log('cssNormalOut()参数错误！');
	}
	if (!option.mapsrc) {
		option.mapsrc = './';
	}
	if (!Array.isArray(option.src)) {
		option.src = [option.src];
	}
	const needCompile = filter(option.src.concat(['!**/*.css']), {
		restore: true
	});
	gulp.src(option.src)
		.pipe(plumber())
		.pipe(tap(function(file) {
			let content = file.contents.toString();
			let result;
			if (typeof(option.before) === 'function') {
				result = option.before(file);
			}
			if (result && result.split) {
				content = result;
			}
			file.contents = Buffer.from(content);
			return file;
		}))
		.pipe(globalConfig.compress ? sourcemaps.init() : gutil.noop())
		.pipe(replace(globalConfig.rootHolder, globalConfig.serverRoot))
		.pipe(replace(globalConfig.projectHolder, globalConfig.projectDir))
		.pipe(needCompile)
		.pipe(less({
			plugins: [autoprefix],
			compress: globalConfig.compress
		}))
		.pipe(needCompile.restore)
		.pipe(replace(globalConfig.distHolder, distHolderFinal))
		.pipe(globalConfig.compress ? sourcemaps.write(option.mapsrc) : gutil.noop())
		.pipe(gulp.dest(option.dest))
		.on('end', function() {
			if (typeof(option.callback) === 'function') {
				option.callback();
			}
		})
		.on('error', function() {
			console.log('cssNormalOut()内部错误！');
		});
};

const imageMin = function(option) {
	// {
	// 	src:
	// 	dest:
	// 	callback
	// }
	if (!option || !option.src || !option.dest || !option.dest.split) {
		return console.log('imageMin()参数错误！');
	}
	gulp.src(option.src)
		.pipe(changed(option.dest))
		.pipe(imagemin())
		.pipe(gulp.dest(option.dest))
		.on('end', function() {
			if (typeof(option.callback) === 'function') {
				option.callback();
			}
		});
};

const scriptLib = function(filePath, callback) {
	if (!globalConfig.compress) {
		scriptsNormalOut({
			src: path.join(globalConfig.projectDir, 'seajs.config.js'),
			dest: globalConfig.distDir
		});
	}

	scriptsNormalOut({
		src: globalConfig.paths.scriptLib,
		dest: globalConfig.dist.lib
	});

	scriptsConcat({
		src: globalConfig.paths.scriptConcat,
		name: 'sea.js',
		dest: globalConfig.dist.lib,
		mapsrc: './',
		callback: callback
	});

};

const scriptApp = function(filePath, callback) {
	scriptsNormalOut({
		src: globalConfig.paths.scriptApp,
		dest: globalConfig.dist.js,
		compress: false,
		callback: callback
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
	spinner.text = '正在构建script';
	spinner.render();
	//运行中监听
	if (filePath && filePath.split) {
		var widgetMatch = filePath.match(isIncludeReg);
		if (widgetMatch) {
			if (widgets[widgetMatch[1]]) {
				//更新对应页面
				getWidget(widgetMatch[1], 'script', true);
				return html(widgets[widgetMatch[1]].alise, callback);
			}
		} else {
			if (filePath.indexOf(globalConfig.projectDir + '\\lib\\') === 0 || filePath.indexOf('seajs.config') > -1) {
				scriptLib(filePath, callback);
			} else if (filePath.indexOf(globalConfig.projectDir + '\\js\\') === 0) {
				scriptApp(filePath, callback);
			}
		}
	} else {
		//初始编译
		script.prototype.todoList.forEach(function(item, index) {
			item(filePath, resolve);
		});
	}
};
script.prototype.todoList = [scriptLib, scriptApp];

let image = function(filePath, callback) {
	spinner.text = '正在构建image';
	spinner.render();
	let destPath = globalConfig.dist.img;
	if (!filePath) {
		filePath = globalConfig.paths.imageAll;
		destPath = globalConfig.dist.base;
	}
	imageMin({
		src: filePath,
		dest: destPath,
		callback: callback
	});
};

let font = function(file, callback) {
	spinner.text = '正在构建font';
	spinner.render();
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
	spinner.text = '正在构建css';
	spinner.render();
	for (let x in widgets) {
		if (widgets.hasOwnProperty(x)) {
			if (widgets[x].style) {
				importList.push(path.join(globalConfig.paths.include, x, 'style.less'));
			}
		}
	}
	if (filePath && filePath.split) {
		let widgetMatch = filePath.match(isIncludeReg);
		let Path4OS = filePath.replace(/\\/g, path.sep);
		globalConfig.paths.cssMain.forEach(function(e) {
			if (Path4OS.indexOf(path.normalize(e)) > -1) {
				mainTarget = true;
			}
		});
		if (Array.isArray(widgetMatch)) {
			//include/
			if (widgets[widgetMatch[1]]) {
				getWidget(widgetMatch[1], 'style', true);
				mainTarget = true;
				//更新css缓存
				needRefresh = true;
			}
		} else {
			//其他
			otherTarget = filePath;
		}
	} else {
		mainTarget = true;
		otherTarget = globalConfig.paths.cssOther;
	}
	if (otherTarget) {
		let destTarget = globalConfig.distDir;
		if (otherTarget.split) {
			let getpathreg = new RegExp(globalConfig.projectDir + '\\\\([^\\\\]+)\\\\.+\\.[^\\.]+');
			let destmatch = otherTarget.match(getpathreg);
			if (Array.isArray(destmatch)) {
				destTarget = path.join(destTarget, destmatch[1]);
			}

		}
		cssNormalOut({
			src: otherTarget,
			dest: destTarget,
			mapsrc: './'
		});
	}
	if (mainTarget) {
		cssNormalOut({
			src: globalConfig.paths.cssMainTarget,
			dest: globalConfig.dist.css,
			before: function(file) {
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
				return content;
			},
			callback: callback
		});
	}
};

let html = function(filePath, callback) {
	let compileTarget;
	spinner.text = '正在构建html';
	spinner.render();
	if (filePath) {
		if (filePath.split) {
			var widgetMatch = filePath.match(isIncludeReg);
			if (widgetMatch) {
				//1.include
				if (widgetMatch[1] && widgets[widgetMatch[1]]) {
					//更新组件缓存
					getWidget(widgetMatch[1], 'temp', true);
					compileTarget = widgets[widgetMatch[1]].alise;
				} else if (widgetMatch[2] && widgets[widgetMatch[2]]) {
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
	if (!compileTarget) {
		//新增include模板
		return null;
	}

	gulp.src(compileTarget)
		.pipe(tap(function(file) {
			//uuid组件缓存
			let uuidCollection = {};
			let content = file.contents.toString();
			let matches = content.match(/^(\s+)?(\/\/|\/\*|\#|\<\!\-\-)(\s+)?=(\s+)?(include|require)(.+$)/mg);
			//页面级组件缓存
			let pageWidget = {};
			let getPageWidget = function(name, type, refresh, isPath, uuid) {
				let result;
				if (refresh) {
					result = getWidget(name, type, true, isPath);
				} else if (pageWidget[name] && pageWidget[name][type]) {
					result = pageWidget[name][type];
				} else {
					result = getWidget(name, type, file.path, isPath);
					if (uuid && uuid.split) {
						if (!uuidCollection[type]) {
							uuidCollection[type] = {};
						}
						uuidCollection[type][uuid] = result.replace(globalConfig.UUIDHolder, uuid);
					} else if (pageWidget[name]) {
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
						.split(' ');
					let includeName = includeCommand[1];
					let widgetData = includeCommand[2];
					let widgetUUID;
					if (includeCommand[0] === 'require') {
						//加载组件
						let uuid;
						let widgetHTML = getPageWidget(includeName, 'temp');
						//使用_.template编译模板
						if (widgetData && widgetData.trim()) {
							let _tempdata;
							try {
								_tempdata = JSON.parse(widgetData);
							} catch (e) {
								return console.log("[" + includeName + "]组件的模板数据解析错误，或者引用语句没有在html中独占一行");
							}
							_tempdata.file = file; //不知道为什么gulp-util要求_.template数据必须含有file对象
							try {
								widgetHTML = gutil.template(widgetHTML, _tempdata);
							} catch (e) {
								console.log('\n> 组件[' + gutil.colors.red(includeName) + ']编译出错，请检查模板数据，详情参考_.template文档');
							}
						}
						content = content.replace(matchStr, widgetHTML);
						if (widgetHTML && widgetHTML.indexOf(globalConfig.UUIDHolder) > -1) {
							widgetUUID = util.getUUID();
							content = content.replace(globalConfig.UUIDHolder, widgetUUID);
						}
						if (!(/\.html$/).test(includeName)) {
							getPageWidget(includeName, 'style', false, false, widgetUUID);
							getPageWidget(includeName, 'script', false, false, widgetUUID);
						}
					} else if (includeCommand[0] === 'include') {
						//include 文件
						let widgetHTML = getPageWidget(includeName, 'temp', false, true);
						content = content.replace(matchStr, widgetHTML);
					}
				}
			}
			//清理 widgets
			for (let x in widgets) {
				if (widgets.hasOwnProperty(x)) {
					if (util.isContain(widgets[x].alise, file.path) && !pageWidget[x]) {
						let _ = widgets[x].alise;
						widgets[x].alise.forEach(function(page, i) {
							if (page === file.path) {
								_.splice(i, 1);
								console.log('清理' + x);
								return null;
							}
						});
						widgets[x].alise = _;
					}
				}
			}
			//组件script合并
			let pageWidgetNames = [];
			let pageWidgetArray = [];
			for (let x in pageWidget) {
				if (pageWidget.hasOwnProperty(x)) {
					if (pageWidget[x].script) {
						pageWidgetNames.push(x);
						pageWidgetArray.push(path.join(globalConfig.paths.include, x, 'script.js'));
					}
				}
			}
			//带随机数脚本
			let pageWidgetInsert = '<script>';
			for (let x in uuidCollection.script) {
				if (uuidCollection.script.hasOwnProperty(x)) {
					let cont = uuidCollection.script[x];
					if (cont) {
						pageWidgetInsert += `
define("${x}-inline", function(require, exports, module) {
	${cont}
});
seajs.use("${x}-inline");
`;
					}
				}
			}
			if (pageWidgetNames.length) {
				if (pageWidgetNames.length === 1) {
					//单文件内嵌
					let widgetName = pageWidgetNames[0];
					let cont = pageWidget[widgetName].script;
					if (cont) {
						pageWidgetInsert += `
	define("${widgetName}-inline", function(require, exports, module) {
		${cont}
	});
	seajs.use("${widgetName}-inline");
`;
					}
					if (pageWidgetInsert === '<script>') {
						pageWidgetInsert = '';
					} else {
						pageWidgetInsert += '</script>';
					}
				} else {
					//查找缓存
					let hasCache = false;;
					if (packages['script' + pageWidgetNames.length]) {
						let maybeArr = packages['script' + pageWidgetNames.length];
						maybeArr.forEach(function(maybe, i) {
							let same = true;
							pageWidgetNames.forEach(function(widget) {
								if (!util.isContain(maybe, widget)) {
									same = false;
									return false;
								}
							});
							if (same) {
								hasCache = maybe;
							}
						});
						if (hasCache) {
							//此包已存在
						} else {
							packages['script' + pageWidgetNames.length].push(pageWidgetNames);
						}
					} else {
						packages['script' + pageWidgetNames.length] = [pageWidgetNames];
					}

					let pageWidgetName = pageWidgetNames.join('-') + '.js';
					let pageWidgetDest = path.join(globalConfig.serverRoot, globalConfig.distDir, './include');
					if (pageWidgetInsert === '<script>') {
						pageWidgetInsert = '';
					} else {
						pageWidgetInsert += '</script>';
					}
					pageWidgetInsert += '\n<script src="' + path.join('/', path.join(pageWidgetDest, pageWidgetName)) + '"></script>\n';
					if (!hasCache) {
						scriptsConcat({
							src: pageWidgetArray,
							name: pageWidgetName,
							dest: pageWidgetDest,
							mapsrc: './maps',
							beforeConcat: function(file) {
								let content = file.contents.toString();
								let widgetName = file.path.match(isIncludeReg)[1];
								content =
									`define("${widgetName}-inline",function(require, exports, module) {
			${content}
		});
		seajs.use("${widgetName}-inline");
		`;
								return content;
							}
						});
					}
				}
			} else {
				if (pageWidgetInsert === '<script>') {
					pageWidgetInsert = '';
				} else {
					pageWidgetInsert += '</script>';
				}
			}
			content = util.insertBeforeStr(content, '</body>', pageWidgetInsert);
			file.contents = Buffer.from(content);
			return file;
		}))
		.pipe(replace(globalConfig.rootHolder, globalConfig.serverRoot))
		.pipe(replace(globalConfig.projectHolder, globalConfig.projectDir))
		.pipe(replace(globalConfig.distHolder, distHolderFinal))
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

let copy = function(filePath, callback) {
	let copyFile;
	if (isAbsolute(globalConfig.dist.base)) {
		if (filePath && filePath.split) {
			copyFile = filePath;
		} else if (Array.isArray(globalConfig.extendsPath) && globalConfig.extendsPath.length) {
			spinner.text = '正在拷贝文件';
			spinner.render();
			copyFile = globalConfig.extendsPath;
		}
		gulp.src(copyFile, {
				base: '.'
			})
			.pipe(gulp.dest(globalConfig.root))
			.on('end', function() {
				if (filePath) {
					console.log('\n' + filePath + '已拷贝至发布目录')
				}
				if (typeof(callback) === 'function') {
					callback();
				}
			});
	} else if (typeof(callback) === 'function') {
		callback();
	}
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
				spinner.clear();
				spinner.text = '构建完成, 耗时:' + (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2) + 'ms';
				spinner.succeed();
				if (typeof(callback) === 'function') {
					callback();
				} else {
					process.exit();
				}
			}
		},
		startBuild = function() {
			spinner.start();
			build.prototype.todoList.forEach(function(item, index) {
				item(null, resolve);
			});
		};
	if (!util.isExist(path.join('./', globalConfig.projectDir))) {
		console.log(globalConfig.projectDir + '不存在！');
		return process.exit();
	}
	if (!globalConfig.checkUpdate) {
		spinner.text = '正在构建...';
		return startBuild();
	}
	spinner.text = '正在检查更新...';
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
			let myEval = function(cmd, context, filename, callback) {
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
build.prototype.todoList = [copy, script, image, font, html]; //css编译将被html调起

module.exports = {
	build: build,
	script: script,
	copy: copy,
	image: image,
	font: font,
	css: css,
	html: html
};