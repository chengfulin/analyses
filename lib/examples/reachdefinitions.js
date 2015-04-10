/**
 * Created by chengfulin on 2015/4/10.
 */
var walkes = require('walkes');
var worklist = require('../');
var Set = require('../set');

module.exports = ReachDefinitions;

function ReachDefinitions(cfg) {
    'use strict';
    return worklist(cfg, function (input) {
        if (this.type || !this.astNode)
            return input;
        var kill = this.kill = this.kill || ReachDefinitions.KILL(this.astNode);
        var generate = this.generate = this.generate || ReachDefinitions.GEN(this.astNode);
        return Set.union(Set.minus(input, kill), generate);
    }, {direction: 'forward'});
}

/**
 * Get KILL set
 * @param astNode
 * @returns Set of variable whose definition was defined in astNode
 * @constructor
 */
ReachDefinitions.KILL = function (astNode) {
    'use strict';
    var variables = new Set();
    walkes(astNode, {
        Program: function () {},
        AssignmentExpression: function (node, recurse) {
            recurse(node.left);
            if (node.right.type === 'AssignmentExpression') {
                recurse(node.right);
            }
        },
        FunctionDeclaration: function () {},
        FunctionExpression: function () {},
        VariableDeclaration: function () {},
        VariableDeclarator: function () {},
        Identifier: function (node) {
            variables.add(node.name);
        }
    });
    return variables;
};

/**
 * Get GEN set
 * @param astNode
 * @returns Set of variable whose definition was not killed in astNode
 * @constructor
 */
ReachDefinitions.GEN = function (astNode) {
    'use strict';
    var variables = new Set();
    walkes(astNode, {
        Program: function () {},
        AssignmentExpression: function () {},
        FunctionDeclaration: function () {},
        FunctionExpression: function () {},
        VariableDeclaration: function (node, recurse) {
            node.declarations.forEach(function (elem) {
                recurse(elem);
            });
        },
        VariableDeclarator: function (node, recurse) {
            recurse(node.id);
        },
        Identifier: function (node) {
            variables.add(node.name);
        }
    });
    return variables;
};

