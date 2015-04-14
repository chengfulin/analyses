/**
 * Created by chengfulin on 2015/4/10.
 */
var esprima = require('esprima');
var esgraph = require('esgraph');
var ReachDefinitions = require('../lib/examples/reachdefinitions');
var Set = require('../lib/set');

/**
 * Get the CFG of the script code
 * @param code
 * @returns CFG
 */
function getCFG(code) {
    var ast = esprima.parse(code);
    return esgraph(ast);
}

/**
 * Do reach definitions analysis
 * @param cfg CFG of the source code
 * @returns reach definitions of all nodes
 */
function doAnalysis(cfg) {
    return ReachDefinitions(cfg);
}

/**
 * Test suites
 */
describe('Reach Definitions', function () {
    it('should work for declaration only', function () {
        var cfg = getCFG('var x = 55, y = 10, tmp = 0;\n'),
            output = doAnalysis(cfg);
        /// RD(entry) should be empty
        output.get(cfg[0]).values().should.be.empty;
        /// RD(exit) should be {x, y, tmp}
        var exitRD = output.get(cfg[1]).values();
        exitRD.length.should.eql(3);
        exitRD.should.containEql('x', 'y', 'tmp');
        /// RD(n1) should be {x, y, tmp}
        var n1RD = output.get(cfg[2][1]).values();
        n1RD.length.should.eql(3);
        n1RD.should.containEql('x', 'y', 'tmp');
    });

    it('should work for redefinition', function () {
        var cfg = getCFG('var x = 55, y = 10, tmp = 0;\n' +
                         'x = 66;\n' +
                         'y = tmp = 1;'),
            output = doAnalysis(cfg);
        /// RD(exit) should be {x, y, tmp}
        var exitRD = output.get(cfg[1]).values();
        exitRD.length.should.eql(3);
        exitRD.should.containEql('x', 'y', 'tmp');
        /// RD(n1) should be {x, y, tmp}
        var n1RD = output.get(cfg[2][2]).values();
        n1RD.length.should.eql(3);
        n1RD.should.containEql('x', 'y', 'tmp');
        /// RD(n2) should be {x, y, tmp}
        var n2RD = output.get(cfg[2][3]).values();
        n2RD.length.should.eql(3);
        n2RD.should.containEql('x', 'y', 'tmp');
    });

    it('should work for update expression', function () {
        var cfg = getCFG(
                'var x = 5;\n' +
                '++x;'
            ),
            output = doAnalysis(cfg);
        //// RD(exit) should be {x}
        var exitRD = output.get(cfg[1]).values();
        exitRD.should.eql(['x']);
        /// RD(n1) should be {x}
        var n1RD = output.get(cfg[2][1]).values();
        n1RD.should.eql(['x']);
        /// RD(n2) should be {x}
        var n2RD = output.get(cfg[2][2]).values();
        n2RD.should.eql(['x']);
    });

    it('should work for obj', function () {
       var cfg = getCFG(
               'var obj = {};\n' +
               'obj.prop = 123;'
           ),
           output = doAnalysis(cfg);
        /// RD(exit) should be {obj}
        var exitRD = output.get(cfg[1]).values();
        exitRD.should.eql(['obj']);
        /// RD(n1) should be {obj}
        var n1RD = output.get(cfg[2][1]).values();
        n1RD.should.eql(['obj']);
        /// RD(n2) should be {obj}
        var n2RD = output.get(cfg[2][2]).values();
        n2RD.should.eql(['obj']);
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
            output = doAnalysis(cfg);
        /// RD(exit) should be {x, y}
        var exitRD = output.get(cfg[1]).values();
        exitRD.length.should.eql(3);
        exitRD.should.containEql('x', 'y', 'z');
        /// RD(n3) should be {x, y}
        var n3RD = output.get(cfg[2][3]).values();
        n3RD.length.should.eql(3);
        n3RD.should.containEql('x', 'y', 'z');
        /// RD(n4) should be {x, y, z}
        var n4RD = output.get(cfg[2][4]).values();
        n4RD.length.should.eql(3);
        n4RD.should.containEql('x', 'y', 'z');
        /// RD(n5) should be {x, y}
        var n5RD = output.get(cfg[2][5]).values();
        n5RD.length.should.eql(2);
        n5RD.should.containEql('x', 'y');
    });

    it('should work for loops', function () {
        var cfg = getCFG(
                'var x = 5, y = 0;\n' +
                'while(x > 0) {\n' +
                'y += x;\n' +
                '--x;\n' +
                'var z = x;\n' +
                '}'
            ),
            output = doAnalysis(cfg);
        /// RD(exit) should be {x, y, z}
        var exitRD = output.get(cfg[1]).values();
        exitRD.length.should.eql(3);
        exitRD.should.containEql('x', 'y', 'z');
        /// RD(n3) should be {x, y, z}
        /// variable z can reach n3 (y += x),
        /// since there is a path from its definition (n5) to n3
        var n3RD = output.get(cfg[2][3]).values();
        n3RD.length.should.eql(3);
        n3RD.should.containEql('x', 'y', 'z');
        /// RD(n5) should be {x, y, z}
        var n5RD = output.get(cfg[2][5]).values();
        n5RD.length.should.eql(3);
        n5RD.should.containEql('x', 'y', 'z');
    });
});
