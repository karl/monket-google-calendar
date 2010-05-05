(function(){
  var __slice = Array.prototype.slice, __bind = function(func, obj, args) {
    return function() {
      return func.apply(obj || {}, args ? args.concat(__slice.call(arguments, 0)) : arguments);
    };
  };
  window.MonketCalendarConfig = function MonketCalendarConfig() {
    this.dateFormat = "#YYYY#-#MM#-#DD#";
    this.weekIdPrefix = "week-starting-";
    this.dayIdPrefix = "day-";
    this.eventColourPrefix = "colour-";
    return this;
  };
  window.Calendar = function Calendar(config, eventLoader, notification, eventLayoutManager, weekCreator, dayHighlighter) {
    this.config = config;
    this.eventLoader = eventLoader;
    this.notification = notification;
    this.eventLayoutManager = eventLayoutManager;
    this.weekCreator = weekCreator;
    this.dayHighlighter = dayHighlighter;
    this.weeksToUpdate = [];
    this.eventLoader.addEventHook = __bind(function(event, oldStartDate, oldEndDate) {
        return this.eventChanged(event, oldStartDate, oldEndDate);
      }, this);
    this.eventLoader.updateEventHook = __bind(function(event, oldStartDate, oldEndDate) {
        return this.eventChanged(event, oldStartDate, oldEndDate);
      }, this);
    this.eventLoader.removeEventHook = __bind(function(event, oldStartDate, oldEndDate) {
        return this.eventChanged(event, oldStartDate, oldEndDate);
      }, this);
    this.buildWeeks(this.getStartDate());
    this.updateInterval = setInterval((__bind(function() {
        return this.doUpdate();
      }, this)), 1000 * 60 * 60);
    // update calendar every hour
    $("#body").mousewheel(__bind(function(e, delta) {
        return this.doScroll(e, delta);
      }, this));
    $('#body').dblclick(__bind(function(e) {
        return this.doubleClick(e);
      }, this));
    $('#body').mousedown(__bind(function(e) {
        return this.handlePanning(e);
      }, this));
    $(document).mouseup(__bind(function() {
        $('#body').unbind('mousemove');
        $('body').css('cursor', 'auto');
        return this.scrollToWeekStarting(this.topWeekStartDate);
      }, this));
    document.onselectstart = function onselectstart() {
      return false;
    };
    $(window).resize(__bind(function() {
        return this.scrollToWeekStarting(this.topWeekStartDate);
      }, this));
    $(document).keydown(__bind(function(e) {
        var weeks;
        if ($(e.target).parent().hasClass('editor')) {
          return null;
        }
        if (e.keyCode === 38) {
          weeks = -1;
        } else if (e.keyCode === 40) {
          weeks = 1;
        } else if (e.keyCode === 33) {
          weeks = -4;
        } else if (e.keyCode === 34) {
          weeks = 4;
        } else if (e.keyCode === 84) {
          // Scroll to today
          this.scrollToWeekStarting(new Date().addWeeks(-1));
        }
        if (weeks) {
          return this.scrollToWeekStarting(this.topWeekStartDate.addWeeks(weeks));
        }
      }, this));
    this.notification.hide();
    return this;
  };
  window.Calendar.prototype.handlePanning = function handlePanning(e) {
    var dayHeight, startWeek, startWeekDate, startY;
    if ($(e.target).parents().hasClass('event')) {
      return null;
    }
    dayHeight = $("#calendar .week td:first").innerHeight();
    startY = e.pageY;
    startWeekDate = this.topWeekStartDate;
    startWeek = $("#" + this.config.weekIdPrefix + startWeekDate.customFormat(this.config.dateFormat));
    $('body').css('cursor', 'move');
    return $('#body').mousemove(__bind(function(e) {
        var delta, newWeek, weeks;
        delta = -(e.pageY - startY);
        weeks = delta / 50;
        weeks = delta > 0 ? Math.floor(weeks) : Math.ceil(weeks);
        newWeek = startWeekDate.addWeeks(weeks);
        if (newWeek - this.topWeekStartDate !== 0) {
          return this.scrollToWeekStarting(newWeek);
        }
      }, this));
  };
  window.Calendar.prototype.getStartDate = function getStartDate() {
    var startDate;
    // Work out the start date (either today or a date given on the location hash)
    startDate = this.getTodaysDate().addWeeks(-1);
    try {
      startDate = Date.parseYMD(location.hash.substring(1));
    } catch (exception) {
      $.log("Unable to parse location hash to date: " + location.hash + ", exception: " + exception);
    }
    return startDate;
  };
  window.Calendar.prototype.getTodaysDate = function getTodaysDate() {
    var now;
    now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };
  window.Calendar.prototype.doScroll = function doScroll(event, delta) {
    var multiplier, week, weeks;
    // Work out the start date of the new top week and scroll to it
    multiplier = $.browser.mozilla ? -3 : -1;
    weeks = Math.round(delta * multiplier);
    week = this.topWeekStartDate.addWeeks(weeks);
    this.scrollToWeekStarting(week);
    return false;
    // prevent default scolling behaviour
  };
  window.Calendar.prototype.scrollToWeekStarting = function scrollToWeekStarting(date, offset, immediate) {
    var _a, duration, weekDate;
    clearTimeout(this.finishedScrollingTimeout);
    weekDate = this.getWeekStartDate(date);
    // Preload week elements as we near the edge of the currently loaded weeks
    this.createWeekElementsAsRequired(weekDate.addWeeks(-2));
    this.createWeekElementsAsRequired(weekDate.addWeeks(6));
    if (!(typeof (_a = this.scrollingStartTime) !== "undefined" && _a !== null)) {
      this.scrollingStartTime = new Date();
      this.scrollingStartWeek = this.topWeekStartDate;
    }
    // Get the new top week
    this.topWeekStartDate = weekDate;
    this.topWeek = $("#" + this.config.weekIdPrefix + this.topWeekStartDate.customFormat(this.config.dateFormat));
    // TODO: Sometimes there is an error as new nodes are not yet in the DOM (seems to be fixed by preloading weeks)
    if (this.topWeek.length < 1) {
      throw "Unable to find week to scroll to. For date: " + date.customFormat(this.config.dateFormat);
    }
    this.updateCurrentMonthLabel();
    // Make sure that only the currently executing animation is in the queue
    $("#body").queue().length > 1 ? $("#body").queue("fx", [$("#body").queue().pop()]) : null;
    Math.abs(this.topWeekStartDate - this.scrollingStartWeek) > 3024000000 ? (this.showingScrollNotification = true) : null;
    this.showingScrollNotification ? this.notification.show(this.topWeekStartDate.addWeeks(2).customFormat("#MMMM#<br>#YYYY#")) : null;
    duration = immediate ? 0 : 200;
    return $("#body").scrollTo(this.topWeek, duration, {
      easing: 'easeOutQuad',
      onAfter: (__bind(function() {
          return this.finishedScrolling();
        }, this)),
      offset: {
        top: offset
      }
    });
  };
  window.Calendar.prototype.setURLHash = function setURLHash() {
    location.hash = this.topWeekStartDate.customFormat(this.config.dateFormat);
    return location.hash;
  };
  window.Calendar.prototype.finishedScrolling = function finishedScrolling() {
    clearTimeout(this.finishedScrollingTimeout);
    clearTimeout(this.finishedScrollingTimeout2);
    if ($("#body").queue().length === 0) {
      this.setURLHash();
      document.title = this.topWeekStartDate.addWeeks(2).customFormat("#MMMM# - #YYYY#") + ' - Monket Google Calendar';
      this.finishedScrollingTimeout2 = setTimeout((__bind(function() {
          this.scrollingStartTime = null;
          return this.scheduleLoadData();
        }, this)), 400);
      this.finishedScrollingTimeout = setTimeout((__bind(function() {
          this.notification.hide();
          this.showingScrollNotification = false;
          return this.showingScrollNotification;
        }, this)), 1000);
      return this.finishedScrollingTimeout;
    }
  };
  window.Calendar.prototype.createWeekElementsAsRequired = function createWeekElementsAsRequired(date) {
    var _a, currentDate, firstWeekDate, lastWeekDate, week;
    // If the date is before the earliest first week
    firstWeekDate = this.weekIdToDate($("#calendar .week:first").attr("id"));
    if (date < firstWeekDate) {
      // Create week elements and add them to body, from the first week down to the new date
      currentDate = firstWeekDate.addWeeks(-1);
      while (currentDate >= date) {
        week = this.createWeek(currentDate);
        $("#body").prepend(week);
        currentDate = currentDate.addWeeks(-1);
      }
    }
    // If the date is after the last week
    lastWeekDate = this.weekIdToDate($("#calendar .week:last").attr("id"));
    if (date > lastWeekDate) {
      // Create week elements and add them to the body, from the last week up to the new date
      currentDate = lastWeekDate.addWeeks(1);
      _a = [];
      while (currentDate <= date) {
        _a.push((function() {
          week = this.createWeek(currentDate);
          $("#body").append(week);
          currentDate = currentDate.addWeeks(1);
          return currentDate;
        }).call(this));
      }
      return _a;
    }
  };
  window.Calendar.prototype.updateCurrentMonthLabel = function updateCurrentMonthLabel() {
    return $("#current-month-label").text(this.topWeekStartDate.customFormat("#MMMM#"));
  };
  window.Calendar.prototype.buildWeeks = function buildWeeks(startDate) {
    var _a, _b, _c, firstWeek, i;
    startDate = this.getWeekStartDate(startDate);
    firstWeek = startDate.addWeeks(-2);
    this.topWeekStartDate = startDate.addWeeks(-1);
    // Create weeks for the first year surrounding the start date, and add them to the calendar body
    _b = 0; _c = 8;
    for (_a = 0, i = _b; (_b <= _c ? i < _c : i > _c); (_b <= _c ? i += 1 : i -= 1), _a++) {
      this.createWeek(firstWeek.addWeeks(i)).appendTo($("#body"));
    }
    // Scroll to the start date
    return this.scrollToWeekStarting(startDate);
  };
  window.Calendar.prototype.createWeek = function createWeek(weekStart) {
    var week;
    week = this.weekCreator.create(weekStart);
    this.addWeekToUpdate(weekStart);
    return week;
  };
  window.Calendar.prototype.weekIdToDate = function weekIdToDate(id) {
    var dateString;
    dateString = id.substring(this.config.weekIdPrefix.length);
    return Date.parseYMD(dateString);
  };
  window.Calendar.prototype.getWeekStartDate = function getWeekStartDate(date) {
    while (date.getDay() !== 1) {
      date = date.addDays(-1);
    }
    return date;
  };
  window.Calendar.prototype.doUpdate = function doUpdate() {
    return this.dayHighlighter.highlightToday();
    // TODO: Update events from the server
  };
  window.Calendar.prototype.addWeekToUpdate = function addWeekToUpdate(date) {
    this.weeksToUpdate.push(date);
    return this.scheduleLoadData();
  };
  window.Calendar.prototype.scheduleLoadData = function scheduleLoadData() {
    if (this.scrollingStartTime) {
      return null;
    }
    if (!this.loadDataTimeout && this.weeksToUpdate.length > 0) {
      this.loadDataTimeout = setTimeout((__bind(function() {
          return this.loadData();
        }, this)), 10);
      return this.loadDataTimeout;
    }
  };
  window.Calendar.prototype.loadData = function loadData() {
    var middleWeekDate, nearestDate, nearestDifference, nearestIndex;
    this.loadDataTimeout = null;
    middleWeekDate = this.topWeekStartDate.addWeeks(2);
    nearestDate = this.weeksToUpdate[0];
    nearestIndex = 0;
    nearestDifference = Math.abs(nearestDate - middleWeekDate);
    $.each(this.weeksToUpdate, function(i, weekDate) {
      var difference;
      difference = Math.abs(weekDate - middleWeekDate);
      if (difference < nearestDifference) {
        nearestDifference = difference;
        nearestIndex = i;
        nearestDate = weekDate;
        return nearestDate;
      }
    });
    Array.remove(this.weeksToUpdate, nearestIndex);
    return this.loadWeek(nearestDate);
  };
  window.Calendar.prototype.loadWeek = function loadWeek(startDate) {
    $("#" + this.config.weekIdPrefix + startDate.customFormat(this.config.dateFormat)).removeClass('queued').addClass("loading");
    return this.eventLoader.load(startDate, startDate.addDays(6), (__bind(function(events, startDate, endDate) {
        return this.eventLoadCallback(events, startDate, endDate);
      }, this)), __bind(function(startDate, endDate) {
        return this.eventLoadFailed(startDate, endDate);
      }, this));
  };
  window.Calendar.prototype.eventLoadFailed = function eventLoadFailed(startDate, endDate) {
    $("#" + this.config.weekIdPrefix + date.customFormat(this.config.dateFormat)).addClass("failed-loading");
    return this.scheduleLoadData();
  };
  window.Calendar.prototype.eventLoadCallback = function eventLoadCallback(events, startDate, endDate) {
    try {
      // layout events in week
      this.eventLayoutManager.layoutEventsForWeek(startDate, events);
      $("#" + this.config.weekIdPrefix + startDate.customFormat(this.config.dateFormat)).removeClass("loading").addClass("loaded").animate({
        opacity: 1
      }, 200);
    } catch (exception) {
      console.log("Unable to update week.", exception);
      // Set failed-loading class on week
    }
    return this.scheduleLoadData();
  };
  window.Calendar.prototype.doubleClick = function doubleClick(e) {
    var date, dateString, day, event, id, week;
    if (!($(e.target).hasClass('day'))) {
      return null;
    }
    day = $(e.target);
    week = $(e.target).parents('.week');
    if (!(week.hasClass('loaded'))) {
      return null;
    }
    id = $(e.target).attr('id');
    dateString = id.substring(this.config.dayIdPrefix.length);
    date = Date.parseYMD(dateString);
    // Create event in memory
    event = {
      isNew: true,
      summary: '',
      calNumber: 0,
      start: date,
      end: date.addDays(1),
      length: 1,
      editable: true
    };
    this.eventLoader.addEvent(event);
    return $('.new', day).click();
  };
  window.Calendar.prototype.eventChanged = function eventChanged(event, oldStartDate, oldEndDate) {
    var _a, startDate;
    // If event already exists then re-layout the weeks it used to be on
    if (oldStartDate && oldEndDate) {
      startDate = oldStartDate;
      while (startDate.getDay() !== 1) {
        startDate = startDate.addDays(-1);
      }
      while (startDate < oldEndDate) {
        this.eventLayoutManager.layoutEventsForWeek(startDate, this.eventLoader.getCachedEvents(startDate, startDate.addDays(6)));
        startDate = startDate.addWeeks(1);
      }
    }
    // Re-layout the weeks the event is now on
    startDate = event.start;
    while (startDate.getDay() !== 1) {
      startDate = startDate.addDays(-1);
    }
    _a = [];
    while (startDate < event.end) {
      _a.push((function() {
        this.eventLayoutManager.layoutEventsForWeek(startDate, this.eventLoader.getCachedEvents(startDate, startDate.addDays(6)));
        startDate = startDate.addWeeks(1);
        return startDate;
      }).call(this));
    }
    return _a;
  };
})();
