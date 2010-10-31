(function() {
  MKT.EventLayoutManager = function(config, eventCreator) {
    this.config = config;
    this.eventCreator = eventCreator;
    $("#templates .event").clone().appendTo($("#layout-test")).attr("id", "layout-event");
    this.recalculateConstants = true;
    $(window).resize(this.resize);
    return this;
  };
  MKT.EventLayoutManager.prototype.resize = function() {
    this.recalculateConstants = true;
    clearTimeout(this.resizeTimeout);
    return (this.resizeTimeout = setTimeout(function() {
      return console.log('re-layout weeks');
    }, 500));
  };
  MKT.EventLayoutManager.prototype.getConstants = function() {
    if (this.recalculateConstants) {
      return this.calculateConstants();
    }
  };
  MKT.EventLayoutManager.prototype.calculateConstants = function() {
    $("#layout-event .text").text("");
    this.dayWidth = $("#calendar .week td:first").width();
    this.dayHeight = $("#calendar .week td:first").innerHeight();
    this.lineHeight = $("#layout-event").outerHeight();
    this.linesPerDay = 1000;
    return $("#layout-event").width(this.dayWidth);
  };
  MKT.EventLayoutManager.prototype.layoutEventsForWeek = function(weekDate, events) {
    var _i, _len, _ref, _result, event, preppedEvents, week;
    this.getConstants();
    this.initLayoutGridForWeek(weekDate);
    preppedEvents = this.prepareEvents(weekDate, events);
    week = $("#" + this.config.weekIdPrefix + weekDate.customFormat(this.config.dateFormat));
    $('.event', week).remove();
    _result = []; _ref = preppedEvents;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      event = _ref[_i];
      _result.push(this.placeEvent(event));
    }
    return _result;
  };
  MKT.EventLayoutManager.prototype.placeEvent = function(event) {
    var eventDOM, startLine;
    eventDOM = this.eventCreator.create(event);
    startLine = this.findLineForEvent(event);
    if (typeof startLine !== "undefined" && startLine !== null) {
      eventDOM.css({
        top: (startLine + 1) * this.lineHeight
      });
      eventDOM.appendTo($("#" + this.config.dayIdPrefix + event.weekStart.customFormat(this.config.dateFormat)));
      return this.markLayoutSpaceAsUsed(event, startLine);
    } else {
      return console.log("No room to place event: " + event.summary);
    }
  };
  MKT.EventLayoutManager.prototype.initLayoutGridForWeek = function(weekDate) {
    var _ref, day, index, row;
    this.layoutGrid = [];
    _ref = this.linesPerDay;
    for (row = 0; (0 <= _ref ? row < _ref : row > _ref); (0 <= _ref ? row += 1 : row -= 1)) {
      this.layoutGrid[row] = {};
      for (day = 0; day <= 6; day++) {
        index = weekDate.addDays(day);
        this.layoutGrid[row][index] = 0;
      }
    }
    return null;
  };
  MKT.EventLayoutManager.prototype.prepareEvents = function(weekDate, events) {
    var _i, _len, _ref, event, preppedEvents;
    preppedEvents = [];
    _ref = events;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      event = _ref[_i];
      event.weekStart = event.start < weekDate ? weekDate : event.start;
      event.weekEnd = event.end > weekDate.addWeeks(1) ? weekDate.addWeeks(1) : event.end;
      event.weekLength = Math.round((event.weekEnd.getTime() - event.weekStart.getTime()) / (1000 * 60 * 60 * 24));
      event.isStart = event.start >= weekDate;
      event.isEnd = event.end <= weekDate.addWeeks(1);
      event.requiredLines = event.isStart && event.isEnd ? this.getRequiredLines(event) : 1;
      preppedEvents.push(event);
    }
    preppedEvents.sort(this.eventSort);
    return preppedEvents;
  };
  MKT.EventLayoutManager.prototype.getRequiredLines = function(event) {
    var text, textEl;
    text = event.summary;
    textEl = $("#layout-event .text");
    textEl.text(text);
    $("#layout-event").width((event.weekLength * 14.2857) + "%");
    return Math.ceil(textEl.outerHeight() / this.lineHeight);
  };
  MKT.EventLayoutManager.prototype.findLineForEvent = function(event) {
    var date, i, isSpace, j;
    for (i = 0; (0 <= this.layoutGrid.length - event.requiredLines ? i <= this.layoutGrid.length - event.requiredLines : i >= this.layoutGrid.length - event.requiredLines); (0 <= this.layoutGrid.length - event.requiredLines ? i += 1 : i -= 1)) {
      isSpace = 0;
      for (j = i; (i <= i + event.requiredLines ? j < i + event.requiredLines : j > i + event.requiredLines); (i <= i + event.requiredLines ? j += 1 : j -= 1)) {
        date = event.weekStart;
        while (date < event.weekEnd) {
          isSpace += this.layoutGrid[j][date];
          date = date.addDays(1);
        }
      }
      if (isSpace === 0) {
        return i;
      }
    }
    return null;
  };
  MKT.EventLayoutManager.prototype.markLayoutSpaceAsUsed = function(event, startLine) {
    var date, j;
    for (j = startLine; (startLine <= startLine + event.requiredLines ? j < startLine + event.requiredLines : j > startLine + event.requiredLines); (startLine <= startLine + event.requiredLines ? j += 1 : j -= 1)) {
      date = event.weekStart;
      while (date < event.weekEnd) {
        this.layoutGrid[j][date] = 1;
        date = date.addDays(1);
      }
    }
    return null;
  };
  MKT.EventLayoutManager.prototype.eventSort = function(eventA, eventB) {
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
}).call(this);
