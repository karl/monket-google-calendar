(function(){
  var __slice = Array.prototype.slice, __bind = function(func, obj, args) {
    return function() {
      return func.apply(obj || {}, args ? args.concat(__slice.call(arguments, 0)) : arguments);
    };
  };
  window.WeekCreator = function WeekCreator(config, dayHighlighter, eventLoader) {
    this.config = config;
    this.dayHighlighter = dayHighlighter;
    this.eventLoader = eventLoader;
    return this;
  };
  window.WeekCreator.prototype.create = function create(weekStart) {
    var _a, _b, index, label, week;
    // Clone the week template and set it's id to it's start date
    week = $("#templates .week").clone().attr("id", this.config.weekIdPrefix + weekStart.customFormat(this.config.dateFormat));
    week.css('opacity', 0.3);
    // Set the id of each day to that day's date
    $("td", week).attr("id", __bind(function(index) {
        return this.config.dayIdPrefix + weekStart.addDays(index).customFormat(this.config.dateFormat);
      }, this));
    // Set the day label for each day, e.g. '12'
    _a = $('.day-label', week);
    for (index = 0, _b = _a.length; index < _b; index++) {
      label = _a[index];
      this.add_day_label(label, index, weekStart);
    }
    return week;
  };
  window.WeekCreator.prototype.add_day_label = function add_day_label(label, index, weekStart) {
    var dayDate, dayNumber;
    dayDate = weekStart.addDays(index);
    dayNumber = dayDate.customFormat("#D#");
    $(label).html(dayNumber);
    // If this is the first day in the month then add a month label, e.g. 'February'
    if (dayNumber === "1") {
      this.add_month_label(dayDate, label);
    }
    // if the this is todays date then highlight it
    if (dayDate.customFormat(this.config.dateFormat) === new Date().customFormat(this.config.dateFormat)) {
      return this.dayHighlighter.highlightDay($(label).parent());
    }
  };
  window.WeekCreator.prototype.add_month_label = function add_month_label(dayDate, label) {
    var monthLabel;
    monthLabel = $("#templates .month-label").clone().html(dayDate.customFormat("#MMMM#"));
    $(label).after(monthLabel);
    return $(label).parent().addClass("start-month");
  };
})();
