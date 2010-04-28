(function(){
  var __slice = Array.prototype.slice, __bind = function(func, obj, args) {
    return function() {
      return func.apply(obj || {}, args ? args.concat(__slice.call(arguments, 0)) : arguments);
    };
  };
  window.EventLayoutManager = function EventLayoutManager(config, eventCreator) {
    this.config = config;
    this.eventCreator = eventCreator;
    // Create an event that we can use for working out attributes of events before displaying them
    $("#templates .event").clone().appendTo($("#layout-test")).attr("id", "layout-event");
    this.recalculateConstants = true;
    $(window).resize(this.resize);
    return this;
  };
  window.EventLayoutManager.prototype.resize = function resize() {
    this.recalculateConstants = true;
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout((function() {
      return console.log('re-layout weeks');
    }), 500);
    return this.resizeTimeout;
  };
  // only recaculate constants if they need redefining (e.g. first layout or browser resize)
  window.EventLayoutManager.prototype.getConstants = function getConstants() {
    if (this.recalculateConstants) {
      return this.calculateConstants();
    }
  };
  // must be called after the first week has been added to the DOM
  window.EventLayoutManager.prototype.calculateConstants = function calculateConstants() {
    // Empty text so we are sure that we calculate single line height
    $("#layout-event .text").text("");
    this.dayWidth = $("#calendar .week td:first").width();
    this.dayHeight = $("#calendar .week td:first").innerHeight();
    this.lineHeight = $("#layout-event").outerHeight();
    this.linesPerDay = 1000;
    // Math.floor(@dayHeight / @lineHeight) - 1 # -1 line for the date marker in top right of each day
    // set width of test event to single day
    return $("#layout-event").width(this.dayWidth);
  };
  // In order to lay out events we divide the week into a grid
  // The columns of the grid represent each day
  // The rows represent a number of lines (each line is tall enough for a single line event)
  //
  // We work out how many cells a given event needs
  // (e.g. two vertical cells if text spans two lines, or 3 columns for a 3 day event)
  // We see if we can fit the event in the grid
  // If we can, then we mark those cells in the grid as used
  window.EventLayoutManager.prototype.layoutEventsForWeek = function layoutEventsForWeek(weekDate, events) {
    var preppedEvents, week;
    this.getConstants();
    this.initLayoutGridForWeek(weekDate);
    preppedEvents = this.prepareEvents(weekDate, events);
    week = $("#" + this.config.weekIdPrefix + weekDate.customFormat(this.config.dateFormat));
    $('.event', week).remove();
    // foreach event
    return $.each(preppedEvents, __bind(function(i, event) {
        return this.placeEvent(event);
      }, this));
    // TODO: Have 'show more' link appear if more events than will fit in a day
    // foreach day
    //   if show-more count > 0
    //     display 'X more' link
  };
  window.EventLayoutManager.prototype.placeEvent = function placeEvent(event) {
    var eventDOM, startLine;
    eventDOM = this.eventCreator.create(event);
    // Now attempt to find a line where we can place the event
    startLine = this.findLineForEvent(event);
    if (startLine !== null) {
      eventDOM.css({
        top: (startLine + 1) * this.lineHeight
      });
      eventDOM.appendTo($("#" + this.config.dayIdPrefix + event.weekStart.customFormat(this.config.dateFormat)));
      return this.markLayoutSpaceAsUsed(event, startLine);
    } else {
      // increment show-more count for all days the event spans
      return $.log("No room to place event: " + event.summary);
    }
  };
  window.EventLayoutManager.prototype.initLayoutGridForWeek = function initLayoutGridForWeek(weekDate) {
    var _a, day, index, row;
    // initialise layoutGrid array
    this.layoutGrid = [];
    row = 0;
    _a = [];
    while (row < this.linesPerDay) {
      _a.push((function() {
        this.layoutGrid[row] = {};
        day = 0;
        while (day < 7) {
          index = weekDate.addDays(day);
          this.layoutGrid[row][index] = 0;
          day++;
        }
        row++;
        return null;
      }).call(this));
    }
    return _a;
  };
  window.EventLayoutManager.prototype.prepareEvents = function prepareEvents(weekDate, events) {
    var _a, _b, _c, event, preppedEvents;
    // convert the events object to an array so we can sort it
    // also add in some extra fields that speed up processing
    preppedEvents = [];
    _b = events;
    for (_a = 0, _c = _b.length; _a < _c; _a++) {
      event = _b[_a];
      event.weekStart = event.start < weekDate ? weekDate : event.start;
      event.weekEnd = event.end > weekDate.addWeeks(1) ? weekDate.addWeeks(1) : event.end;
      event.weekLength = Math.round((event.weekEnd.getTime() - event.weekStart.getTime()) / (1000 * 60 * 60 * 24));
      event.isStart = event.start >= weekDate;
      event.isEnd = event.end <= weekDate.addWeeks(1);
      event.requiredLines = event.isStart && event.isEnd ? this.getRequiredLines(event) : 1;
      preppedEvents[preppedEvents.length] = event;
    }
    // order events by num of days, then by text length
    preppedEvents.sort(this.eventSort);
    return preppedEvents;
  };
  window.EventLayoutManager.prototype.getRequiredLines = function getRequiredLines(event) {
    var text, textEl;
    text = event.summary;
    textEl = $("#layout-event .text");
    textEl.text(text);
    $("#layout-event").width((event.weekLength * 14.2857) + "%");
    return Math.ceil(textEl.outerHeight() / this.lineHeight);
  };
  window.EventLayoutManager.prototype.findLineForEvent = function findLineForEvent(event) {
    var date, i, isSpace, j;
    i = 0;
    while (i <= this.layoutGrid.length - event.requiredLines) {
      isSpace = 0;
      j = i;
      while (j < i + event.requiredLines) {
        date = event.weekStart;
        while (date < event.weekEnd) {
          isSpace += this.layoutGrid[j][date];
          date = date.addDays(1);
        }
        j++;
      }
      if (isSpace === 0) {
        return i;
      }
      i++;
    }
    return null;
  };
  window.EventLayoutManager.prototype.markLayoutSpaceAsUsed = function markLayoutSpaceAsUsed(event, startLine) {
    var _a, date, j;
    j = startLine;
    _a = [];
    while (j < (startLine + event.requiredLines)) {
      _a.push((function() {
        date = event.weekStart;
        while (date < event.weekEnd) {
          this.layoutGrid[j][date] = 1;
          date = date.addDays(1);
        }
        j++;
        return null;
      }).call(this));
    }
    return _a;
  };
  // order events by week length, then by text length
  window.EventLayoutManager.prototype.eventSort = function eventSort(eventA, eventB) {
    if (eventB.weekLength === eventA.weekLength) {
      if (eventB.length === eventA.length) {
        return eventB.summary.length - eventA.summary.length;
      } else {
        return eventB.length - eventA.length;
      }
    } else {
      return eventB.weekLength - eventA.weekLength;
    }
  };
})();
