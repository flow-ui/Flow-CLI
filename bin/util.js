const fs = require('fs');

const getUUID = function(len) {
	len = len || 6;
	const seed = "0123456789abcdefghijklmnopqrstubwxyzABCEDFGHIJKLMNOPQRSTUVWXYZ";
	let seedLen = seed.length - 1;
	let uuid = "";
	while (len--) {
		uuid += seed[Math.round(Math.random() * seedLen)];
	}
	return uuid;
};
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
const insertAfterStr = function(fileContents, search, str) {
	let index, start, end;
	index = fileContents.indexOf(search);
	if (index > -1) {
		start = fileContents.substr(0, index + search.length);
		end = fileContents.substr(index + search.length);
		return start + str + end;
	} else {
		return fileContents;
	}
};
const readFileSync = function(filepath) {
	return fs.readFileSync(filepath).toString().trim();
};

module.exports = {
	isExist: isExist,
	isContain: isContain,
	insertBeforeStr: insertBeforeStr,
	insertAfterStr: insertAfterStr,
	getUUID: getUUID,
	readFileSync: readFileSync
};