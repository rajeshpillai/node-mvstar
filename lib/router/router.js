const { METHODS } = require("http");
const { exec, match, parse } = require("../matchit/match");

class Router {
    constructor(opts) {
        this.opts = opts || {};
        this.routes = {};
        this.handlers = {};
        METHODS.forEach(str => {
            this[str.toLocaleLowerCase()] = this.add.bind(this, str);
            this.handlers[str] = {};
            this.routes[str] = [];
        });
    }

    add (method, pattern, handler) {
        // Save pattern info
        this.routes[method].push(parse(pattern));

        // Save the route handler
        this.handlers[method][pattern] = handler;

        return this; // allow chaining
    }

    find (method, url) {
        let arr = match(url, this.routes[method]);
        if (!arr.length) return false;
        return {
            params: exec(url, arr),
            handler: this.handlers[method][arr[0].old]
        }
    }
}

module.exports = Router;