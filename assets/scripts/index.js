window.$ = window.jQuery = require("jquery");

require("./js-check")();
require("./crumb")();
require("./hiring");
require("./npm-expansions");
require("./email-obfuscate")();
require("./pretty-numbers")();
require("./private-npm-beta")();
require('./deep-links')();
require("./tooltips")();
require("./what-npm-is-for")();
require("./billing")();
require("./billing-cancel")();
require("./banner")();
require("./date-formatting")();
require("./keyboard-shortcuts")();
require("./add-active-class-to-links")();
require("./autoselect-inputs")();
require("./package-access")();
require("./buy-enterprise-license")();
require("./twitter-tracking")();
require("./fetch-packages")();
require("./tabs")();
require("./switch-submission")();
require("./validator")();

window.github = require("./github")();
window.star = require("./star")();
