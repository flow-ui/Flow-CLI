#!/usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');

process.title = pkg.name + ' V' + pkg.version;

program
	.version(pkg.version)
	.usage('[command]');

program
	.command('init')
	.description('初始化模板项目')
	.action(function() {
		require('./init')();
	});

program
	.command('run')
	.description('运行开发服务')
	.action(function() {
		require('./run')();
	});

program
	.command('build')
	.description('编译打包')
	.action(function() {
		require('./build').build();
	});

program.parse(process.argv);