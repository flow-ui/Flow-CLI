const chokidar = require('chokidar');
let watch;

watcher = function(projectFolder){
	watch = chokidar.watch(['./_component', './modules', projectFolder], {
		ignored: /[\/\\]\.|(\.[^\.]*TMP[^\.]*$)/,
		ignorePermissionErrors: true,
		atomic: true
	});
	return watch;
};

module.exports = watcher;