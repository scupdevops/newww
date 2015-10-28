exports.user = require('./user.js');

exports.company = require('./company.js');

exports.package = {
  not_found: {
    title: "not found"
  }
};

exports.errors = {
  generic: {
    title: "Whoops",
    subtitle: "Something went wrong"
  },
  token_expired: {
    title: "whoops",
    subtitle: "looks like the token has expired :-("
  }
};
