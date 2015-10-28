var strftime = require("prettydate").strftime;
var relative = require('relative-date');

module.exports = function() {
  $(formatDates)
  setInterval(formatDates, 10 * 1000)
}

var formatDates = function() {
  $("[data-date]").each(function(i, el) {
    var date = new Date($(this).data().date)

    if (!date.getYear()) {
      return console.error("Invalid date", date)
    }

    var format = $(this).data().dateFormat || "%Y-%m-%d"
    var result = format === "relative" ? relative(date) : strftime(date, format)
    $(this).text(result)

  })
}
