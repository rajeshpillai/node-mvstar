NOTE:
=================
This library is inspired from the excellent code at https://github.com/lukeed/polka
Infact the initial code is almost same, but will change over a period of time.

const mvstar = require('mvstar');

function one(req, res, next) {
  req.hello = 'world';
  next();
}

function two(req, res, next) {
  req.foo = '...needs better demo 😔';
  next();
}

mvstar()
  .use(one, two)
  .get('/users/:id', (req, res) => {
    console.log(`~> Hello, ${req.hello}`);
    res.end(`User: ${req.params.id}`);
  })
  .listen(3000).then(_ => {
    console.log(`> Running on localhost:3000`);
  });
API
mvstar extends Trouter which means it inherits its API, too!

use(...fn)
Attach middleware(s) and/or sub-application(s) to the server. These will execute before your routes' handlers.

fn
Type: Function|Array

You may pass one or more functions at a time. Each function must have the standardized (req, res, next) signature.

Please see Middleware and Express' middleware examples for more info.

parse(req)
Returns: Object

This is an alias of the awesome parseurl module. There are no mvstar-specific changes.

start(port, hostname)
Returns: Promise

Wraps the native server.listen with a Promise, rejecting on any error.

listen(port, hostname)
Returns: Promise

This is an alias of start.

send(res, code, body, type)
A minimal helper that terminates the ServerResponse with desired values.

res
Type: ServerResponse

code
Type: Number
Default: 200

body
Type: String
Default: http.STATUS_CODES[code]

Returns the default statusText for a given code.

type
Type: String
Default: 'text/plain'

The Content-Type header value for the response.

handler(req, res, parsed)
The main mvstar ClientRequest handler. It receives all requests and tries to match the incoming URL against known routes.

If the req.url is not matched, a (501) Not Implemented response is returned. Otherwise, all middleware will be called. At the end of the loop, the (user-defined) route handler will be executed — assuming that a middleware hasn't already returned a response or thrown an error!

req
Type: ClientRequest

res
Type: ServerResponse

parsed
Type: Object

Optionally provide a parsed URL object. Useful if you've already parsed the incoming path. Otherwise, app.parse (aka parseurl) will run by default.

Routing
Routes are used to define how an application responds to varying HTTP methods and endpoints.

If you're coming from Express, there's nothing new here!
However, do check out Comparisons for some pattern changes.

Basics
Each route is comprised of a path pattern, a HTTP method, and a handler (aka, what you want to do).

In code, this looks like:

app.METHOD(pattern, handler);
wherein:

app is an instance of mvstar
METHOD is any valid HTTP method, lowercased
pattern is a routing pattern (string)
handler is the function to execute when pattern is matched
Also, a single pathname (or pattern) may be reused with multiple METHODs.

The following example demonstrates some simple routes.

const app = mvstar();

app.get('/', (req, res) => {
  res.end('Hello world!');
});

app.get('/users', (req, res) => {
  res.end('Get all users!');
});

app.post('/users', (req, res) => {
  res.end('Create a new User!');
});

app.put('/users/:id', (req, res) => {
  res.end(`Update User with ID of ${req.params.id}`);
});

app.delete('/users/:id', (req, res) => {
  res.end(`CY@ User ${req.params.id}!`);
});
Patterns
Unlike the very popular path-to-regexp, mvstar uses string comparison to locate route matches. While faster & more memory efficient, this does also prevent complex pattern matching.

However, have no fear! 💥 All the basic and most commonly used patterns are supported. You probably only ever used these patterns in the first place. 😉

See Comparisons for the list of RegExp-based patterns that mvstar does not support.

The supported pattern types are:

