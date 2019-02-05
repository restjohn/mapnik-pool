const fs = require('fs');
const os = require('os');
const path = require('path');
const pools = require('generic-pool');

const N_CPUS = os.cpus().length;
const defaultOptions = { size: 256 };
const defaultMapOptions = {};

class Factory {

    constructor(mapnik, style, options, mapOptions) {
        this.mapnik = mapnik;
        this.style = style;
        this.options = Object.freeze(
            Object.assign({}, defaultOptions, options));
        this.mapOptions = Object.freeze(
            Object.assign({}, defaultMapOptions, mapOptions));
    }

    create() {
        const map = new this.mapnik.Map(this.options.size, this.options.size);
        const mapFromString = (xml) => {
            return new Promise((resolve, reject) => {
                map.fromString(xml, this.mapOptions, err => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        if (this.options.bufferSize) {
                            map.bufferSize = this.options.bufferSize;
                        }
                        resolve(map);
                    }
                });
            });
        };
        if (typeof this.style == 'string') {
            return mapFromString(this.style);
        }
        return new Promise((resolve, reject) => {
            let stylePath = path.resolve(this.style.dir, this.style.name + this.style.ext);
            fs.readFile(stylePath, 'utf8', (err, content) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(content);
                }
            });
        })
        .then(mapFromString);
    }

    destroy(map) {
        return new Promise((resolve, reject) => {
            try {
                map.clear();
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = function(mapnik) {
    return {
        fromStylePath: function(stylePath, initOptions, mapOptions) {
            mapOptions = mapOptions || {};
            stylePath = path.parse(path.resolve(stylePath));
            if (!mapOptions.base) {
                mapOptions.base = stylePath.dir;
            }
            const factory = new Factory(
                mapnik, stylePath, initOptions, mapOptions);
            return pools.createPool(factory, { max: N_CPUS });
        },
        fromStyleXML: function fromStyleXML(xml, initOptions, mapOptions) {
            const factory = new Factory(mapnik, xml, initOptions, mapOptions);
            return pools.createPool(factory, { max: N_CPUS });
        }
    };
};

module.exports.genericPool = pools;
