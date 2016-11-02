#!/usr/bin/env node

const init = require('./init');
const run = require('./run');
const build = require('./build').build;

const program = require('commander');
const pkg = require('../package.json');

process.title = pkg.name + ' V' + pkg.version;

program
	.version(pkg.version)
	.usage('[command] <option>');

program
	.command('init')
	.description('初始化一个front-flow模板项目')
	.action(function() {
		init();
	});

program
	.command('run [dir]')
	.description('运行开发服务')
	.action(function(dir) {
		run(dir);
	});

program
	.command('build [dir]')
	.description('编译打包')
	.action(function(dir) {
		build(dir);
	});

program.parse(process.argv);