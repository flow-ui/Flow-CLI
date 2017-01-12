const chokidar = require('chokidar');

const globalConfig = require('./paths')(process.configName);

let watcher = function(projectFolder){
	let watchArray = ['_component', projectFolder];
	if(Array.isArray(globalConfig.extendsPath) && globalConfig.extendsPath.length){
		watchArray = watchArray.concat(globalConfig.extendsPath);
	}
	return chokidar.watch(watchArray, {
		ignored: /[\/\\]\.|(\.[^\.]*TMP[^\.]*$)/,
		ignorePermissionErrors: true,
		atomic: true
	});
};

module.exports = watcher;