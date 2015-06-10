var assert = require('assert'),
  Promise = require('bluebird'),
  PromiseQueue = require('../index.js');

var deadPromise = function(args, delay) {
  return new Promise(function(resolve, reject) {
    resolve(args);
  }).delay(delay || 0);
};

var createFullfilledThenable = function (result) {
  return {
    then: function (resolve, reject) {
      resolve(result);
    }
  };
};

var createRejectedThenable = function (error_msg) {
  return {
    then: function (resolve, reject) {
      reject(new Error(error_msg));
    }
  };
};

describe('Methods', function() {

  beforeEach(function(done) {
    this.promiseQueue = new PromiseQueue();
    this.promiseQueue.add( deadPromise.bind(null, 'hello') );
    done();
  });

  describe('#add()', function() {
    it('should add a promise', function(done) {
      assert.strictEqual(this.promiseQueue._queue.length, 1);
      done();
    });

    it('should accept a thenable', function(done) {
      this.promiseQueue.add(createFullfilledThenable('result'));
      assert.strictEqual(this.promiseQueue._queue.length, 2);
      done();
    });
  });

  describe('#start()', function() {

    it('return the resolved promises', function(done) {
      this.promiseQueue.start().then(function(results) {
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0], 'hello');
        done();
      }).catch(done);
    });

    it('resolves both thenables and promise factories', function(done) {
      this.promiseQueue.add(createFullfilledThenable('test'));
      this.promiseQueue.start().then(function(results) {
        assert.strictEqual(results.length, 2);
        assert.strictEqual(results[0], 'hello');
        assert.strictEqual(results[1], 'test');
        done();
      }).catch(done);
    });

    it('error in promises are propagated', function(done) {
      this.promiseQueue.add(createRejectedThenable('this failed'));
      this.promiseQueue.start().catch(function(err) {
        assert.strictEqual(err.message, "this failed");
        done();
      }).catch(done);
    });

    it('return many resolved promises with concurrency and FIFO', function(done) {
      this.promiseQueue = new PromiseQueue();
      // index starts with 1 -> javascript tom foolery
      for (var i = 1; i < 8; i++) {
        this.promiseQueue.add(deadPromise.bind(null, i));
      }
      assert.strictEqual(this.promiseQueue._queue.length, 7);
      this.promiseQueue.start().then(function(results) {
        for (var i = 1; i < results.length; i++) {
          // i - 1 -> javascript tom foolery
          assert.strictEqual(results[i - 1], i);
        }
        done();
      }).catch(done);
    });

    it('resolve promise with delay', function(done) {
      this.timeout(6000);
      this.promiseQueue = new PromiseQueue({
        delay: 5000
      });

      var future = new Date();
      future.setSeconds(future.getSeconds() + 5);
      this.promiseQueue.add( deadPromise.bind(null, 'hello') );
      this.promiseQueue.start().then(function(results) {
        assert.strictEqual(new Date() > future, true);
        done();
      }).catch(done);
    });

  });

  describe('#drain()', function() {
    it('should drain all promises', function(done) {
      var self = this;
      this.promiseQueue.onComplete = function() {
        assert.strictEqual(self.promiseQueue._queue.length, 0);
        done();
      };
      this.promiseQueue.onError = done;
      this.promiseQueue.drain();
    });
  });

});
