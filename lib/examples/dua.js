/**
 * Created by chengfulin on 2015/4/15.
 */
var DFA = require('./dfa'),
    RD = require('./reachdefinitions'),
    Set = require('../set'),
    DUPair = require('./dupair');

module.exports.DUPairs = function (cfg) {
    'use strict';
    /// 1. get RD of the node
    /// 2. get USE of the node
    /// 3. get intersection of RD and USE
    /// 4. get LastDEFs of each element in the intersection
    var duPair = new DUPair(),
        RDs = RD(cfg),
        dupairs = new Map();
    cfg[2].forEach(function (node) {
        var nodeRD = RDs.get(node),
            nodeUSE = DFA.USE(node),
            nodeActualUsed = Set.intersect(nodeRD, nodeUSE);
        /// Initialization
        nodeRD.values().forEach(function (elem) {
            var pairs = dupairs.get(elem) || new Set();
            dupairs.set(elem, pairs);
        });
        nodeActualUsed.values().forEach(function (elem) {
            var pairs = dupairs.get(elem);
            DFA.LastDEFs(node, elem).values().forEach(function (nodeId) {
                pairs.add(new DUPair(nodeId, node.cfgId));
            });
            dupairs.set(elem, pairs);
        });
    });
    return dupairs;
};