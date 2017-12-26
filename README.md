English | [中文](README_CN.md)

# Flow-CLI

[![npm](https://img.shields.io/npm/v/front-flow-cli.svg)](https://www.npmjs.com/package/front-flow-cli/) [![DUB](https://travis-ci.org/tower1229/Flow-CLI.svg?branch=master)]() [![node](https://img.shields.io/node/v/front-flow-cli.svg)]() [![license](https://img.shields.io/github/license/tower1229/Flow-CLI.svg)]()

> Flow-CLI is an automated tool for Flow-UI development, which realizes automatic front initialization, component-based development, static resource compilation, static resource optimization, image compression and other front-end automation functions.

[![logo](https://github.com/tower1229/tower1229.github.io/raw/master/asset/flow-cli-logo.jpg)](http://refined-x.com/Flow-CLI/)

## Introduction

1. Initialization project
2. Static resource merger
3. Less precompilation
4. Component-based development
5. Real time preview service
6. Picture compression

## Documentation

[Flow-CLI Documentation](https://flow-ui.refined-x.com/Flow-CLI/docs/)

## Setup

1. install nodejs(>=6.5.0)
2. npm：`npm install front-flow-cli -g`

## Use

### flow init

Initialize a [flow-ui](https://github.com/flow-ui/Flow-UI) project template in the current directory.

### flow build [configName]

Compiling the current development directory, default loading configuration `config.json`, and specifying the name of the configuration file.

### flow run [configName]

Compile and listen to the development directory, start the real-time preview service, the default load configuration `config.json`, and specify the name of the configuration file.

## Interface

![preview](https://raw.githubusercontent.com/tower1229/Flow-CLI/master/docs/img/flow-cli-album.png)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2017-present, [refined-x.com](http://refined-x.com)

