/**
 * Created by chengfulin on 2015/4/10.
 */
var esprima = require('esprima');
var esgraph = require('esgraph');
var ReachDefinitions = require('../lib/examples/reachdefinitions');
var Set = require('../lib/set');

/**
 * Do reach definitions analysis
 * @param code source code
 * @returns reach definitions of start node
 */
function doAnalysis(code) {
    var ast = esprima.parse(code);
    var cfg = esgraph(ast);
    var output = ReachDefinitions(cfg);
    return output.get(cfg[2][1]);/// start node
}

/**
 * Test suites
 */
describe('KILL set', function () {
    it('Should work for declaration only', function () {
        var cfg = esgraph(esprima.parse(
            'var x = 55, y = 10, tmp = 0;\n'
        ));
        /// KILL set of the entry node should be empty set
        ReachDefinitions.KILL(cfg[0].astNode).values().length.should.eql(0);
        /// KILL set of the exit node should be empty set
        ReachDefinitions.KILL(cfg[1].astNode).values().length.should.eql(0);
        /// KILL set of the VariableDeclaration node should be empty set
        ReachDefinitions.KILL(cfg[2][1].astNode).values().length.should.eql(0);
    });

    it('Should work for redefinition', function () {
        var cfg = esgraph(esprima.parse(
            'var x = 55, y = 10, tmp = 0;\n' +
            'x = 66;\n' +
            'y = tmp = 1;'
        ));
        /// KILL set of the AssignmentExpression node
        var killOfAssign = ReachDefinitions.KILL(cfg[2][2].astNode).values();
        killOfAssign.length.should.eql(1);
        killOfAssign.should.containEql('x');
        /// KILL set of assignment chain
        var killOfAssignChain = ReachDefinitions.KILL(cfg[2][3].astNode).values();
        killOfAssignChain.length.should.eql(2);
        killOfAssignChain.should.containEql('y', 'tmp');
    });

    it('Should work for update expression', function () {
        var cfg = esgraph(esprima.parse(
            'var x = 5;\n' +
            '++x;'
        ));
        /// KILL set of UpdateExpression node
        var killOfUpdate = ReachDefinitions.KILL(cfg[2][2].astNode).values();
        killOfUpdate.length.should.eql(1);
        killOfUpdate.should.containEql('x');
    });

    it('Should work for object', function () {
        var cfg = esgraph(esprima.parse(
            'var obj = {};\n' +
            'obj.prop = 123;'
        ));
        /// KILL set of the AssignmentExpression of object MemberExpression
        var killOfPropDef = ReachDefinitions.KILL(cfg[2][2].astNode).values();
        killOfPropDef.length.should.eql(1);
        killOfPropDef.should.containEql('obj');
    });

    it('Should work for branches', function () {
        var cfg = esgraph(esprima.parse(
            'var x = 20, y = 5;\n' +
            'if (x > y) {\n' +
                'x = x % y;\n' +
            '} else {\n' +
                'y = x;\n' +
            '}'
        ));
        /// KILL set of the node of one branch
        var killedInIf = ReachDefinitions.KILL(cfg[2][3].astNode).values();
        killedInIf.length.should.eql(1);
        killedInIf.should.containEql('x');
        /// KILL set of the node of another branch
        var killedInElse = ReachDefinitions.KILL(cfg[2][4].astNode).values();
        killedInElse.length.should.eql(1);
        killedInElse.should.containEql('y');
    });

    it('Should work for loops', function () {
        var cfg = esgraph(esprima.parse(
            'var x = 5, y = 0;\n' +
            'while(x > 0) {\n' +
                'y += x;\n' +
                '--x;\n' +
            '}'
        ));
        /// KILL set of node inside loop
        var killInLoop = ReachDefinitions.KILL(cfg[2][3].astNode).values();
        killInLoop.length.should.eql(1);
        killInLoop.should.containEql('y');
    });
});

describe('GEN set', function () {
    it('Should work for declaration only', function () {
        var cfg = esgraph(esprima.parse(
            'var x = 55, y = 10, tmp = 0;\n'
        ));
        /// GEN set of the entry node should be empty set
        ReachDefinitions.GEN(cfg[0].astNode).values().length.should.eql(0);
        /// GEN set of the exit node should be empty set
        ReachDefinitions.GEN(cfg[1].astNode).values().length.should.eql(0);
        /// GEN set of the VariableDeclaration node should be empty set
        var genOfDeclare = ReachDefinitions.GEN(cfg[2][1].astNode).values();
        genOfDeclare.length.should.eql(3);
        genOfDeclare.should.containEql('x', 'y', 'tmp');
    });

    it('Should work for redefinition', function () {
        var cfg = esgraph(esprima.parse(
            'var x = 55, y = 10, tmp = 0;\n' +
            'x = 66;\n' +
            'y = tmp = 1;'
        ));
        /// GEN set of the AssignmentExpression node
        var genOfAssign = ReachDefinitions.GEN(cfg[2][2].astNode).values();
        genOfAssign.length.should.eql(1);
        genOfAssign.should.containEql('x');
        /// GEN set of chain of assignment
        var genOfAssignChain = ReachDefinitions.GEN(cfg[2][3].astNode).values();
        genOfAssignChain.length.should.eql(2);
        genOfAssignChain.should.containEql('y', 'tmp');
    });

    it('Should work for object declaration', function () {
        var cfg = esgraph(esprima.parse(
            'var x = 1, obj = {p: "prop"};'
        ));
        /// GEN set of the VariableDeclaration node with object initialization
        var genOfDeclare = ReachDefinitions.GEN(cfg[2][1].astNode).values();
        genOfDeclare.length.should.eql(2);
        genOfDeclare.should.containEql('x', 'obj');
    });

    it('Should work for update expression', function () {
        var cfg = esgraph(esprima.parse(
            'var x = 5;\n' +
            'x++;'
        ));
        /// GEN set of the UpdateExpression node
        var genOfUpdate = ReachDefinitions.GEN(cfg[2][2].astNode).values();
        genOfUpdate.length.should.eql(1);
        genOfUpdate.should.containEql('x');
    });
});