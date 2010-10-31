(function() {
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  MKT.MonketCalendarConfig = function() {
    this.dateFormat = "#YYYY#-#MM#-#DD#";
    this.weekIdPrefix = "week-starting-";
    this.dayIdPrefix = "day-";
    this.eventColourPrefix = "colour-";
    return this;
  };
  MKT.Calendar = function(config, eventLoader, notification, eventLayoutManager, weekCreator, dayHighlighter) {
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
    this.updateInterval = setInterval(__bind(function() {
      return this.doUpdate();
    }, this), 1000 * 60 * 60);
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
    document.onselectstart = function() {
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
        this.scrollToWeekStarting(new Date().addWeeks(-1));
      }
      if (weeks) {
        return this.scrollToWeekStarting(this.topWeekStartDate.addWeeks(weeks));
      }
    }, this));
    this.notification.hide();
    return this;
  };
  MKT.Calendar.prototype.handlePanning = function(e) {
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
      return newWeek - this.topWeekStartDate !== 0 ? this.scrollToWeekStarting(newWeek) : null;
    }, this));
  };
  MKT.Calendar.prototype.getStartDate = function() {
    var startDate;
    startDate = this.getTodaysDate().addWeeks(-1);
    try {
      startDate = Date.parseYMD(location.hash.substring(1));
    } catch (exception) {
      console.log("Unable to parse location hash to date: " + location.hash + ", exception: " + exception);
    }
    return startDate;
  };
  MKT.Calendar.prototype.getTodaysDate = function() {
    var now;
    now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };
  MKT.Calendar.prototype.doScroll = function(event, delta) {
    var multiplier, week, weeks;
    multiplier = $.browser.mozilla ? -3 : -1;
    weeks = Math.round(delta * multiplier);
    week = this.topWeekStartDate.addWeeks(weeks);
    this.scrollToWeekStarting(week);
    return false;
  };
  MKT.Calendar.prototype.scrollToWeekStarting = function(date, offset, immediate) {
    var _ref, duration, weekDate;
    clearTimeout(this.finishedScrollingTimeout);
    weekDate = this.getWeekStartDate(date);
    this.createWeekElementsAsRequired(weekDate.addWeeks(-2));
    this.createWeekElementsAsRequired(weekDate.addWeeks(6));
    if (!(typeof (_ref = this.scrollingStartTime) !== "undefined" && _ref !== null)) {
      this.scrollingStartTime = new Date();
      this.scrollingStartWeek = this.topWeekStartDate;
    }
    this.topWeekStartDate = weekDate;
    this.topWeek = $("#" + this.config.weekIdPrefix + this.topWeekStartDate.customFormat(this.config.dateFormat));
    if (this.topWeek.length < 1) {
      throw "Unable to find week to scroll to. For date: " + date.customFormat(this.config.dateFormat);
    }
    this.updateCurrentMonthLabel();
    if ($("#body").queue().length > 1) {
      $("#body").queue("fx", [$("#body").queue().pop()]);
    }
    if (Math.abs(this.topWeekStartDate - this.scrollingStartWeek) > 3024000000) {
      this.showingScrollNotification = true;
    }
    if (this.showingScrollNotification) {
      this.notification.show(this.topWeekStartDate.addWeeks(2).customFormat("#MMMM#<br>#YYYY#"));
    }
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
  MKT.Calendar.prototype.setURLHash = function() {
    return (location.hash = this.topWeekStartDate.customFormat(this.config.dateFormat));
  };
  MKT.Calendar.prototype.finishedScrolling = function() {
    clearTimeout(this.finishedScrollingTimeout);
    clearTimeout(this.finishedScrollingTimeout2);
    if ($("#body").queue().length === 0) {
      this.setURLHash();
      document.title = this.topWeekStartDate.addWeeks(2).customFormat("#MMMM# - #YYYY#") + ' - Monket Google Calendar';
      this.finishedScrollingTimeout2 = setTimeout(__bind(function() {
        this.scrollingStartTime = null;
        return this.scheduleLoadData();
      }, this), 400);
      return (this.finishedScrollingTimeout = setTimeout(__bind(function() {
        this.notification.hide();
        return (this.showingScrollNotification = false);
      }, this), 1000));
    }
  };
  MKT.Calendar.prototype.createWeekElementsAsRequired = function(date) {
    var _result, currentDate, firstWeekDate, lastWeekDate, week;
    firstWeekDate = this.weekIdToDate($("#calendar .week:first").attr("id"));
    if (date < firstWeekDate) {
      currentDate = firstWeekDate.addWeeks(-1);
      while (currentDate >= date) {
        week = this.createWeek(currentDate);
        $("#body").prepend(week);
        currentDate = currentDate.addWeeks(-1);
      }
    }
    lastWeekDate = this.weekIdToDate($("#calendar .week:last").attr("id"));
    if (date > lastWeekDate) {
      currentDate = lastWeekDate.addWeeks(1);
      _result = [];
      while (currentDate <= date) {
        _result.push((function() {
          week = this.createWeek(currentDate);
          $("#body").append(week);
          return (currentDate = currentDate.addWeeks(1));
        }).call(this));
      }
      return _result;
    }
  };
  MKT.Calendar.prototype.updateCurrentMonthLabel = function() {
    return $("#current-month-label").text(this.topWeekStartDate.customFormat("#MMMM#"));
  };
  MKT.Calendar.prototype.buildWeeks = function(startDate) {
    var firstWeek, i;
    startDate = this.getWeekStartDate(startDate);
    firstWeek = startDate.addWeeks(-2);
    this.topWeekStartDate = startDate.addWeeks(-1);
    for (i = 0; i < 8; i++) {
      this.createWeek(firstWeek.addWeeks(i)).appendTo($("#body"));
    }
    return this.scrollToWeekStarting(startDate);
  };
  MKT.Calendar.prototype.createWeek = function(weekStart) {
    var week;
    week = this.weekCreator.create(weekStart);
    this.addWeekToUpdate(weekStart);
    return week;
  };
  MKT.Calendar.prototype.weekIdToDate = function(id) {
    var dateString;
    dateString = id.substring(this.config.weekIdPrefix.length);
    return Date.parseYMD(dateString);
  };
  MKT.Calendar.prototype.getWeekStartDate = function(date) {
    while (date.getDay() !== 1) {
      date = date.addDays(-1);
    }
    return date;
  };
  MKT.Calendar.prototype.doUpdate = function() {
    return this.dayHighlighter.highlightToday();
  };
  MKT.Calendar.prototype.addWeekToUpdate = function(date) {
    this.weeksToUpdate.push(date);
    return this.scheduleLoadData();
  };
  MKT.Calendar.prototype.scheduleLoadData = function() {
    if (this.scrollingStartTime) {
      return null;
    }
    return !this.loadDataTimeout && this.weeksToUpdate.length > 0 ? (this.loadDataTimeout = setTimeout(__bind(function() {
      return this.loadData();
    }, this), 10)) : null;
  };
  MKT.Calendar.prototype.loadData = function() {
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
        return (nearestDate = weekDate);
      }
    });
    Array.remove(this.weeksToUpdate, nearestIndex);
    return this.loadWeek(nearestDate);
  };
  MKT.Calendar.prototype.loadWeek = function(startDate) {
    $("#" + this.config.weekIdPrefix + startDate.customFormat(this.config.dateFormat)).removeClass('queued').addClass("loading");
    return this.eventLoader.load(startDate, startDate.addDays(6), __bind(function(events, startDate, endDate) {
      return this.eventLoadCallback(events, startDate, endDate);
    }, this), __bind(function(startDate, endDate) {
      return this.eventLoadFailed(startDate, endDate);
    }, this));
  };
  MKT.Calendar.prototype.eventLoadFailed = function(startDate, endDate) {
    $("#" + this.config.weekIdPrefix + startDate.customFormat(this.config.dateFormat)).addClass("failed-loading");
    return this.scheduleLoadData();
  };
  MKT.Calendar.prototype.eventLoadCallback = function(events, startDate, endDate) {
    try {
      this.eventLayoutManager.layoutEventsForWeek(startDate, events);
      $("#" + this.config.weekIdPrefix + startDate.customFormat(this.config.dateFormat)).removeClass("loading").addClass("loaded").animate({
        opacity: 1
      }, 200);
    } catch (exception) {
      console.log("Unable to update week.", exception);
    }
    return this.scheduleLoadData();
  };
  MKT.Calendar.prototype.doubleClick = function(e) {
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
    event = this.eventLoader.createEventObject('', 0, date, date.addDays(1), 1, true, null, true);
    this.eventLoader.addEvent(event);
    return $('.new', day).click();
  };
  MKT.Calendar.prototype.eventChanged = function(event, oldStartDate, oldEndDate) {
    var _result, startDate;
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
    startDate = event.start;
    while (startDate.getDay() !== 1) {
      startDate = startDate.addDays(-1);
    }
    _result = [];
    while (startDate < event.end) {
      _result.push((function() {
        this.eventLayoutManager.layoutEventsForWeek(startDate, this.eventLoader.getCachedEvents(startDate, startDate.addDays(6)));
        return (startDate = startDate.addWeeks(1));
      }).call(this));
    }
    return _result;
  };
}).call(this);
