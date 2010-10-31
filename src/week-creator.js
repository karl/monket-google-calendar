(function() {
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  MKT.WeekCreator = function(config, dayHighlighter, eventLoader) {
    this.config = config;
    this.dayHighlighter = dayHighlighter;
    this.eventLoader = eventLoader;
    return this;
  };
  MKT.WeekCreator.prototype.create = function(weekStart) {
    var _len, _ref, index, label, week;
    week = $("#templates .week").clone().attr("id", this.config.weekIdPrefix + weekStart.customFormat(this.config.dateFormat));
    week.css('opacity', 0.3);
    $("td", week).attr("id", __bind(function(index) {
      return this.config.dayIdPrefix + weekStart.addDays(index).customFormat(this.config.dateFormat);
    }, this));
    _ref = $('.day-label', week);
    for (index = 0, _len = _ref.length; index < _len; index++) {
      label = _ref[index];
      this.add_day_label(label, index, weekStart);
    }
    return week;
  };
  MKT.WeekCreator.prototype.add_day_label = function(label, index, weekStart) {
    var dayDate, dayNumber;
    dayDate = weekStart.addDays(index);
    dayNumber = dayDate.customFormat("#D#");
    $(label).html(dayNumber);
    if (dayNumber === "1") {
      this.add_month_label(dayDate, label);
    }
    return dayDate.customFormat(this.config.dateFormat) === new Date().customFormat(this.config.dateFormat) ? this.dayHighlighter.highlightDay($(label).parent()) : null;
  };
  MKT.WeekCreator.prototype.add_month_label = function(dayDate, label) {
    var monthLabel;
    monthLabel = $("#templates .month-label").clone().html(dayDate.customFormat("#MMMM#"));
    $(label).after(monthLabel);
    return $(label).parent().addClass("start-month");
  };
}).call(this);
