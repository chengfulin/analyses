/**
 * Created by chengfulin on 2015/4/13.
 */
var esprima = require('esprima');
var esgraph = require('esgraph');
var DFA = require('../lib/examples/dfa');
var Set = require('../lib/set');

/**
 * Get the CFG of the script code
 * @param code
 * @returns CFG
 */
function getCFG(code) {
    var ast = esprima.parse(code);
    return addCFGIds(esgraph(ast));
}

function addCFGIds(cfg) {
    for(var index = 0; index < cfg[2].length; ++index) {
        (cfg[2][index]).cfgId = index;
    }

    return cfg;
}

describe('DFA', function () {
    it('should work for variable declaration only', function () {
        var cfg = getCFG('var x = 55, y = 10, tmp = 0;\n'),
            lastdefs = DFA.LastDEF(cfg);
        ///
        lastdefs.get(cfg[2][1]).get('x').values().should.eql([1]);
        lastdefs.get(cfg[2][1]).get('y').values().should.eql([1]);
        lastdefs.get(cfg[2][1]).get('tmp').values().should.eql([1]);
    });

    it('should work for redefinition', function () {
        var cfg = getCFG('var x = 55, y = 10, tmp = 0;\n' +
            'x = 66;\n' +
            'y = tmp = 1;'),
            lastdefs = DFA.LastDEF(cfg);
        ///
        lastdefs.get(cfg[2][2]).get('x').values().should.eql([2]);
        lastdefs.get(cfg[2][3]).get('y').values().should.eql([3]);
        lastdefs.get(cfg[2][3]).get('tmp').values().should.eql([3]);
    });

    it('should work for branches', function () {
        var cfg = getCFG(
                'var x = 20, y = 5;\n' +
                'if (x > y) {\n' +
                'var z = 10;\n' +
                'x = x % y;\n' +
                '} else {\n' +
                'y = x;\n' +
                '}'
            ),
            lastdefs = DFA.LastDEF(cfg);
        /// Find the last def of 'x' in the test of if statement
        lastdefs.get(cfg[2][2]).get('x').values().should.eql([1]);
        /// Find the last def of 'z' declared in a branch
        lastdefs.get(cfg[2][3]).get('z').values().should.eql([3]);
        /// Find the last def of 'x' redefined in a branch
        lastdefs.get(cfg[2][4]).get('x').values().should.eql([4]);
        /// Find the last def of 'y' used in a branch
        lastdefs.get(cfg[2][4]).get('y').values().should.eql([1]);
        /// Find the last def of 'x' in another branch
        lastdefs.get(cfg[2][5]).get('x').values().should.eql([1]);
        /// Find the last def of 'y' in another branch
        lastdefs.get(cfg[2][5]).get('y').values().should.eql([5]);
        /// Find the last def of 'x' in the exit node
        lastdefs.get(cfg[1]).get('x').values().should.eql([1, 4]);
        /// Find the last def of 'y' in the exit node
        lastdefs.get(cfg[1]).get('y').values().should.eql([1, 5]);
    });
});