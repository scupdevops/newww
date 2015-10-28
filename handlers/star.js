var Package = require('../agents/package');

module.exports = function(request, reply) {
  var loggedInUser = request.loggedInUser;

  if (request.method === 'get') {
    return reply.redirect('browse/userstar/' + loggedInUser.name);
  }

  if (!loggedInUser) {
    request.logger.error('user is not logged in');
    reply('user is not logged in').code(403);
    return;
  }

  var username = loggedInUser.name,
    body = request.payload,
    pkg = body.name,
    starIt = !!body.isStarred.match(/true/i);

  if (starIt) {
    Package(request.loggedInUser)
      .star(pkg)
      .then(function() {
        request.timing.page = 'star';
        request.metrics.metric({
          name: 'star',
          package: pkg,
          value: 1
        });
        return reply(username + ' starred ' + pkg).code(200);
      })
      .catch(function(err) {
        request.logger.error(username + ' was unable to star ' + pkg);
        request.logger.error(err);
        reply('not ok').code(500);
        return;
      });
  } else {

    Package(request.loggedInUser)
      .unstar(pkg)
      .then(function() {
        request.timing.page = 'unstar';
        request.metrics.metric({
          name: 'unstar',
          package: pkg,
          value: 1
        });

        return reply(username + ' unstarred ' + pkg).code(200);
      })
      .catch(function(err) {
        request.logger.error(username + ' was unable to unstar ' + pkg);
        request.logger.error(err);
        reply('not ok').code(500);
        return;
      });
  }
};
