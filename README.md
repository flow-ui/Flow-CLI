#front-flow-cli

基于[frontend框架](http://git.oschina.net/tower1229/frontend)的前端自动化工具

##功能

1. 自动初始化项目
2. 静态资源合并
3. Less编译
4. 前端模板引入
5. 文件监听即时刷新
6. 图片压缩
7. css autoprefixer

##安装

1. 安装nodejs(>=6.5.0)
2. npm安装：`npm install front-flow-cli -g`

##文档

###flow init

在当前目录初始化一个[front-flow](https://github.com/tower1229/front-flow-template)项目

###flow run

监听当前项目文件修改，并启动localhost:3000端口，实时编译并刷新浏览器

###flow build

编译当前项目，默认至`./dist`文件夹

##开发指南

[官方网站](http://zangtao.org/projects/front-flow-cli/)

##License 

MIT
