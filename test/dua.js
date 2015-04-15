/**
 * Created by chengfulin on 2015/4/15.
 */
var cfgext = require('../lib/examples/cfgext'),
    DUA = require('../lib/examples/dua'),
    DUPair = require('../lib/examples/dupair');

describe('Def-Use Analysis', function () {
    it('should work for simple example', function () {
        var cfg = cfgext.getCFG(
                'var a = 10, b = 0;\n' +
                'b = a;\n' +
                'a = b * b;\n' +
                'b = a = 0;'
            ),
            dupairs = DUA.DUPairs(cfg);
        ///
        var dupairsOfa = dupairs.get('a').values();
        dupairsOfa.length.should.eql(2);
        dupairsOfa.should.containEql(
            new DUPair(1, 2),
            new DUPair(4, 4)
        );
        ///
        var dupairsOfb = dupairs.get('b').values();
        dupairsOfb.length.should.eql(1);
        dupairsOfb.should.containEql(
            new DUPair(2, 3)
        );
    });
});