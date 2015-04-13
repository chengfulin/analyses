/**
 * Created by chengfulin on 2015/4/13.
 */
var ReachDefinitions = require('./reachdefinitions');
var Set = require('../set');

module.exports.LastDEF = function (cfg) {
    'use strict';
    var rd = ReachDefinitions(cfg),
        lastDefs = new Map();
    /// For all nodes
    cfg[2].forEach(function (cfgNode) {
        var lastDefsOfNode = new Map();
        rd.get(cfgNode).values().forEach(function (def) {
            (function recursive(node) {
                if (ReachDefinitions.GEN(node.astNode).values().indexOf(def) !== -1) {
                    var nodes = lastDefsOfNode.get(def) || new Set();
                    nodes.add(node.cfgId);
                    lastDefsOfNode.set(def, nodes);
                } else {
                    node.prev.forEach(recursive);
                }
            }(cfgNode));
        });
        lastDefs.set(cfgNode, lastDefsOfNode);
    });
    return lastDefs;
};