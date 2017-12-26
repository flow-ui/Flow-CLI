中文 | [English](README.md)

# Flow-CLI

[![npm](https://img.shields.io/npm/v/front-flow-cli.svg)](https://www.npmjs.com/package/front-flow-cli/) [![DUB](https://travis-ci.org/tower1229/Flow-CLI.svg?branch=master)]() [![node](https://img.shields.io/node/v/front-flow-cli.svg)]() [![license](https://img.shields.io/github/license/tower1229/Flow-CLI.svg)]()

> Flow-CLI是Flow-UI的配套命令行工具，实现自动初始化、组件化开发、静态资源编译、静态资源优化、图片压缩等前端自动化功能。

[![logo](https://github.com/tower1229/tower1229.github.io/raw/master/asset/flow-cli-logo.jpg)](http://refined-x.com/Flow-CLI/)

## 介绍

1. 初始化项目
2. 构建中部分静态资源合并
3. 构建中less预编译
4. 组件化开发
5. 实时预览服务
6. 图片压缩

## 文档

[Flow-CLI Documentation](https://flow-ui.refined-x.com/Flow-CLI/docs/)

## 安装

1. 安装nodejs(>=6.5.0)
2. npm安装：`npm install front-flow-cli -g`

## 使用

### flow init

在当前目录初始化一个[flow-ui](https://github.com/tower1229/Flow-UI)项目模板

### flow build [configName]

编译当前开发目录，默认加载配置`config.json`，可指定配置文件名称

### flow run [configName]

编译并监听开发目录，启动实时预览服务，默认加载配置`config.json`，可指定配置文件名称

## 界面

![preview](https://raw.githubusercontent.com/tower1229/Flow-CLI/master/docs/img/flow-cli-album.png)

## 许可证

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2017-present, [前端路上](http://refined-x.com)
