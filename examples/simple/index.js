const mvstar = require("../../lib/index");

function one(req, res, next) {
    req.hello = 'Hello';
    next();
}

function two(req, res, next) {
    req.foo = '...yet another world..';
    next();
}

mvstar()
    .use(one, two)
    .get("/users/:id", (req, res) => {
        console.log(`-> Hello, ${req.hello}`);
        res.end(`User: ${req.params.id}`);
    })
    .listen(3000).then(_ => {
        console.log(`> Mv* running on localhost:3000`);
    });
