# Bluebird Queue
[![npm version](https://badge.fury.io/js/bluebird-queue.svg)](http://badge.fury.io/js/bluebird-queue)

Create promise queues with Bluebird promises. Add concurrency and delays.

## Installation

You know the drill.

```sh
$ npm install bluebird-queue
```

### Constructor Options

#### concurrency
Type: `Integer`
Default 4

The amount of promises that will be simultaneously resolved in order.

#### delay
Type: `Integer`
In milliseconds. Default 0

An optional delay to add to each promise.

#### interval
Type: `Integer`
In milliseconds. Default 0

An optional interval that queued promises will recheck the queue when it is full. The more promises you attempt to queue past concurrency, the more the interval will effect performance.

#### onComplete
Type: `Callback`
Optional.

Is called everytime all items in the queue are processed. The start() method also returns a promise that is resolved on completion.

#### onError
Type: `Callback`
Optional.

Is called everytime there is an error. The start() method also returns a promise that is rejected on error.

### Overview

You can use the queue in two ways:

- Manually adding items with the add() method then calling start() which returns a promise that resolves an array of the resolved queued promises. The add() method will not start resolving queued promises until start() is called.
- Attaching a callback to onComplete and using the addNow() method which will start processing the queue right away.

Starting and using queue is simple. You can add any of the options listed above to the new BlueBirdQueue constructor 
which takes an object.

``` js
var BlueBirdQueue = require('bluebird-queue'),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    queue = new BlueBirdQueue({
      concurrency: 5 // optional, how many items to process at a time
    });

var bookPromise = function(name){
  return getBookByNamePromise(name);
};

// only create a reference to the function, don't actually call it.
var bookPromise1 = bookPromise.bind(null, 'some book');
var bookPromise2 = bookPromise.bind(null, 'another book');

// add multiple promises or promises-making functions to the queue in one call
queue.add([bookPromise1, bookPromise2]);
// can also be called with a single function and no array
queue.add(fs.readFileAsync('package.json'));
queue.start().then(function(results){
  console.log(results);
});

```

### Methods

#### add()
Parameters: `function, promise or array of function or promise references`
Returns: `nothing`

Adds a promise reference to the queue. Does not resolve the promise until start() is called. Can be passed a single 
promise returning function, a promise, or an array of promises or promise returning functions.

#### addNow()
Parameters: `function, array of arguments`
Returns: `nothing`

Utility method. Same as the add() method, but adds the item and starts processing without the need to call start.

#### start()
Parameters: `none`
Returns: `promise`

Starts processing the queued items and returns a promise that that resolves the results from all their resolved values.

#### drain()
Parameters: `none`
Returns: `nothing`

Immediately resolves all queued promises at once, ignoring concurrency, and frees any resources that were used. Will call the onComplete callback when it's finished.
