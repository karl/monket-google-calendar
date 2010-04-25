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
    var week;
    // Clonse the week template and set it's id to it's start date
    week = $("#templates .week").clone().attr("id", this.config.weekIdPrefix + weekStart.customFormat(this.config.dateFormat));
    week.css('opacity', 0.3);
    // Set the id of each day to that day's date
    $("td", week).attr("id", __bind(function(index) {
        return this.config.dayIdPrefix + weekStart.addDays(index).customFormat(this.config.dateFormat);
      }, this));
    // Set the day label for each day, e.g. '12'
    $(".day-label", week).each(__bind(function(index) {
        var dayDate, dayNumber, monthLabel;
        dayDate = weekStart.addDays(index);
        dayNumber = dayDate.customFormat("#D#");
        // If this is the first day in the month then add a month label, e.g. 'February'
        $(this).html(dayNumber);
        if (dayNumber === "1") {
          monthLabel = $("#templates .month-label").clone().html(dayDate.customFormat("#MMMM#"));
          $(this).after(monthLabel);
          $(this).parent().addClass("start-month");
        }
        // if the this is todays date then highlight it
        if (dayDate.customFormat(this.config.dateFormat) === new Date().customFormat(this.config.dateFormat)) {
          return this.dayHighlighter.highlightDay($(this).parent());
        }
      }, this));
    return week;
  };
})();
