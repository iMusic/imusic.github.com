var modules = {};

function require(ids, callback) {
    var module, defs = [];

    for (var i = 0; i < ids.length; ++i) {
        module = modules[ids[i]] || resolve(ids[i]);
        if (!module) {
            throw 'module definition dependecy not found: ' + ids[i];
        }

        defs.push(module);
    }

    callback.apply(null, defs);
}

function define(id, dependencies, definition) {
    if (typeof id !== 'string') {
        throw 'invalid module definition, module id must be defined and be a string';
    }

    if (dependencies === undefined) {
        throw 'invalid module definition, dependencies must be specified';
    }

    if (definition === undefined) {
        throw 'invalid module definition, definition function must be specified';
    }

    require(dependencies, function() {
        modules[id] = definition.apply(null, arguments);
    });
}

function defined(id) {
    return !!modules[id];
}

function resolve(id) {
    var target = exports;
    var fragments = id.split(/[.\/]/);

    for (var fi = 0; fi < fragments.length; ++fi) {
        if (!target[fragments[fi]]) {
            return;
        }

        target = target[fragments[fi]];
    }

    return target;
}

function expose(ids) {
    for (var i = 0; i < ids.length; i++) {
        var target = exports;
        var id = ids[i];
        var fragments = id.split(/[.\/]/);

        for (var fi = 0; fi < fragments.length - 1; ++fi) {
            if (target[fragments[fi]] === undefined) {
                target[fragments[fi]] = {};
            }

            target = target[fragments[fi]];
        }

        target[fragments[fragments.length - 1]] = modules[id];
    }
}



var Fs = {
    version: 0.1,
    releaseDate: '2014-08-18',
    _init: function () {
        var t = this, doc = document, win = window, na = navigator, ua = userAgent, i, nl, n, base, p, v;
        // Browser checks
        t.isOpera = window.opera && opera.buildNumber;
        t.isWebKit - /Webkit/.test(ua);
        t.isGecko = !t.isWebKit && /Gecko/.test(ua);
        t.isMac = ua.indexOf('Mac') > -1;
        t.isIE = !t.isWebKit && !t.isOpera && (/MSIE/gi).test(ua) && (/Explorer/gi).test(na.appName);
        t.isIE6 = t.isIE && /MSIE [56]/.test(ua);
    },

    is: function (o, t) {
        var n = typeof(o);
        if (!t) {
            return n != 'undefined';
        }

        if (t == 'array' && (o instanceof Array)) {
            return true;
        }

        return n === t;
    },

    create: function (s, p) {
        var t = this, sp, ns, cn, scn, c, de = 0;
        s = /^((static) )?([\w.]+)(:([\w.]+))?/.exec(s);
        cn = s[3].match(/(^|\.)(\w+)$/i)[2];
        ns = t.ns(s[3].replace(/\.\w+$/, ''));
        if (ns[cn])
            return;
        if (s[2] == 'static') {
            ns[cn] = p;
            return;
        }
        if (!p[cn]) {
            p[cn] = function () {};
            de = 1;
        }
        ns[cn] = p[cn];
        t.extend(ns[cn].prototype, p);
        if (s[5]) {
            sp = t.convert(s[5]).prototype;
            scn = s[5].match(/\.(\w+)$/i)[1];
            c = ns[cn];
            if (de) {
                ns[cn] = function () {
                    return sp[scn].apply(this, arguments);
                };
            } else {
                ns[cn] = function () {
                    this.superclass = sp[scn];
                    return c.apply(this, arguments);
                };
            }
            ns[cn].prototype[cn] = ns[cn];
            t.each(sp, function (f, n) {
                ns[cn].prototype[n] = sp[n];
            });
            t.each(p, function (f, n) {
                if (sp[n]) {
                    ns[cn].prototype[n] = function () {
                        this.superclass = sp[n];
                        return f.apply(this, arguments);
                    };
                } else {
                    if (n != cn)
                        ns[cn].prototype[n] = f;
                }
            });
        }
        t.each(p['static'], function (f, n) {
            ns[cn][n] = f;
        });
    },
    extend: function (constructor, prototype) {
        var c = constructor || function(){};
        var p = prototype || {};    
        return function() {
            for(var atr in p) {
                arguments.callee.prototype[atr] = p[atr];
            }           
            c.apply(this,arguments);
        }
    }
};

Fs.ev = {
    format: function(str, param) {
        var data = param.length == 1 && typeof param[0] == "object" ? param[0] : param;
        return str.replace(/\{([\d\w]+)\}/g, function(m, n) {
            return typeof data[n] != "undefined" ? data[n].toString() : m;
        });
    }
}

Fs.ui = {
    Popup: function (args) {
        this.type = args.type || 'm-succ';
        this.text = args.text || 'text';
 
        this.constructor.prototype.init = function () {
            

            var popup = document.createElement('div');
            popup.id = 'popup_' + new Date().getTime();
            popup.className = 'popup-box';
            popup.innerHTML = Fs.ev.format(tml, {
                type: this.type,
                text: this.text
            });
            document.body.appendChild(popup);
        }

        this.init();
    }
}