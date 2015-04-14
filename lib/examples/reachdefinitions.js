/**
 * Created by chengfulin on 2015/4/10.
 */
var walkes = require('walkes'),
    worklist = require('../'),
    Set = require('../set'),
    DFA = require('./dfa');

module.exports = ReachDefinitions;

function ReachDefinitions(cfg) {
    'use strict';
    /// Transfer function of ReachDefinition algorithm with Work list algorithm
    /// input ReachIn set of current node
    /// output ReachOut set of current node
    return worklist(cfg, function (input) {
        if (this.type || !this.astNode)
            return input;
        var kill = this.kill = this.kill || DFA.KILL(this.astNode);
        var generate = this.generate = this.generate || DFA.GEN(this.astNode);
        return Set.union(Set.minus(input, kill), generate);
    }, {direction: 'forward'});
}

