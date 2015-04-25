# Router-Core
A simple Javascript router for client and server side url based routing.

## Setting up Router.js
### Client-Side

To use Router.js in the browser, you'll need the latest v1 release of [q](https://github.com/kriskowal/q) included in a script tag on your page. After that, you need to do the same for Router.js. For example:
```HTML
<script src="path/to/libs/q.js"></script>
<script src="path/to/libs/Router.js"></script>
```

Router.js will be available through the global Router object.

### Server-Side

Router-Core can be installed via NPM by running `npm install --save bp-router-core`. After that, you can simply require the module. For example:
```javascript
var Router = require("bp-router-core");
```

## Using Router.js
### Creating a Router

To start off, you'll need a router object. This is the core interface between third party code and the routing logic. Simply invoking `new Router()` will create a router object. There are no parameters, as there are currently no advanced features supported by Router.js.

### Adding routes

To get the router to execute code, you need to attach functions to routes. A route consists of three things:
* Method - This is the HTTP verb that the router will use to determine what routes to execute. This value can be any string and is case sensitive.
* Path - The url that defines this route. This value can either be a regular expression that will be used to match against the current url, or it can be a string. In the case of the string, it must match the current url exactly with one exception. Any segment of the url that is prefixed with a colon will be used as a parameter wild card, with the appropriate value in the current url being added to the req.params object. For example, the path `"/user/profile/:id"` will match the url `/user/profile/123456`, and the req.params object will contain the key/value pair `id: "123456"`.
* Function - This is the function that will be executed if this route matches the current url. It will be given three parameters, although only two will commonly be needed. The first two are the request and response objects which are used to pass information along the chain of routes, while the third is the `next` function, used to properly exit from the route. By calling `return next();`, control will be passed to the next route in the stack. This is only needed if there is an instance in which the function might need to end prematurely, as the router takes care of this if the function exits naturally (reaches the end without returning anything). The alternative to returning `next` is to return a q promise object, which should in turn resolve with the request and response objects.

The Method can be ommited in order to apply the function to every matching url.

An example of adding a route would be
```Javascript
var rot = new Router();
rot.use("GET", "/user/profile/:id", function(req, res) {
  console.log("Looking for user " + req.params.id);
});
```
### Dispatching Routes
The second piece of the puzzle is actually dispatching the routes to the router. There are four things that need to be given to the `Router.route` function;
* Method - The HTTP verb that the router will attempt to handle. This basically acts as a category filter for routes.
* Path - The url that is currently being handled
* Request - An object that should hold all of the incoming data for this dispatch. This and Request are named to be analagous to the Node incoming/outgoing streams for a HttpServer, but do not neccesarily have to be
* Response - An object that should be use to hold/send data responding to the dispatch

Continuing the earlier example, a GET request for the profile of user 123456 would be dispatched like so:
```Javascript
rot.route("GET", "/user/profile/123456", ServerReqObj, ServerResObj);
```
Where the last two parameters are acquired from whichever server framework is being used.

## Full Example
```Javascript
var Router = require("bp-router-core"),
    router = new Router();

// Catch every request to log them
router.use(/.*/, function(req, res){
  console.log(req.method + " request for page " + req.path);
}

router.use("GET", "/users", function(req, res){
  displayListOfUsers();
}

router.use("POST", "/users", function(req, res){
  createNewUser();
}

router.route(getMethod(), getPath(), ServerReqObj, ServerResObj);
```
