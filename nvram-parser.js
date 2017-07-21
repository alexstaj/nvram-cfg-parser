// Generated by IcedCoffeeScript 1.8.0-d

/*
format begins with 54 43 46 31 0C
  TCF1 and OC
  then 3 nulls

then key value pairs separated by nulls

format ends with two nulls
  first null normal line end
  second null signifies EOF
 */

(function() {
  var NvramArm, NvramParser, buffertools, fs, iced, isGzip, zlib, __iced_k, __iced_k_noop,
    __slice = [].slice;

  iced = require('iced-runtime');
  __iced_k = __iced_k_noop = function() {};

  fs = require('fs');

  zlib = require('zlib');

  isGzip = require('is-gzip');

  buffertools = require('buffertools');

  NvramArm = require("./nvram-arm-parser");

  NvramParser = (function() {
    function NvramParser() {}

    NvramParser.pretty = false;

    NvramParser.error = function(e) {
      return console.error("error: " + e);
    };

    NvramParser.formatHexString = function(hexstring) {
      return hexstring.toLowerCase().replace(/\s/g, "");
    };

    NvramParser.header = "54 43 46 31 0C 00 00 00";

    NvramParser.footer = "00 00";

    NvramParser.headerbuf = buffertools.fromHex(new Buffer(NvramParser.formatHexString(NvramParser.header)));

    NvramParser.footerbuf = buffertools.fromHex(new Buffer(NvramParser.formatHexString(NvramParser.footer)));

    NvramParser.separator = "\u0000";

    NvramParser.validate = function(buf) {
      var f, h;
      if (!(buf instanceof Buffer)) {
        return "object not a Buffer";
      }
      if (!buffertools.equals((h = buf.slice(0, +(this.headerbuf.length - 1) + 1 || 9e9)), this.headerbuf)) {
        return "header \"" + h + "\" does not match expected NVRAM cfg format -- aborting";
      }
      if (!buffertools.equals((f = buf.slice(-this.footerbuf.length)), this.footerbuf)) {
        return "footer \"" + f + "\" does not match expected NVRAM cfg format -- aborting";
      }
      return true;
    };

    NvramParser.loadFile = function(filename, autocb) {
      var buf, err, file, valid, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = autocb;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      file = fs.readFileSync(filename);
      (function(_this) {
        return (function(__iced_k) {
          if (isGzip(file)) {
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "/home/charles/source/nvram-cfg-parser/src/nvram-parser.iced",
                funcname: "NvramParser.loadFile"
              });
              zlib.gunzip(file, __iced_deferrals.defer({
                assign_fn: (function() {
                  return function() {
                    err = arguments[0];
                    return buf = arguments[1];
                  };
                })(),
                lineno: 51
              }));
              __iced_deferrals._fulfill();
            })(function() {
              return __iced_k((valid = _this.validate(buf)) !== true ? err = valid : void 0);
            });
          } else {
            (function(__iced_k) {
              if (NvramArm.is(file)) {
                (function(__iced_k) {
                  __iced_deferrals = new iced.Deferrals(__iced_k, {
                    parent: ___iced_passed_deferral,
                    filename: "/home/charles/source/nvram-cfg-parser/src/nvram-parser.iced",
                    funcname: "NvramParser.loadFile"
                  });
                  NvramArm.decode(file, __iced_deferrals.defer({
                    assign_fn: (function() {
                      return function() {
                        return buf = arguments[0];
                      };
                    })(),
                    lineno: 54
                  }));
                  __iced_deferrals._fulfill();
                })(__iced_k);
              } else {
                return __iced_k(err = "unrecognized filetype");
              }
            })(__iced_k);
          }
        });
      })(this)((function(_this) {
        return function() {
          if (err) {
            autocb(_this.error(err));
            return;
          }
          autocb(buf);
          return;
        };
      })(this));
    };

    NvramParser.parse = function(buf) {
      var body, bound, eq, key, pair, settings, val;
      body = buf.slice(NvramParser.headerbuf.length, +(-NvramParser.footerbuf.length) + 1 || 9e9);
      bound = 0;
      settings = {};
      while (body.length) {
        bound = buffertools.indexOf(body, NvramParser.separator, 0);
        if (bound > -1) {
          pair = body.slice(0, +(bound - 1) + 1 || 9e9);
          body = body.slice(bound + 1);
        } else {
          return NvramParser.error("format not supported, missing null terminator");
        }
        pair = pair.toString("utf8");
        eq = pair.indexOf("=");
        key = pair.slice(0, +(eq - 1) + 1 || 9e9);
        val = pair.slice(eq + 1);
        settings[key] = val;
      }
      return settings;
    };

    NvramParser.decode = function(filename, autocb) {
      var buf, settings, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = autocb;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(__iced_k) {
        __iced_deferrals = new iced.Deferrals(__iced_k, {
          parent: ___iced_passed_deferral,
          filename: "/home/charles/source/nvram-cfg-parser/src/nvram-parser.iced",
          funcname: "NvramParser.decode"
        });
        NvramParser.loadFile(filename, __iced_deferrals.defer({
          assign_fn: (function() {
            return function() {
              return buf = arguments[0];
            };
          })(),
          lineno: 89
        }));
        __iced_deferrals._fulfill();
      })(function() {
        settings = NvramParser.parse(buf);
        if (NvramParser.pretty) {
          autocb(JSON.stringify(settings, null, 2));
          return;
        } else {
          autocb(JSON.stringify(settings));
          return;
        }
      });
    };

    NvramParser.encode = function(filename, format, autocb) {
      var encoded, json, key, last, pair, pairs, settings, value, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = autocb;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      if (format == null) {
        format = "original";
      }
      json = fs.readFileSync(filename);
      settings = JSON.parse(json);
      pairs = (function() {
        var _results;
        _results = [];
        for (key in settings) {
          value = settings[key];
          pair = new Buffer("" + key + "=" + value);
          _results.push(buffertools.concat(pair, this.separator));
        }
        return _results;
      }).call(NvramParser);
      last = pairs[pairs.length - 1];
      pairs[pairs.length - 1] = last.slice(0, +(-NvramParser.separator.length) + 1 || 9e9);
      (function(__iced_k) {
        switch (format.toLowerCase()) {
          case "original":
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "/home/charles/source/nvram-cfg-parser/src/nvram-parser.iced",
                funcname: "NvramParser.encode"
              });
              NvramParser.encodeOriginal(pairs, __iced_deferrals.defer({
                assign_fn: (function() {
                  return function() {
                    return encoded = arguments[0];
                  };
                })(),
                lineno: 109
              }));
              __iced_deferrals._fulfill();
            })(__iced_k);
            break;
          case "arm":
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "/home/charles/source/nvram-cfg-parser/src/nvram-parser.iced",
                funcname: "NvramParser.encode"
              });
              NvramArm.encode(pairs, __iced_deferrals.defer({
                assign_fn: (function() {
                  return function() {
                    return encoded = arguments[0];
                  };
                })(),
                lineno: 111
              }));
              __iced_deferrals._fulfill();
            })(__iced_k);
            break;
          default:
            autocb(NvramParser.error("format not supported"));
            return;
            return __iced_k();
        }
      })(function() {
        autocb(encoded);
        return;
      });
    };

    NvramParser.encodeOriginal = function(pairs, autocb) {
      var buf, err, fz, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = autocb;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      buf = buffertools.concat.apply(buffertools, [NvramParser.headerbuf].concat(__slice.call(pairs), [NvramParser.footerbuf]));
      (function(__iced_k) {
        __iced_deferrals = new iced.Deferrals(__iced_k, {
          parent: ___iced_passed_deferral,
          filename: "/home/charles/source/nvram-cfg-parser/src/nvram-parser.iced",
          funcname: "NvramParser.encodeOriginal"
        });
        zlib.gzip(buf, __iced_deferrals.defer({
          assign_fn: (function() {
            return function() {
              err = arguments[0];
              return fz = arguments[1];
            };
          })(),
          lineno: 121
        }));
        __iced_deferrals._fulfill();
      })(function() {
        if (err) {
          autocb(NvramParser.error(err));
          return;
        }
        autocb(fz);
        return;
      });
    };

    return NvramParser;

  })();

  module.exports = NvramParser;

}).call(this);
