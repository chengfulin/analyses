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
    it('Should work with declaration only', function () {
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

    it('Should work with redefinition', function () {
        var cfg = esgraph(esprima.parse(
            'var x = 55, y = 10, tmp = 0;\n' +
            'x = 66;'
        ));
        /// KILL set of the AssignmentExpression node
        var actual = ReachDefinitions.KILL(cfg[2][2].astNode).values();
        actual.length.should.eql(1);
        actual.should.containEql('x');
    });

    it('Should work with object', function () {
        var cfg = esgraph(esprima.parse(
            'var obj = {};\n' +
            'obj.prop = 123;'
        ));
        /// KILL set of the AssignmentExpression of object MemberExpression
        var actual = ReachDefinitions.KILL(cfg[2][2].astNode).values();
        actual.length.should.eql(1);
        actual.should.containEql('obj');
    });
});

describe('GEN set', function () {
    it('Should work with declaration only', function () {
        var cfg = esgraph(esprima.parse(
            'var x = 55, y = 10, tmp = 0;\n'
        ));
        /// GEN set of the entry node should be empty set
        ReachDefinitions.GEN(cfg[0].astNode).values().length.should.eql(0);
        /// GEN set of the exit node should be empty set
        ReachDefinitions.GEN(cfg[1].astNode).values().length.should.eql(0);
        /// GEN set of the VariableDeclaration node should be empty set
        var actual = ReachDefinitions.GEN(cfg[2][1].astNode).values();
        actual.length.should.eql(3);
        actual.should.containEql('x', 'y', 'tmp');
    });

    it('Should work with redefinition', function () {
        var cfg = esgraph(esprima.parse(
            'var x = 55, y = 10, tmp = 0;\n' +
            'x = 66;'
        ));
        /// GEN set of the AssignmentExpression node should be empty set
        ReachDefinitions.GEN(cfg[2][2].astNode).values().length.should.eql(0);
    });
});