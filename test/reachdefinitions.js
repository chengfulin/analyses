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

describe('KILL set', function () {
    it('should work for declaration only', function () {
        var cfg = getCFG(
            'var x = 55, y = 10, tmp = 0;\n'
        );
        /// KILL set of the entry node should be empty set
        ReachDefinitions.KILL(cfg[0].astNode).values().should.be.empty;
        /// KILL set of the exit node should be empty set
        ReachDefinitions.KILL(cfg[1].astNode).values().should.be.empty;
        /// KILL set of the VariableDeclaration node should be empty set
        ReachDefinitions.KILL(cfg[2][1].astNode).values().should.be.empty;
    });

    it('should work for redefinition', function () {
        var cfg = getCFG(
            'var x = 55, y = 10, tmp = 0;\n' +
            'x = 66;\n' +
            'y = tmp = 1;'
        );
        /// KILL set of the AssignmentExpression node
        ReachDefinitions.KILL(cfg[2][2].astNode).values().should.eql(['x']);
        /// KILL set of assignment chain
        ReachDefinitions.KILL(cfg[2][3].astNode).values().should.eql(['y', 'tmp']);
    });

    it('should work for update expression', function () {
        var cfg = getCFG(
            'var x = 5;\n' +
            '++x;'
        );
        /// KILL set of UpdateExpression node
        ReachDefinitions.KILL(cfg[2][2].astNode).values().should.eql(['x']);
    });

    it('should work for object property assignment', function () {
        var cfg = getCFG(
            'var obj = {};\n' +
            'obj.prop = 123;'
        );
        /// KILL set of the AssignmentExpression of object MemberExpression
        ReachDefinitions.KILL(cfg[2][2].astNode).values().should.eql(['obj']);
    });

    it('should work for branches', function () {
        var cfg = getCFG(
            'var x = 20, y = 5;\n' +
            'if (x > y) {\n' +
                'var z = 10;' +
                'x = x % y;\n' +
            '} else {\n' +
                'y = x;\n' +
            '}'
        );
        /// KILL set of the test of the if statement
        ReachDefinitions.KILL(cfg[2][2].astNode).values().should.be.empty;
        /// KILL set of the fist statement when test for If statement is true
        ReachDefinitions.KILL(cfg[2][3].astNode).values().should.be.empty;
        /// KILL set of the second statement when test for If statement is true
        ReachDefinitions.KILL(cfg[2][4].astNode).values().should.eql(['x']);
        /// KILL set of the node of the statement in the Else statement
        ReachDefinitions.KILL(cfg[2][5].astNode).values().should.eql(['y']);
    });

    it('should work for loops', function () {
        var cfg = getCFG(
            'var x = 5, y = 0;\n' +
            'while(x > 0) {\n' +
                'y += x;\n' +
                '--x;\n' +
                'var z = x;\n' +
            '}'
        );
        /// KILL set of the test of the loop
        ReachDefinitions.KILL(cfg[2][2].astNode).values().should.be.empty;
        /// KILL set of node inside loop
        ReachDefinitions.KILL(cfg[2][3].astNode).values().should.eql(['y']);
        /// KILL set of the last node indes the loop
        ReachDefinitions.KILL(cfg[2][5].astNode).values().should.be.empty;
    });
});

describe('GEN set', function () {
    it('should work for declaration only', function () {
        var cfg = getCFG(
            'var x = 55, y = 10, tmp = 0;\n'
        );
        /// GEN set of the entry node should be empty set
        ReachDefinitions.GEN(cfg[0].astNode).values().length.should.eql(0);
        /// GEN set of the exit node should be empty set
        ReachDefinitions.GEN(cfg[1].astNode).values().length.should.eql(0);
        /// GEN set of the VariableDeclaration node should be empty set
        ReachDefinitions.GEN(cfg[2][1].astNode).values().should.eql(['x', 'y', 'tmp']);
    });

    it('should work for redefinition', function () {
        var cfg = getCFG(
            'var x = 55, y = 10, tmp = 0;\n' +
            'x = 66;\n' +
            'y = tmp = 1;'
        );
        /// GEN set of the AssignmentExpression node
        ReachDefinitions.GEN(cfg[2][2].astNode).values().should.eql(['x']);
        /// GEN set of chain of assignment
        ReachDefinitions.GEN(cfg[2][3].astNode).values().should.eql(['y', 'tmp']);
    });

    it('should work for object declaration', function () {
        var cfg = getCFG(
            'var x = 1, obj = {p: "prop"};'
        );
        /// GEN set of the VariableDeclaration node with object initialization
        ReachDefinitions.GEN(cfg[2][1].astNode).values().should.eql(['x', 'obj']);
    });

    it('should work for object property assignment', function () {
        var cfg = getCFG(
            'var obj = {};\n' +
            'obj.prop = 123;'
        );
        /// GEN set of the AssignmentExpression of object MemberExpression
        ReachDefinitions.GEN(cfg[2][2].astNode).values().should.eql(['obj']);
    });


    it('should work for update expression', function () {
        var cfg = getCFG(
            'var x = 5;\n' +
            'x++;'
        );
        /// GEN set of the UpdateExpression node
        ReachDefinitions.GEN(cfg[2][2].astNode).values().should.eql(['x']);
    });

    it('should work for branches', function () {
        var cfg = getCFG(
            'var x = 20, y = 5;\n' +
            'if (x > y) {\n' +
            'var z = 10;' +
            'x = x % y;\n' +
            '} else {\n' +
            'y = x;\n' +
            '}'
        );
        /// GEN set of the node only binary expression should be empty
        ReachDefinitions.GEN(cfg[2][2].astNode).values().should.be.empty;
        /// GEN set of the fist statement in the If statement
        ReachDefinitions.GEN(cfg[2][3].astNode).values().should.eql(['z']);
        /// GEN set of the second statement in the If statement
        ReachDefinitions.GEN(cfg[2][4].astNode).values().should.eql(['x']);
        /// GEN set of the node of the statement in the Else statement
        ReachDefinitions.GEN(cfg[2][5].astNode).values().should.eql(['y']);
    });

    it('should work for loops', function () {
        var cfg = getCFG(
            'var x = 5, y = 0;\n' +
            'while(x > 0) {\n' +
            'y += x;\n' +
            '--x;\n' +
            'var z = x;\n' +
            '}'
        );
        /// GEN set of node for the test of the loop
        ReachDefinitions.GEN(cfg[2][2].astNode).values().should.be.empty;
        /// GEN set of node inside loop
        ReachDefinitions.GEN(cfg[2][3].astNode).values().should.eql(['y']);
        /// GEN set of the last node indes the loop
        ReachDefinitions.GEN(cfg[2][5].astNode).values().should.eql(['z']);
    });
});