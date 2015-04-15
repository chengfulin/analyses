/**
 * Simple structure of DUPair
 * Created by chengfulin on 2015/4/15.
 */

module.exports = DUPair;

/**
 * Create a DUPair with locations of def-use (if only)
 * @param def property of last-def location
 * @param use property of use location
 * @constructor
 */
function DUPair(def, use) {
    this.def = def;
    this.use = use;
}

/**
 * Setter and getter for 'def' property
 * @param def
 * @returns current 'def' property
 */
DUPair.prototype.def = function (def) {
    if (!!def) {
        this.def = def;
    }
    return this.def;
};

/**
 * Setter and getter for 'use' property
 * @param use
 * @returns current 'use' property
 */
DUPair.prototype.use = function (use) {
    if (!!use) {
        this.use = use;
    }
    return this.use;
};