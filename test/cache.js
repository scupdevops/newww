var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  crypto = require('crypto'),
  sinon = require('sinon'),
  nock = require('nock');

var cache = require('../lib/cache');

before(function(done) {
  process.env.USE_CACHE = 'true';
  cache.disconnect();
  done();
});

describe('lib/cache.js', function() {
  describe('configure()', function() {
    it('requires that configure be called before use', function(done) {
      function shouldThrow() {
        return cache.getKey('foo');
      }
      expect(shouldThrow).to.throw(/configure/);
      done();
    });

    it('requires an options object', function(done) {
      function shouldThrow() {
        cache.configure();
      }
      expect(shouldThrow).to.throw(/options/);
      done();
    });

    it('requires a redis url option', function(done) {
      function shouldThrow() {
        cache.configure({});
      }
      expect(shouldThrow).to.throw(/redis/);
      done();
    });

    it('creates a redis client', function(done) {
      expect(cache.redis).to.not.exist();
      cache.configure({
        redis: 'redis://localhost:6379'
      });
      expect(cache.redis).to.be.an.object();
      done();
    });

    it('respects the `ttl` option', function(done) {
      expect(cache.DEFAULT_TTL).to.equal(300);
      cache.configure({
        redis: 'redis://localhost:6379',
        ttl: 600
      });
      expect(cache.DEFAULT_TTL).to.equal(600);
      done();
    });

    it('respects the `prefix` option', function(done) {
      expect(cache.KEY_PREFIX).to.equal('cache:');
      cache.configure({
        redis: 'redis://localhost:6379',
        prefix: 'fred:'
      });
      expect(cache.KEY_PREFIX).to.equal('fred:');
      done();
    });
  });

  describe('redis errors', function() {
    it('logs on error', function(done) {
      sinon.spy(cache.logger, 'error');
      cache.redis.emit('error', new Error('my little pony'));
      expect(cache.logger.error.calledWith('cache redis connection lost; reconnecting')).to.be.true();
      cache.logger.error.restore();
      done();
    });

    it('reconnects on error', function(done) {
      cache.redis.on('reconnecting', function() {
        expect(true).to.be.true();
        done();
      });
      cache.redis.stream.emit('error', new Error('my little pony'));
    });
  });

  describe('_fingerprint()', function() {
    it('returns an md5 hash prefixed by the key prefix', function(done) {
      var testKey = {
        foo: 'bar'
      };
      var expected = crypto.createHash('md5').update(JSON.stringify(testKey)).digest('hex');
      var generated = cache._fingerprint(testKey);

      expect(generated.indexOf(expected)).to.equal(5);
      expect(generated.indexOf('fred:')).to.equal(0);
      done();
    });

    it('returns the same value for the same input', function(done) {
      var key1 = {
        foo: 'bar',
        baz: 'qux'
      };
      var key2 = {
        baz: 'qux',
        foo: 'bar'
      };
      var gen1 = cache._fingerprint(key1);
      var gen2 = cache._fingerprint(key2);

      expect(gen1).to.equal(gen2);
      done();
    });

    it('removes `ttl` key from the source object', function(done) {
      var key1 = {
        foo: 'bar',
        baz: 'qux'
      };
      var key2 = {
        foo: 'bar',
        baz: 'qux',
        ttl: 234
      };
      var gen1 = cache._fingerprint(key1);
      var gen2 = cache._fingerprint(key2);

      expect(gen1).to.equal(gen2);
      done();
    });

    it('downcases the http `method` value', function(done) {
      var key1 = {
        method: 'get',
        url: '/fun'
      };
      var key2 = {
        method: 'GET',
        url: '/fun'
      };
      var gen1 = cache._fingerprint(key1);
      var gen2 = cache._fingerprint(key2);

      expect(gen1).to.equal(gen2);
      done();
    });
  });

  describe('get()', function() {
    it('requires an options argument', function(done) {
      function shouldThrow() {
        cache.get();
      }
      expect(shouldThrow).to.throw(/Request/);
      done();
    });

    it('calls _fingerprint()', function(done) {
      sinon.spy(cache, '_fingerprint');

      nock('https://fingerprint.com').get('/').reply(200);
      var opts = {
        method: 'get',
        url: 'https://fingerprint.com/'
      };

      cache.get(opts, function(err, data) {
        expect(cache._fingerprint.calledTwice).to.be.true();
        expect(cache._fingerprint.calledWith(opts)).to.be.true();
        cache._fingerprint.restore();
        done();
      });
    });

    it('checks redis for the presence of the data first', function(done) {
      sinon.spy(cache.redis, 'get');
      var opts = {
        url: 'https://google.com/'
      };

      var mock = nock('https://google.com')
        .get('/')
        .reply(200);

      var fingerprint = cache._fingerprint(opts);

      cache.get(opts, function(err, data) {
        expect(cache.redis.get.calledOnce).to.equal(true);
        expect(cache.redis.get.calledWith(fingerprint)).to.equal(true);
        cache.redis.get.restore();
        mock.done();
        done();
      });
    });

    it('makes a request using the options argument if redis has no value', function(done) {
      sinon.stub(cache.redis, 'get').yields(null);
      sinon.spy(cache.logger, 'debug');

      var opts = {
        method: 'get',
        url: 'https://google.com/searching'
      };

      var mock = nock('https://google.com')
        .get('/searching')
        .reply(200);

      cache.get(opts, function(err, data) {
        expect(cache.redis.get.calledOnce).to.equal(true);
        expect(cache.logger.debug.calledWithMatch(/get: /i)).to.equal(true);
        cache.redis.get.restore();
        cache.logger.debug.restore();
        mock.done();
        done();
      });
    });

    it('makes a request to the backing service if the redis value is garbage', function(done) {
      sinon.stub(cache.redis, 'get').yields(null, null);

      var opts = {
        method: 'get',
        url: 'https://google.com/again'
      };

      var mock = nock('https://google.com')
        .get('/again')
        .reply(200);

      cache.get(opts, function(err, data) {
        expect(cache.redis.get.calledOnce).to.equal(true);
        cache.redis.get.restore();
        mock.done();
        done();
      });
    });

    it('gracefully handles a missing or error-returning redis', function(done) {
      sinon.stub(cache.redis, 'get').yields(Error('hello redis error'));
      sinon.spy(cache.logger, 'error');

      var opts = {
        url: 'https://logging.com/'
      };

      var mock = nock('https://logging.com')
        .get('/')
        .reply(200);

      cache.get(opts, function(err, data) {
        expect(cache.logger.error.calledTwice).to.equal(true);
        expect(cache.logger.error.calledWithMatch(/problem getting/)).to.equal(true);
        cache.logger.error.restore();
        mock.done();
        done();
      });
    });

    it('sets the value in redis after retrieval', function(done) {
      sinon.spy(cache.redis, 'setex');

      var opts = {
        method: 'get',
        url: 'https://cache.com/hello'
      };
      var fingerprint = cache._fingerprint(opts);
      var mock = nock('https://cache.com')
        .get('/hello')
        .reply(200);

      cache.get(opts, function(err, data) {
        mock.done();
        expect(cache.redis.setex.calledWith(fingerprint)).to.equal(true);
        cache.redis.setex.restore();
        done();
      });
    });

    it('respects the default TTL', function(done) {
      sinon.spy(cache.redis, 'setex');

      var opts = {
        method: 'get',
        url: 'https://cache.com/hello-again'
      };
      var fingerprint = cache._fingerprint(opts);
      var mock = nock('https://cache.com')
        .get('/hello-again')
        .reply(200);

      cache.get(opts, function(err, data) {
        mock.done();
        expect(cache.DEFAULT_TTL).to.equal(600);
        expect(cache.redis.setex.calledWithMatch(fingerprint, 600)).to.equal(true);
        cache.redis.setex.restore();
        done();
      });
    });

    it('gracefully handles bad json in a redis key', function(done) {
      var opts = {
        method: 'get',
        url: 'https://cache.com/hello-again'
      };
      var fingerprint = cache._fingerprint(opts);
      var mock = nock('https://cache.com')
        .get('/hello-again')
        .reply(200, 'yo');

      cache.configure({
        redis: 'redis://localhost:6379'
      });

      cache.redis.set(fingerprint, 'i am bad json', function(err, reply) {
        cache.get(opts, function(err, data) {
          expect(err).to.not.exist();
          expect(data).to.equal('yo');
          mock.done();
          cache.redis.get(fingerprint, function(err, reply) {
            expect(err).to.not.exist();
            expect(reply).to.equal('"yo"');
            done();
          });
        });
      });
    });

    it('returns a previously cached value without calling the remote service', function(done) {
      var opts = {
        method: 'get',
        url: 'https://cache.com/hello-again'
      };
      var mock = nock('https://cache.com')
        .get('/hello-again')
        .reply(200, 'blistering barnacles');
      cache.get(opts, function(err, data) {
        expect(err).to.not.exist();
        expect(data).to.equal('yo');
        expect(mock.isDone()).to.be.false();
        done();
      });
    });

    it('responds with an error when the remote service responds with 400', function(done) {
      var opts = {
        url: 'http://example.com/bad-request'
      };
      var mock = nock('http://example.com')
        .get('/bad-request')
        .reply(400);

      cache.get(opts, function(err, data) {
        mock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('unexpected status code 400');
        done();
      });
    });

    it('respects a passed-in TTL', function(done) {
      var opts = {
        url: 'http://example.com/ttl',
        method: 'get',
        ttl: 5000
      };
      var mock = nock('http://example.com')
        .get('/ttl')
        .reply(200, 'blistering barnacles');
      var key = cache._fingerprint(opts);

      cache.get(opts, function(err, data) {
        expect(err).to.not.exist();
        cache.redis.ttl(key, function(err, ttl) {
          expect(err).to.not.exist();
          expect(ttl).to.be.above(4990);
          cache.redis.del(key, done);
        });
      });
    });

    it('logs if it is unable to set the cache', function(done) {
      sinon.stub(cache.redis, 'setex').yields(Error('setex error'));
      var saved = cache.logger.error;

      var count = 0;
      cache.logger.error = function() {
        count++;
        if (count === 2) {
          cache.logger.error = saved;
          cache.redis.setex.restore();
          mock.done();
          done();
        }
      };

      var opts = {
        url: 'https://example.com/setex-fails'
      };
      var mock = nock('https://example.com')
        .get('/setex-fails')
        .reply(200, 'blistering barnacles');

      cache.get(opts, function(err, data) {
        expect(err).to.not.exist();
        expect(data).to.equal('blistering barnacles');
      });
    });

    it('does not use redis if process.env.USE_CACHE is unset', function(done) {
      delete process.env.USE_CACHE;

      var opts = {
        method: 'get',
        url: 'https://example.com/no-cache'
      };
      var mock = nock('https://example.com')
        .get('/no-cache')
        .reply(200, 'blistering barnacles');

      sinon.spy(cache, '_getNoCache');
      sinon.spy(cache.redis, 'get');

      cache.get(opts, function(err, data) {
        expect(err).to.not.exist();
        expect(data).to.equal('blistering barnacles');
        mock.done();
        expect(cache.redis.get.called).to.be.false();
        expect(cache._getNoCache.called).to.be.true();

        cache._getNoCache.restore();
        cache.redis.get.restore();
        process.env.USE_CACHE = 'true';

        done();
      });
    });
  });

  describe('getP()', function() {
    it('returns a promise', function(done) {
      var opts = {
        url: 'https://example.com/promised-cache'
      };
      var mock = nock('https://example.com')
        .get('/promised-cache')
        .reply(200, 'blistering barnacles');

      var r = cache.getP(opts);
      expect(r).to.be.an.object();
      expect(r.then).to.be.a.function();

      done();
    });

    it('calls get() with the passed-in options', function(done) {
      var spy = sinon.spy(cache, 'get');
      var opts = {
        method: 'get',
        url: 'https://example.com/promised-cache'
      };
      var mock = nock('https://example.com')
        .get('/promised-cache')
        .reply(200, 'blistering barnacles');

      cache.getP(opts)
        .then(function() {
          mock.done();
          expect(spy.calledWith(opts)).to.be.true();
          cache.get.restore();
          done();
        }).done();
    });

    it('rejects the promise on error', function(done) {
      var opts = {
        url: 'http://example.com/bad-request'
      };
      var mock = nock('http://example.com')
        .get('/bad-request')
        .reply(400);

      cache.getP(opts)
        .then(function(data) {
          throw new Error('this was supposed to fail!');
        })
        .catch(function(err) {
          mock.done();
          expect(err).to.exist();
          expect(err.message).to.equal('unexpected status code 400');
          done();
        }).done();
    });
  });

  describe('setKey() and getKey()', function() {
    it('adds an item to the cache with a specific key', function(done) {
      var CACHE_TTL = 5; // seconds
      var key = 'boom';
      var data = 'bam';

      cache.setKey(key, CACHE_TTL, data, function(err) {
        expect(err).to.not.exist();
        cache.redis.get(cache._fingerprint(key), function(err, result) {
          expect(result).to.equal(data);
          done();
        });
      });
    });

    it('retrieves an item from the cache with a specific key', function(done) {
      var key = 'boom';
      var data = 'bam';

      cache.getKey(key, function(err, result) {
        expect(err).to.not.exist();
        expect(result).to.equal(data);
        done();
      });
    });
  });

  describe('drop()', function() {
    it('removes a previously-set value from the cache', function(done) {
      var opts = {
        method: 'get',
        url: 'https://cache.com/hello-again'
      };
      var key = cache._fingerprint(opts);

      cache.redis.get(key, function(err, value) {
        expect(err).to.not.exist();
        expect(value).to.be.a.string();
        cache.drop(opts, function(err) {
          expect(err).to.not.exist();
          cache.redis.get(cache._fingerprint(key), function(err, value2) {
            expect(err).to.not.exist();
            expect(value2).to.not.exist();
            done();
          });
        });
      });
    });

    it('does not complain on error', function(done) {
      sinon.stub(cache.redis, 'del').yields(Error('del error'));
      var saved = cache.logger.error;

      var count = 0;
      cache.logger.error = function() {
        count++;
      };

      var opts = {
        url: 'https://example.com/drop-fails'
      };
      cache.drop(opts, function() {
        expect(count).to.equal(2);
        sinon.restore(cache.redis.del);
        cache.logger.error = saved;
        done();
      });
    });

    it('does nothing when USE_CACHE is unset', function(done) {
      delete process.env.USE_CACHE;

      var opts = {
        method: 'get',
        url: 'https://example.com/no-cache'
      };

      sinon.spy(cache.redis, 'del');

      cache.drop(opts, function() {
        expect(cache.redis.del.called).to.be.false();
        cache.redis.del.restore();
        process.env.USE_CACHE = 'true';
        done();
      });

    });
  });

  describe('dropP()', function() {
    it('returns a promise', function(done) {
      var opts = {
        url: 'https://example.com/promised-cache'
      };

      var r = cache.dropP(opts);
      expect(r).to.be.an.object();
      expect(r.then).to.be.a.function();

      done();
    });

    it('calls drop() with the passed-in options', function(done) {
      var spy = sinon.spy(cache, 'drop');
      var opts = {
        url: 'https://example.com/promised-cache'
      };

      cache.dropP(opts)
        .then(function() {
          expect(spy.calledWith(opts)).to.be.true();
          cache.drop.restore();
          done();
        }).done();
    });

    it('resolves the promise on error', function(done) {
      var opts = {
        url: 'https://example.com/drop-fails'
      };
      sinon.stub(cache.redis, 'del').yields(Error('del error'));

      cache.dropP(opts)
        .then(function() {
          sinon.restore(cache.redis.del);
          done();
        }).done();
    });
  });

  describe('disconnect()', function() {
    it('disconnects the cache', function(done) {
      cache.configure({
        redis: 'redis://localhost:6379'
      });
      cache.redis.keys('*', function(err, keys) {
        expect(err).to.not.exist();
        expect(keys).to.exist();
        cache.disconnect();
        expect(cache.redis).to.be.null();
        done();
      });
    });
  });

  after(function(done) {
    delete process.env.USE_CACHE;
    cache.configure({
      redis: 'redis://localhost:6379'
    });
    cache.redis.keys('fred:*', function(err, list) {
      expect(err).to.not.exist();
      cache.redis.del(list, function(err, reply) {
        expect(err).to.not.exist();
        done();
      });
    });
  });
});
