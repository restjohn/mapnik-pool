const test = require('tape').test,
      mapnik = require('mapnik'),
      genericPool = require('generic-pool');

mapnik.register_default_input_plugins();

var mapnikPool = require('../')(mapnik),
    fs = require('fs');

test('mapnik-pool exposes generic-pool', function(t) {
    t.equal(genericPool, require('../').genericPool);
    t.end();
});

test('from style xml', function(t) {
    const pool = mapnikPool.fromStyleXML(
            fs.readFileSync(__dirname + '/data/map.xml', 'utf8'),
            { bufferSize: 256 }, { base: __dirname + '/data' });

    pool.acquire().then(map => {
        t.pass('acquires a map');
        t.equal(map.bufferSize, 256, 'sets a buffer size');
        t.equal(map.width, 256, 'sets map size');
        t.equal(map.height, 256, 'sets map size');
        return map;
    })
    .then(map => {
        return pool.release(map)
    })
    .then(() => {
        return pool.drain();
    })
    .then(() => {
        return pool.clear();
    })
    .then(() => {
        t.end();
    }, (err) => {
        t.fail(err);
    });
});

test.only('from style file', function(t) {
    const pool = mapnikPool.fromStylePath(__dirname + '/data/map.xml',
        { size: 128, bufferSize: 64 });

    pool.acquire().then(map => {
        t.pass('acquires a map');
        t.equal(map.bufferSize, 64, 'sets a buffer size');
        t.equal(map.width, 128, 'sets map size');
        t.equal(map.height, 128, 'sets map size');
        return map;
    })
    .then(map => {
        return pool.release(map)
    })
    .then(() => {
        return pool.drain();
    })
    .then(() => {
        return pool.clear();
    })
    .then(() => {
        t.end();
    }, (err) => {
        t.fail(err);
    });
});

test('initOptions', function(t) {
    const pool = mapnikPool.fromStylePath(
        __dirname + '/data/map.xml', { size: 1024 });

    pool.acquire(map => {
        t.equal(map.width, 1024, 'use initOptions to set map width');
        t.equal(map.height, 1024, 'use initOptions to set map height');
        return map;
    })
    .then(map => {
        return pool.release(map);
    })
    .then(() => {
        return pool.drain();
    })
    .then(() => {
        return pool.clear();
    })
    .then(t.end, t.fail);
});

// test('passes errors', function(t) {
//     const pool = mapnikPool.fromString('invalid map',
//             { bufferSize: 256 });

//     pool.acquire(function(err, map) {
//         t.ok(err instanceof Error,'expected error');
//         t.ok(!map, 'expected map to be null');
//         pool.drain()
//         .then(() => {
//             return pool.clear();
//         })
//         .then(t.end, t.fail);
//     });
// });
