/**
 * Created by chengfulin on 2015/4/15.
 */
module.exports = Def;

function Def(name, from) {
    this.name = name;
    this.from = from;
}

Def.prototype.name = function (name) {
    if (!!name) {
        this.name = name;
    }
    return name;
};

Def.prototype.from = function (from) {
    if (!!from) {
        this.from = from;
    }
    return from;
};