static (/users)
named parameters (/users/:id)
nested parameters (/users/:id/books/:title)
optional parameters (/users/:id?/books/:title?)
any match / wildcards (/users/*)
Parameters
Any named parameters included within your route pattern will be automatically added to your incoming req object. All parameters will be found within req.params under the same name they were given.

Important: Your parameter names should be unique, as shared names will overwrite each other!

app.get('/users/:id/books/:title', (req, res) => {
  let { id, title } = req.params;
  res.end(`User: ${id} && Book: ${title}`);
});
$ curl /users/123/books/Narnia
#=> User: 123 && Book: Narnia
Methods
Any valid HTTP method is supported! However, only the most common methods are used throughout this documentation for demo purposes.

Note: For a full list of valid METHODs, please see this list.

Handlers
Request handlers accept the incoming ClientRequest and the formulating ServerResponse.

Every route definition must contain a valid handler function, or else an error will be thrown at runtime.

Important: You must always terminate a ServerResponse!

It's a very good practice to always terminate your response (res.end) inside a handler, even if you expect a middleware to do it for you. In the event a response is/was not terminated, the server will hang & eventually exit with a TIMEOUT error.

Note: This is a native http behavior.

Async Handlers
If using Node 7.4 or later, you may leverage native async and await syntax! 😻

No special preparation is needed — simply add the appropriate keywords.

const app = mvstar();

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function authenticate(req, res, next) {
  let token = req.getHeader('authorization');
  if (!token) return app.send(res, 401);
  req.user = await Users.find(token); // <== fake
  next(); // done, woot!
}

app
  .use(authenticate)
  .get('/', async (req, res) => {
    // log middleware's findings
    console.log('~> current user', req.user);
    // force sleep, because we can~!
    await sleep(500);
    // send greeting
    res.end(`Hello, ${req.user.name}`);
  });
Middleware
Middleware are functions that run in between (hence "middle") receiving the request & executing your route's handler response.

Coming from Express? Use any middleware you already know & love! 🎉

The middleware signature receives the request (req), the response (res), and a callback (next).

These can apply mutations to the req and res objects, and unlike Express, have access to req.params, req.pathname, req.search, and req.query!

Most importantly, a middleware must either call next() or terminate the response (res.end). Failure to do this will result in a never-ending response, which will eventually crash the http.Server.

// Log every request
function logger(req, res, next) {
  console.log(`~> Received ${req.method} on ${req.url}`);
  next(); // move on
}

function authorize(req, res, next) {
  // mutate req; available later
  req.token = req.getHeader('authorization');
  req.token ? next() : ((res.statusCode=401) && res.end('No token!'));
}

mvstar().use(logger, authorize).get('*', (req, res) => {
  console.log(`~> user token: ${req.token}`);
  res.end('Hello, valid user');
});
$ curl /
# ~> Received GET on /
#=> (401) No token!

$ curl -H "authorization: secret" /foobar
# ~> Received GET on /foobar
# ~> user token: secret
#=> (200) Hello, valid user
In mvstar, middleware functions are mounted globally, which means that they'll run on every request (see Comparisons). Instead, you'll have to apply internal filters to determine when & where your middleware should run.

Note: This might change in mvstar 1.0 :thinking:

function foobar(req, res, next) {
  if (req.pathname.startsWith('/users')) {
    // do something magical
  }
  next();
}
Middleware Errors
If an error arises within a middleware, the loop will be exited. This means that no other middleware will execute & neither will the route handler.

Similarly, regardless of statusCode, an early response termination will also exit the loop & prevent the route handler from running.

There are three ways to "throw" an error from within a middleware function.

Hint: None of them use throw 😹

Pass any string to next()

This will exit the loop & send a 500 status code, with your error string as the response body.

mvstar()
  .use((req, res, next) => next('💩'))
  .get('*', (req, res) => res.end('wont run'));
$ curl /
#=> (500) 💩
Pass an Error to next()

This is similar to the above option, but gives you a window in changing the statusCode to something other than the 500 default.

function oopsies(req, res, next) {
  let err = new Error('Try again');
  err.code = 422;
  next(err);
}
$ curl /
#=> (422) Try again
Terminate the response early

Once the response has been ended, there's no reason to continue the loop!

This approach is the most versatile as it allows to control every aspect of the outgoing res.

function oopsies(req, res, next) {
  if (true) {
    // something bad happened~
    res.writeHead(400, {
      'Content-Type': 'application/json',
      'X-Error-Code': 'Please dont do this IRL'
    });
    let json = JSON.stringify({ error:'Missing CSRF token' });
    res.end(json);
  } else {
    next(); // never called FYI
  }
}
$ curl /
#=> (400) {"error":"Missing CSRF token"}
Benchmarks
A round of mvstar-vs-Express benchmarks across varying Node versions can be found here.

Important: Time is mostly spent in your application code rather than Express or mvstar code!
Switching from Express to mvstar will (likely) not show such drastic performance gains.

Node 8.9.0

Native
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency     2.23ms   98.59us   6.51ms   86.53%
        Req/Sec     5.41k    73.21     5.61k    75.62%
      435050 requests in 10.10s, 43.15MB read
    Requests/sec:  43064.72
    Transfer/sec:      4.27MB

mvstar
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency     2.31ms  138.06us   7.69ms   89.18%
        Req/Sec     5.22k    96.92     5.46k    74.88%
      420120 requests in 10.10s, 41.67MB read
    Requests/sec:  41583.07
    Transfer/sec:      4.12MB

Express
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency     5.36ms  443.33us  11.94ms   65.87%
        Req/Sec     2.25k    69.99     2.42k    71.12%
      178907 requests in 10.01s, 35.49MB read
    Requests/sec:  17877.63
    Transfer/sec:      3.55MB

Fastify
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency     3.00ms  207.92us   9.42ms   58.75%
        Req/Sec     4.01k   123.35     4.32k    65.10%
      322606 requests in 10.10s, 40.00MB read
    Requests/sec:  31930.70
    Transfer/sec:      3.96MB
Comparisons
mvstar's API aims to be very similar to Express since most Node.js developers are already familiar with it. If you know Express, you already know mvstar! 💃

There are, however, a few main differences. mvstar does not support or offer:

Any built-in view/rendering engines.

Most templating engines can be incorporated into middleware functions or used directly within a route handler.

The ability to throw from within middleware.

However, all other forms of middleware-errors are supported. (See Middleware Errors.)

function middleware(res, res, next) {
  // pass an error message to next()
  next('uh oh');

  // pass an Error to next()
  next(new Error('🙀'));

  // send an early, customized error response
  res.statusCode = 401;
  res.end('Who are you?');
}
Response helpers... yet!

Express has a nice set of response helpers. While mvstar relies on the native Node.js response methods, it would be very easy/possible to attach a global middleware that contained a similar set of helpers. (TODO)

The .use() method does not accept a pathname filter.

...This might change before a 1.0 release :thinking:

RegExp-based route patterns.

mvstar's router uses string comparison to match paths against patterns. It's a lot quicker & more efficient.

The following routing patterns are not supported:

app.get('/ab?cd', _ => {});
app.get('/ab+cd', _ => {});
app.get('/ab*cd', _ => {});
app.get('/ab(cd)?e', _ => {});
app.get(/a/, _ => {});
app.get(/.*fly$/, _ => {});
The following routing patterns are supported:

app.get('/users', _ => {});
app.get('/users/:id', _ => {});
app.get('/users/:id?', _ => {});
app.get('/users/:id/books/:title', _ => {});
app.get('/users/*', _ => {});