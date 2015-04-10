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
        /// KILL set of the entry node should be empty set
        ReachDefinitions.KILL(cfg[0].astNode).values().length.should.eql(0);
        /// KILL set of the exit node should be empty set
        ReachDefinitions.KILL(cfg[1].astNode).values().length.should.eql(0);
        /// KILL set of the AssignmentExpression node
        ReachDefinitions.KILL(cfg[2][2].astNode).values().should.containEql('x');
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
        ReachDefinitions.GEN(cfg[2][1].astNode).values().should.containEql('x', 'y', 'tmp');
    });
});