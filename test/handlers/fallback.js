var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect;

var server;

before(function(done) {
  require('../mocks/server')(function(obj) {
    server = obj;
    done();
  });
});

after(function(done) {
  server.stop(done);
});

describe('Accessing fallback URLs', function() {

  it('renders a corporate page if given path exists as a static file in one of the static page repos', function(done) {
    var opts = {
      url: '/jobs'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('company/corporate');
      done();
    });
  });

  it('redirects to package page if static page is not found', function(done) {
    var opts = {
      url: '/browserify'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('/package/browserify');
      done();
    });
  });

});
