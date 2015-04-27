/*global Q, module, require */
/*jslint nomen: true */

(function (q) {
    'use strict';
    var Router,
        next,
        callRoute,
        callError,
        matchRoute,
        escapeRegex,
        paramatise;

    next = function () {
        return arguments;
    };

    callRoute = function callRoute(func, req, res) {
        var boundNext = next.bind(func, req, res);
        return func.call(func, req, res, boundNext) || boundNext();
    };

    callError = function callError(func, req, res, error) {
        var boundNext = next.bind(func, req, res, error);
        return func.call(func, req, res, boundNext) || boundNext();
    };

    matchRoute = function (path, element) {
        var elPath = element.path;
        if (!elPath.regex || !elPath.regex.test) {
            throw new SyntaxError("Paths should be precompiled. " + elPath + " is not in the correct format");
        }
        return elPath.regex.test(path);
    };

    /**
     * Standard escape function by/from MDN
     * https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
     */
    escapeRegex = function (str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    paramatise = function (path, test, req) {
        var capture = test.regex.exec(path),
            i,
            len;
        req.params = {};
        for (i = 0, len = test.params.length; i < len; i += 1) {
            req.params[test.params[i]] = capture[i + 1];
        }
    };

    Router = function () {
        var self = this;
        this.routes = {};

        this._addRoute = function _addRoute(isError, method, path, func) {
            var regex,
                i,
                len,
                pathsplit,
                paramCapture = "\\/((?:\\S(?!\\/))*\\S)",
                compiledPath;

            if (func == null) { // This *should* indicate a blank method, e.g. all paths
                func = path;
                path = method;
                method = "ALL";
            }

            self.method(method);

            pathsplit = (path.charAt(0) === '/' ? path.substr(1) : path).split("/");

            if (typeof path === RegExp) {
                compiledPath = {regex: path, params: []};
            } else {
                compiledPath = {params: []};
                regex = "^";
                for (i = 0, len = pathsplit.length; i < len; i += 1) {
                    if (pathsplit[i].charAt(0) === ":") {
                        regex += paramCapture;
                        compiledPath.params.push(pathsplit[i].substr(1));
                    } else {
                        regex += "\\/" + escapeRegex(pathsplit[i]);
                    }
                }
                regex += "$";
                compiledPath.regex = new RegExp(regex);
            }

            self.routes[method].push({path: compiledPath, func: func, error: isError});
        };

        // Attach Middleware To Route
        this.use = this._addRoute.bind(this._addRoute, false);

        // Attach Error Handler At Current End Of Route (Wont Handle Errors In Middleware
        // Applied After It)
        this.error = this._addRoute.bind(this._addRoute, true);

        /**
         * Enable a method in the router without providing any routes
         * @param {String} method The method to add to the router
         */
        this.method = function(method){
            if (!self.routes.hasOwnProperty(method)) {
                self.routes[method] = [];
                self[method.toLowerCase()] = self.use.bind(self.use, method);
            }
        };

        this.route = function route(method, path, req, res) {
            var def = q.defer(),
                i,
                len,
                current,
                all = self.routes.ALL,
                some = self.routes[method],
                middleware = [];
            if (!self.routes.hasOwnProperty(method)) {
                throw new ReferenceError("Router has no METHOD " + method);
            } else {
                middleware = middleware.concat(all.filter(matchRoute.bind(matchRoute, path)));
                middleware = middleware.concat(some.filter(matchRoute.bind(matchRoute, path)));

                for (i = 0, len = middleware.length; i < len; i += 1) {
                    current = middleware[i];
                    if (current.error) {
                        def.promise.catch(callError.bind(callError, current.func, req, res));
                    } else {
                        if (current.path.params.length > 0) {
                            paramatise(path, current.path, req);
                        } else {
                            req.params = {};
                        }
                        def.promise.spread(callRoute.bind(callRoute, current.func));
                    }
                }
            }
            def.resolve([req, res]);
            return def.promise;
        };

        this.method("ALL");
        this.method("GET");
        this.method("POST");
        return this;
    };
    if (typeof module !== "undefined" && module.exports) {
        module.exports = Router;
    } else {
        window.Router = Router;
    }
}(typeof Q !== "undefined" ? Q : require("q")));
