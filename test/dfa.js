/**
 * Created by chengfulin on 2015/4/13.
 */
var DFA = require('../lib/examples/dfa'),
    Set = require('../lib/set'),
    cfgext = require('../lib/examples/cfgext');

describe('DFA', function () {
    it('should work for variable declaration only', function () {
        var cfg = cfgext.getCFG('var x = 55, y = 10, tmp = 0;\n');
        /// Get last def of 'x' at 'n1'
        DFA.LastDEFs(cfg[2][1], 'x').values().should.eql([1]);
        /// Get last def of 'y' at 'n1'
        DFA.LastDEFs(cfg[2][1], 'y').values().should.eql([1]);
        /// Get last def of 'tmp' at 'n1'
        DFA.LastDEFs(cfg[2][1], 'tmp').values().should.eql([1]);
    });

    it('should work for redefinition', function () {
        var cfg = cfgext.getCFG(
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
        var cfg = cfgext.getCFG(
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

    it('should work with switch', function () {
        var cfg = cfgext.getCFG(
            'var test = 3, out;\n' +
            'switch (test) {\n' +
            'case 1:\n' +
                'out = test;\n' +
                'break;\n' +
            'case 2:\n' +
                'out = test * test;\n' +
                'break;\n' +
            'case 3:\n' +
                'out = test * test * test;\n' +
                'break;\n' +
            'case 4:\n' +
            'case 5:\n' +
                'out = 0;\n' +
                'break;\n' +
            'default:\n' +
                'out = -1;\n' +
            '}\n' +
            'var tmp = out;'
        );
        /// define 'out' in case '1'
        cfg[2][2].astNode.test.value.should.eql(1);
        DFA.LastDEFs(cfg[2][3], 'out').values().should.eql([3]);
        DFA.LastDEFs(cfg[2][3], 'test').values().should.eql([1]);
        /// get last def of 'out' at node 'var tmp = out'
        DFA.LastDEFs(cfg[2][4], 'out').values().should.eql([3, 7, 9, 11, 14]);
        DFA.LastDEFs(cfg[2][4], 'test').values().should.eql([1]);
        /// define 'out' in case '2'
        cfg[2][6].astNode.test.value.should.eql(2);
        DFA.LastDEFs(cfg[2][7], 'out').values().should.eql([7]);
        /// define 'out' in case '3'
        cfg[2][8].astNode.test.value.should.eql(3);
        DFA.LastDEFs(cfg[2][9], 'out').values().should.eql([9]);
        /// define 'out' in case '4'
        cfg[2][10].astNode.test.value.should.eql(4);
        /// define 'out' in case '5'
        cfg[2][12].astNode.test.value.should.eql(5);
        DFA.LastDEFs(cfg[2][11], 'out').values().should.eql([11]);
        /// define 'out' in 'default' case
        DFA.LastDEFs(cfg[2][14], 'out').values().should.eql([14]);
    });

    it('should work for update expression', function () {
        var cfg = cfgext.getCFG(
            'var x = 5;\n' +
            '++x;'
        );
        /// Get last def of 'x' at node '++x'
        DFA.LastDEFs(cfg[2][2], 'x').values().should.eql([2]);
    });

    it('should work for object property assignment', function () {
        var cfg = cfgext.getCFG(
            'var obj = {};\n' +
            'obj.prop = 123;'
        );
        /// Get last def of 'obj' at node 'obj.prop = 123'
        DFA.LastDEFs(cfg[2][2], 'obj').values().should.eql([2]);
    });

    it('should work for loops', function () {
        var cfg = cfgext.getCFG(
            'var x = 5, y = 0;\n' +
            'while(x > 0) {\n' +
                'y += x;\n' +
                '--x;\n' +
                'var z = x;\n' +
            '}'
        );
        /// Get the last def of 'x' at node 'while(x > 0)'
        var lastDefN2 = DFA.LastDEFs(cfg[2][2], 'x').values();
        lastDefN2.length.should.eql(2);
        lastDefN2.should.containEql(1, 4);
        /// Get the last def of 'x' at node 'y += x'
        var lastDefN3 = DFA.LastDEFs(cfg[2][3], 'x').values();
        lastDefN3.length.should.eql(2);
        lastDefN3.should.containEql(1, 4);
        /// Get the last def of 'y' at node 'while(x > 0)'
        DFA.LastDEFs(cfg[2][3], 'y').values().should.eql([3]);
        /// Get the last def of 'z' at node 'var z = x'
        DFA.LastDEFs(cfg[2][5], 'z').values().should.eql([5]);
    });
});

describe('KILL set', function () {
    it('should work for declaration only', function () {
        var cfg = cfgext.getCFG(
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
        var cfg = cfgext.getCFG(
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
        var cfg = cfgext.getCFG(
            'var x = 5;\n' +
            '++x;'
        );
        /// KILL set of UpdateExpression node
        DFA.KILL(cfg[2][2].astNode).values().should.eql(['x']);
    });

    it('should work for object property assignment', function () {
        var cfg = cfgext.getCFG(
            'var obj = {};\n' +
            'obj.prop = 123;'
        );
        /// KILL set of the AssignmentExpression of object MemberExpression
        DFA.KILL(cfg[2][2].astNode).values().should.eql(['obj']);
    });

    it('should work for branches', function () {
        var cfg = cfgext.getCFG(
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
        var cfg = cfgext.getCFG(
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

    it('should work with switch', function () {
        var cfg = cfgext.getCFG(
            'var test = 3, out;\n' +
            'switch (test) {\n' +
            'case 1:\n' +
                'out = test;\n' +
                'break;\n' +
            'case 2:\n' +
                'out = test * test;\n' +
                'break;\n' +
            'case 3:\n' +
                'out = test * test * test;\n' +
                'break;\n' +
            'case 4:\n' +
            'case 5:\n' +
                'out = 0;\n' +
                'break;\n' +
            'default:\n' +
                'out = -1;\n' +
            '}\n' +
            'var tmp = out;'
        );
        /// define 'out' in case '1'
        cfg[2][2].astNode.test.value.should.eql(1);
        DFA.KILL(cfg[2][3].astNode).values().should.eql(['out']);
        /// define 'out' in case '2'
        cfg[2][6].astNode.test.value.should.eql(2);
        DFA.KILL(cfg[2][7].astNode).values().should.eql(['out']);
        /// define 'out' in case '3'
        cfg[2][8].astNode.test.value.should.eql(3);
        DFA.KILL(cfg[2][9].astNode).values().should.eql(['out']);
        /// define 'out' in case '4'
        cfg[2][10].astNode.test.value.should.eql(4);
        /// define 'out' in case '5'
        cfg[2][12].astNode.test.value.should.eql(5);
        DFA.KILL(cfg[2][11].astNode).values().should.eql(['out']);
        /// define 'out' in 'default' case
        DFA.KILL(cfg[2][14].astNode).values().should.eql(['out']);
    });
});

describe('GEN set', function () {
    it('should work for declaration only', function () {
        var cfg = cfgext.getCFG(
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
        var cfg = cfgext.getCFG(
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
        var cfg = cfgext.getCFG(
            'var x = 1, obj = {p: "prop"};'
        );
        /// GEN set of the VariableDeclaration node with object initialization
        DFA.GEN(cfg[2][1].astNode).values().should.eql(['x', 'obj']);
    });

    it('should work for object property assignment', function () {
        var cfg = cfgext.getCFG(
            'var obj = {};\n' +
            'obj.prop = 123;'
        );
        /// GEN set of the AssignmentExpression of object MemberExpression
        DFA.GEN(cfg[2][2].astNode).values().should.eql(['obj']);
    });


    it('should work for update expression', function () {
        var cfg = cfgext.getCFG(
            'var x = 5;\n' +
            'x++;'
        );
        /// GEN set of the UpdateExpression node
        DFA.GEN(cfg[2][2].astNode).values().should.eql(['x']);
    });

    it('should work for branches', function () {
        var cfg = cfgext.getCFG(
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
        var cfg = cfgext.getCFG(
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

    it('should work with switch', function () {
        var cfg = cfgext.getCFG(
            'var test = 3, out;\n' +
            'switch (test) {\n' +
            'case 1:\n' +
                'out = test;\n' +
                'break;\n' +
            'case 2:\n' +
                'out = test * test;\n' +
                'break;\n' +
            'case 3:\n' +
                'out = test * test * test;\n' +
                'break;\n' +
            'case 4:\n' +
            'case 5:\n' +
                'out = 0;\n' +
                'break;\n' +
            'default:\n' +
                'out = -1;\n' +
            '}\n' +
            'var tmp = out;'
        );
        cfg[2][2].astNode.test.value.should.eql(1);
        DFA.GEN(cfg[2][3].astNode).values().should.eql(['out']);
        /// define 'out' in case '2'
        cfg[2][6].astNode.test.value.should.eql(2);
        DFA.GEN(cfg[2][7].astNode).values().should.eql(['out']);
        /// define 'out' in case '3'
        cfg[2][8].astNode.test.value.should.eql(3);
        DFA.GEN(cfg[2][9].astNode).values().should.eql(['out']);
        /// define 'out' in case '4'
        cfg[2][10].astNode.test.value.should.eql(4);
        /// define 'out' in case '5'
        cfg[2][12].astNode.test.value.should.eql(5);
        DFA.GEN(cfg[2][11].astNode).values().should.eql(['out']);
        /// define 'out' in 'default' case
        DFA.GEN(cfg[2][14].astNode).values().should.eql(['out']);
    });
});

describe('USE set', function () {
    it('should work for declaration only', function () {
        var cfg = cfgext.getCFG(
            'var x = 55, y = 10, tmp = 0;\n' +
            'var z = x;\n' +
            'var q = z = y;'
        );
        /// USE should be empty when declaration with literals
        DFA.USE(cfg[2][1].astNode).values().should.be.empty;
        /// when initialized with another variable
        var n2USE = DFA.USE(cfg[2][2]).values();
        n2USE.length.should.eql(1);
        n2USE.should.containEql('x');
        /// when chained with other variables
        var n3USE = DFA.USE(cfg[2][3]).values();
        n3USE.length.should.eql(2);
        n3USE.should.containEql('z', 'y');
    });

    it('should work for redefinition', function () {
        var cfg = cfgext.getCFG(
            'var x = 55, y = 10, tmp = 0;\n' +
            'x = 66;\n' +
            'y = tmp = 1;'
        );
        /// USE should be empty as redefined by literal value
        DFA.USE(cfg[2][2]).values().should.be.empty;
        /// variable should be used when used as assignment
        DFA.USE(cfg[2][3]).values().should.eql(['tmp']);
    });

    it('should work for object property assignment', function () {
        var cfg = cfgext.getCFG(
            'var out, obj = {prop: 123};\n' +
            'out = obj.prop;'
        );
        /// object should be used when object property used as assignment
        DFA.USE(cfg[2][2]).values().should.eql(['obj']);
    });

    it('should work for update expression', function () {
        var cfg = cfgext.getCFG(
            'var x = 5;\n' +
            'x++;'
        );
        /// update expression should in USE
        DFA.USE(cfg[2][2]).values().should.eql(['x']);
    });

    it('should work for branches', function () {
        var cfg = cfgext.getCFG(
            'var x = 20, y = 5;\n' +
            'if (x > y) {\n' +
                'var z = 10;' +
                'x = x % y;\n' +
            '} else {\n' +
                'y = x;\n' +
            '}'
        );
        /// n2 has p-uses {x, y}
        DFA.USE(cfg[2][2]).values().should.eql(['x','y']);
        /// binary expression in one branch
        DFA.USE(cfg[2][4]).values().should.eql(['x', 'y']);
        /// assignment in another branch
        DFA.USE(cfg[2][5]).values().should.eql(['x']);
    });

    it('should work for loops', function () {
        var cfg = cfgext.getCFG(
            'var x = 5, y = 0;\n' +
            'while(x > 0) {\n' +
                'y += x;\n' +
                '--x;\n' +
                'var z = x;\n' +
            '}'
        );
        /// p-use in while statement
        DFA.USE(cfg[2][2]).values().should.eql(['x']);
        /// increment in loop
        DFA.USE(cfg[2][3]).values().should.eql(['y', 'x']);
    });

    it('should work for call expression', function () {
        var cfg = cfgext.getCFG(
            'var argu;\n' +
            'obj.method(argu);\n' +
            'fun(argu);'
        );
        var n2USE = DFA.USE(cfg[2][2]).values();
        n2USE.length.should.eql(2);
        /// the object which owns called method should be in USE
        n2USE.should.containEql('obj');
        /// passed argument should be in USE
        n2USE.should.containEql('argu');
        var n3USE = DFA.USE(cfg[2][3]).values();
        n3USE.length.should.eql(2);
        /// the callee function should be in USE
        n3USE.should.containEql('fun');
        /// passed argument should be in USE
        n3USE.should.containEql('argu');
    });

    it('should work with switch', function () {
        var cfg = cfgext.getCFG(
            'var test = 3, out;\n' +
            'switch (test) {\n' +
            'case 1:\n' +
                'out = test;\n' +
                'break;\n' +
            'case 2:\n' +
                'out = test * test;\n' +
                'break;\n' +
            'case 3:\n' +
                'out = test * test * test;\n' +
                'break;\n' +
            'case 4:\n' +
            'case 5:\n' +
                'out = 0;\n' +
                'break;\n' +
            'default:\n' +
                'out = -1;\n' +
            '}\n' +
            'var tmp = out;'
        );
        /// variable 'test' should be used in each switch case node
        /// switch case 1
        cfg[2][2].astNode.test.value.should.eql(1);
        DFA.USE(cfg[2][2]).values().should.eql(['test']);
        /// switch case 2
        cfg[2][6].astNode.test.value.should.eql(2);
        DFA.USE(cfg[2][6]).values().should.eql(['test']);
        /// switch case 3
        cfg[2][8].astNode.test.value.should.eql(3);
        DFA.USE(cfg[2][8]).values().should.eql(['test']);
        /// switch case 4
        cfg[2][10].astNode.test.value.should.eql(4);
        /// switch case 5
        cfg[2][12].astNode.test.value.should.eql(5);
        DFA.USE(cfg[2][10]).values().should.eql(['test']);
        DFA.USE(cfg[2][12]).values().should.eql(['test']);
        /// variable used in consequence of switch case
        /// in case 1
        DFA.USE(cfg[2][3]).values().should.eql(['test']);
        /// in case 2
        DFA.USE(cfg[2][7]).values().should.eql(['test']);
        /// in case 3
        DFA.USE(cfg[2][9]).values().should.eql(['test']);
        /// in case 4, 5
        DFA.USE(cfg[2][11]).values().should.be.empty;
        /// variable used outside the switch
        DFA.USE(cfg[2][4]).values().should.eql(['out']);
    });
});