var assert = require('assert');
var pkg = require('../package.json');
var v = pkg.version;
describe('commond test', function() {
	describe('#flow -V', function() {
		it('should return version', function() {
			assert.equal(pkg.version, v);
		});
	});
});