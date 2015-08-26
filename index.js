'use strict';

var BlueBird = require('bluebird');


function BlueBirdQueue(options) {
  options = options || {};

  /**
   * The amount of queued promises that will be resolved at the same time.
   *
   * @property concurrency
   * @type {Integer}
   * @default 4
   */
  this.concurrency = options.concurrency || 4;

  /**
   * Optional delay to append to each promise when resolving.
   *
   * @property delay
   * @type {Integer}
   * @default 0
   */
  this.delay = options.delay || 0;

  /**
   * The interval that queued promises will recheck when the queue is full.
   * The more promises you attempt to queue past concurrency limits, the
   * more the interval will effect performance.
   *
   * @property interval
   * @type {Integer}
   * @default 5000
   */
  this.interval = options.interval || 5000;

  /**
   * Attachable callback that will be passed all resolved promises if the
   * queue empties.
   *
   * @method onComplete
   * @return {Array} an array of resolved promises
   */
  this.onComplete = options.onComplete || function() {};

  /**
   * Attachable callback that will be invoked on error.
   *
   * @method onError
   * @return {Error} an error
   */
  this.onError = options.onError || function() {};

  this._queue = [];
  this._queueWaiting = [];
  this._processed = [];
  this._working = false;
}

/**
 * Returns a promise which resolves all the promises that have been added.
 *
 * @method start
 * @return {Promise} a bluebird promise
 */
BlueBirdQueue.prototype.start = function() {
  var self = this;
  process.nextTick(function() {
    self._dequeue();
  });
  return new BlueBird(function(resolve, reject) {
    self.onComplete = resolve;
    self.onError = reject;
  });
};

/**
 * Adds a promise to the queue. Promise will not be resolved until start
 * or drain is called.
 *
 * @method add
 * @return void
 */
BlueBirdQueue.prototype.add = function(func) {
  if(func instanceof Array) {
    this._queue = this._queue.concat(func);
  }else if(typeof func === 'function' || 'then' in func) {
    this._queue.push(func);
  }else{
    throw new Error('No promises were provided');
  }
};

/**
 * Utility method. Adds a promise to the queue and starts processing right away.
 *
 * @method add
 * @return void
 */
BlueBirdQueue.prototype.addNow = function(func) {
  this.add(func);
  if(!this._working) this._dequeue();
};

/**
 * Ignores concurrency and resolves all promises at once while ignoring
 * any promises that are waiting to be queued.
 *
 * @method drain
 * @return void
 */
BlueBirdQueue.prototype.drain = function() {

  if (!this._queue.length) return;
  try {

    for (var i = 0; i < this._queueWaiting.length; i++) {
      clearTimeout(this._queueWaiting[i]);
    }

    this._queueWaiting = [];

    var batches = Math.floor(this._queue.length / this.concurrency);

    if (batches === 0) {
      this._working = false;
      this._dequeue();
    } else {
      for (i = 0; i < batches; i++) {
        this._working = false;
        this._dequeue();
      }
    }
  } catch (ex) {
    this.onError(ex);
  }
};

BlueBirdQueue.prototype._dequeue = function() {
  var self = this;

  try {

    if (self._working) {
      self._queueWaiting.push(
        setTimeout(function() {
          self._dequeue();
        }, self.interval)
      );
      return;
    }

    var promises = [];

    self._working = true;

    for (var i = 0; i < self.concurrency; i++) {
      if (self._queue[i]) {
        var promise = self._queue.shift();
        promises.push(typeof promise === 'function' ? promise() : promise);
      }
    }

    if(!promises.length) {
      self._working = false;
      return;
    }

    BlueBird.all(promises).delay(self.delay).spread(function() {
      self._processed = self._processed.concat(Array.prototype.slice.call(arguments));
      // if there are no more promises call onComplete.
      if (!self._queue.length && !self._queueWaiting.length) self.onComplete(self._processed);
      // if there are more promises by no waiting promises then restart this function.
      self._working = false;
      if (self._queue.length && !self._queueWaiting.length) self._dequeue();
    }).catch(self.onError);

  } catch (ex) {
    self._working = false;
    self.onError(ex);
  }
};

module.exports = BlueBirdQueue;
