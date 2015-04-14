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

/**
 * Add Id to each CFG node
 * @param cfg the CFG to be modified
 * @returns CFG
 */
function addCFGIds(cfg) {
    for(var index = 0; index < cfg[2].length; ++index) {
        (cfg[2][index]).cfgId = index;
    }

    return cfg;
}

describe('DFA', function () {
    it('should work for variable declaration only', function () {
        var cfg = getCFG('var x = 55, y = 10, tmp = 0;\n');
        /// Get last def of 'x' at 'n1'
        DFA.LastDEFs(cfg[2][1], 'x').values().should.eql([1]);
        /// Get last def of 'y' at 'n1'
        DFA.LastDEFs(cfg[2][1], 'y').values().should.eql([1]);
        /// Get last def of 'tmp' at 'n1'
        DFA.LastDEFs(cfg[2][1], 'tmp').values().should.eql([1]);
    });

    it('should work for redefinition', function () {
        var cfg = getCFG(
            'var x = 55, y = 10, tmp = 0;\n' +
            'x = 66;\n' +
            'y = tmp = 1;'
        );
        /// Get last def of 'x' at 'n2'
        DFA.LastDEFs(cfg[2][2], 'x').values().should.eql([2]);
        /// Get last def of 'y' at 'n3'
        DFA.LastDEFs(cfg[2][3], 'y').values().should.eql([3]);
        /// Get last def of 'tmp' at 'n3'
        DFA.LastDEFs(cfg[2][3], 'tmp').values().should.eql([3]);
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
            );
        /// Get last def of 'x' at node 'x > y'
        DFA.LastDEFs(cfg[2][2], 'x').values().should.eql([1]);
        /// Get last def of 'x' at node 'x = x % y'
        DFA.LastDEFs(cfg[2][4], 'x').values().should.eql([4]);
        /// Get last def of 'y' at node 'x = x % y'
        DFA.LastDEFs(cfg[2][4], 'y').values().should.eql([1]);
        /// Get last def of 'z' at node 'x = x % y'
        DFA.LastDEFs(cfg[2][4], 'z').values().should.eql([3]);
        /// Get last def of 'x' at node 'y = x'
        DFA.LastDEFs(cfg[2][5], 'x').values().should.eql([1]);
        /// Get last def of 'x' at node 'y = x'
        DFA.LastDEFs(cfg[2][5], 'y').values().should.eql([5]);
    });
});

describe('KILL set', function () {
    it('should work for declaration only', function () {
        var cfg = getCFG(
            'var x = 55, y = 10, tmp = 0;\n'
        );
        /// KILL set of the entry node should be empty set
        DFA.KILL(cfg[0].astNode).values().should.be.empty;
        /// KILL set of the exit node should be empty set
        DFA.KILL(cfg[1].astNode).values().should.be.empty;
        /// KILL set of the VariableDeclaration node should be empty set
        DFA.KILL(cfg[2][1].astNode).values().should.be.empty;
    });

    it('should work for redefinition', function () {
        var cfg = getCFG(
            'var x = 55, y = 10, tmp = 0;\n' +
            'x = 66;\n' +
            'y = tmp = 1;'
        );
        /// KILL set of the AssignmentExpression node
        DFA.KILL(cfg[2][2].astNode).values().should.eql(['x']);
        /// KILL set of assignment chain
        DFA.KILL(cfg[2][3].astNode).values().should.eql(['y', 'tmp']);
    });

    it('should work for update expression', function () {
        var cfg = getCFG(
            'var x = 5;\n' +
            '++x;'
        );
        /// KILL set of UpdateExpression node
        DFA.KILL(cfg[2][2].astNode).values().should.eql(['x']);
    });

    it('should work for object property assignment', function () {
        var cfg = getCFG(
            'var obj = {};\n' +
            'obj.prop = 123;'
        );
        /// KILL set of the AssignmentExpression of object MemberExpression
        DFA.KILL(cfg[2][2].astNode).values().should.eql(['obj']);
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
        DFA.KILL(cfg[2][2].astNode).values().should.be.empty;
        /// KILL set of the fist statement when test for If statement is true
        DFA.KILL(cfg[2][3].astNode).values().should.be.empty;
        /// KILL set of the second statement when test for If statement is true
        DFA.KILL(cfg[2][4].astNode).values().should.eql(['x']);
        /// KILL set of the node of the statement in the Else statement
        DFA.KILL(cfg[2][5].astNode).values().should.eql(['y']);
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
        DFA.KILL(cfg[2][2].astNode).values().should.be.empty;
        /// KILL set of node inside loop
        DFA.KILL(cfg[2][3].astNode).values().should.eql(['y']);
        /// KILL set of the last node indes the loop
        DFA.KILL(cfg[2][5].astNode).values().should.be.empty;
    });
});

describe('GEN set', function () {
    it('should work for declaration only', function () {
        var cfg = getCFG(
            'var x = 55, y = 10, tmp = 0;\n'
        );
        /// GEN set of the entry node should be empty set
        DFA.GEN(cfg[0].astNode).values().length.should.eql(0);
        /// GEN set of the exit node should be empty set
        DFA.GEN(cfg[1].astNode).values().length.should.eql(0);
        /// GEN set of the VariableDeclaration node should be empty set
        DFA.GEN(cfg[2][1].astNode).values().should.eql(['x', 'y', 'tmp']);
    });

    it('should work for redefinition', function () {
        var cfg = getCFG(
            'var x = 55, y = 10, tmp = 0;\n' +
            'x = 66;\n' +
            'y = tmp = 1;'
        );
        /// GEN set of the AssignmentExpression node
        DFA.GEN(cfg[2][2].astNode).values().should.eql(['x']);
        /// GEN set of chain of assignment
        DFA.GEN(cfg[2][3].astNode).values().should.eql(['y', 'tmp']);
    });

    it('should work for object declaration', function () {
        var cfg = getCFG(
            'var x = 1, obj = {p: "prop"};'
        );
        /// GEN set of the VariableDeclaration node with object initialization
        DFA.GEN(cfg[2][1].astNode).values().should.eql(['x', 'obj']);
    });

    it('should work for object property assignment', function () {
        var cfg = getCFG(
            'var obj = {};\n' +
            'obj.prop = 123;'
        );
        /// GEN set of the AssignmentExpression of object MemberExpression
        DFA.GEN(cfg[2][2].astNode).values().should.eql(['obj']);
    });


    it('should work for update expression', function () {
        var cfg = getCFG(
            'var x = 5;\n' +
            'x++;'
        );
        /// GEN set of the UpdateExpression node
        DFA.GEN(cfg[2][2].astNode).values().should.eql(['x']);
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
        DFA.GEN(cfg[2][2].astNode).values().should.be.empty;
        /// GEN set of the fist statement in the If statement
        DFA.GEN(cfg[2][3].astNode).values().should.eql(['z']);
        /// GEN set of the second statement in the If statement
        DFA.GEN(cfg[2][4].astNode).values().should.eql(['x']);
        /// GEN set of the node of the statement in the Else statement
        DFA.GEN(cfg[2][5].astNode).values().should.eql(['y']);
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
        DFA.GEN(cfg[2][2].astNode).values().should.be.empty;
        /// GEN set of node inside loop
        DFA.GEN(cfg[2][3].astNode).values().should.eql(['y']);
        /// GEN set of the last node indes the loop
        DFA.GEN(cfg[2][5].astNode).values().should.eql(['z']);
    });
});