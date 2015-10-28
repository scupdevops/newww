var crypto = require('crypto');
var moment = require('moment-tokens');

var utils = {};

utils.safeJsonParse = function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch (er) {
    return null;
  }
};

utils.sha = function sha(token) {
  return crypto.createHash('sha1').update(token).digest('hex');
};

utils.toCommonLogFormat = function toCommonLogFormat(resp, duration) {

  var method = resp.request.method,
    path = resp.request.uri.href,
    httpProtocol = 'HTTP/' + resp.httpVersion;

  var clientIp = '-',
    clientId = process.env.CANONICAL_HOST,
    userid = '-',
    time = '[' + moment().strftime('%d/%b/%Y:%H:%M:%S %z') + ']',
    requestLine = '"' + [method, path, httpProtocol].join(' ') + '"',
    statusCode = resp.statusCode,
    objectSize = '-',
    reqDuration = duration ? duration + 'ms' : '-';

  return [clientIp, clientId, userid, time, requestLine, statusCode, objectSize, reqDuration].join(' ');
};

utils.getUserIP = function(request) {
  return request.headers['fastly-client-ip'] || request.headers['x-forwarded-for'] || "unknown";
};

module.exports = utils;
