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

Starting and using queue is simple. You can add any of the options listed above to the new BlueBirdQueue constructor which taks an object.

``` js
var BlueBirdQueue = require('bluebird-queue'),
		Promise = require('bluebird'),
		queue = new BlueBirdQueue({
			concurrency: 5000 //optional
		});

var bookPromise = function(args){
	return getBookByNamePromise(args);
};
	
queue.add(somePromise, ['some book', 'anotherbook']);
queue.start().then(function(results){
	console.log(results);
});

```

### Methods

#### add()
Paramters: `function, array of arguments`
Returns: `nothing`

Adds a promise reference to the queue. Does not resolve the promise until start() is called. First argument is a function that returns a promise. Second argument is an array of arguments to pass to the promise returning function.

#### addNow()
Paramters: `function, array of arguments`
Returns: `nothing`

Utilitity method. Same as the add() method, but adds the item and starts processing without the need to call start.

#### start()
Paramters: `none`
Returns: `promise`

Starts processing the queued items and returns a promise that that resolves the results from all their resolved values.

#### drain()
Paramters: `none`
Returns: `nothing`

Immediately resolves all queued promises at once, ignoring concurrency, and frees any resources that were used. Will call the onComplete callback when it's finished.
