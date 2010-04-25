(function(){
  window.DayHighlighter = function DayHighlighter(config) {
    this.config = config;
    return this;
  };
  window.DayHighlighter.prototype.highlightToday = function highlightToday() {
    return this.highlightDay($("#" + this.config.dayIdPrefix + new Date().customFormat(this.config.dateFormat)));
  };
  window.DayHighlighter.prototype.highlightDay = function highlightDay(day) {
    $("#calendar .week td").removeClass("today");
    day = $(day);
    if (day.length > 0) {
      return day.addClass("today");
    }
  };
})();
