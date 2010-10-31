(function() {
  MKT.DayHighlighter = function(config) {
    this.config = config;
    return this;
  };
  MKT.DayHighlighter.prototype.highlightToday = function() {
    return this.highlightDay($("#" + this.config.dayIdPrefix + new Date().customFormat(this.config.dateFormat)));
  };
  MKT.DayHighlighter.prototype.highlightDay = function(day) {
    $("#calendar .week td").removeClass("today");
    day = $(day);
    return day.length > 0 ? day.addClass("today") : null;
  };
}).call(this);
