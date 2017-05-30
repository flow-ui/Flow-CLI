
const download = require('download-git-repo');
const ora = require('ora');

const init = function() {
	const spinner = ora('正在下载模板');
	spinner.color = 'yellow';
	spinner.start();
	download('tower1229/Flow-Template', '.', function(err) {
		if (err) return console.log(err);
		spinner.text = '项目初始化完成！';
		spinner.succeed();
		process.exit();
	});
};

module.exports = init;