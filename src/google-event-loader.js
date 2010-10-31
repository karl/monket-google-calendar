(function() {
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  MKT.GoogleEventLoader = function(service, loading) {
    this.service = service;
    this.loading = loading;
    this.cache = {};
    this.addEventHook = function() {};
    this.updateEventHook = function() {};
    this.removeEventHook = function() {};
    return this;
  };
  MKT.GoogleEventLoader.prototype.init = function(successCallback, failureCallback) {
    this.loading.show();
    return this.service.getAllCalendarsFeed('http://www.google.com/calendar/feeds/default/allcalendars/full', __bind(function(result) {
      var _i, _len, _ref, accessValue, calendar;
      this.loading.hide();
      this.calendars = result.feed.entry;
      _ref = this.calendars;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        calendar = _ref[_i];
        accessValue = calendar.getAccessLevel().getValue();
        calendar.editable = accessValue === google.gdata.calendar.AccessLevelProperty.VALUE_OWNER || accessValue === google.gdata.calendar.AccessLevelProperty.VALUE_EDITOR;
      }
      return successCallback();
    }, this), __bind(function() {
      this.loading.hide();
      return failureCallback();
    }, this));
  };
  MKT.GoogleEventLoader.prototype.getFeedUriForCalendar = function(calNumber) {
    var calendar;
    calendar = this.calendars[calNumber];
    return calendar.getLink().href;
  };
  MKT.GoogleEventLoader.prototype.load = function(startDate, endDate, successCallback, failureCallback) {
    var _i, _ref, _result, cacheEndDate, cacheStartDate, i;
    if (this.datesInCache(startDate, endDate)) {
      return successCallback(this.getCachedEvents(startDate, endDate), startDate, endDate);
    } else if (this.isLoading(startDate, endDate)) {
      return this.addCallbacks(startDate, endDate, successCallback, failureCallback);
    } else {
      cacheStartDate = new Date(startDate.getFullYear(), 0, 1);
      cacheEndDate = new Date(startDate.getFullYear() + 1, 0, 7);
      this.cache[this.getCacheKey(startDate)] = {
        remaining: this.calendars.length,
        entries: [],
        callbacks: []
      };
      this.loading.show();
      this.addCallbacks(startDate, endDate, successCallback, failureCallback);
      _result = []; _ref = this.calendars.length;
      for (_i = 0; (0 <= _ref ? _i < _ref : _i > _ref); (0 <= _ref ? _i += 1 : _i -= 1)) {
        (function() {
          var i = _i;
          return _result.push(this.loadFromGoogle(cacheStartDate, cacheEndDate, __bind(function(entries) {
            var cacheInfo;
            cacheInfo = this.cache[this.getCacheKey(startDate)];
            cacheInfo.remaining--;
            cacheInfo.entries = cacheInfo.entries.concat(entries);
            console.log("loaded " + (i) + " of " + (this.calendars.length) + ". " + (cacheInfo.remaining) + " remaining");
            this.fireCallbacks(cacheInfo, true);
            if (cacheInfo.remaining === 0) {
              console.log("No calendars remaining to load");
              this.clearCallbacks(cacheInfo);
              return this.loading.hide();
            }
          }, this), __bind(function() {
            var cacheInfo;
            cacheInfo = this.cache[this.getCacheKey(startDate)];
            cacheInfo.remaining--;
            console.log("Error Loading " + (i) + " of " + (this.calendars.length) + ". " + (cacheInfo.remaining) + " remaining");
            console.log(arguments);
            this.fireCallbacks(cacheInfo, false);
            if (cacheInfo.remaining === 0) {
              this.clearCallbacks(cacheInfo);
              return this.loading.hide();
            }
          }, this), i));
        }).call(this);
      }
      return _result;
    }
  };
  MKT.GoogleEventLoader.prototype.getCacheKey = function(startDate) {
    return startDate.getFullYear();
  };
  MKT.GoogleEventLoader.prototype.isLoading = function(startDate, endDate) {
    return !!this.cache[this.getCacheKey(startDate)];
  };
  MKT.GoogleEventLoader.prototype.datesInCache = function(startDate, endDate) {
    var cacheInfo;
    cacheInfo = this.cache[this.getCacheKey(startDate)];
    return cacheInfo && cacheInfo.remaining === 0;
  };
  MKT.GoogleEventLoader.prototype.addCallbacks = function(startDate, endDate, successCallback, failureCallback) {
    var cacheInfo;
    cacheInfo = this.cache[this.getCacheKey(startDate)];
    return cacheInfo.callbacks.push({
      success: successCallback,
      failure: failureCallback,
      startDate: startDate,
      endDate: endDate
    });
  };
  MKT.GoogleEventLoader.prototype.fireCallbacks = function(cacheInfo, success) {
    var _i, _len, _ref, _result, cb, entries;
    _result = []; _ref = cacheInfo.callbacks;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      cb = _ref[_i];
      _result.push((function() {
        if (success) {
          entries = this.getCachedEvents(cb.startDate, cb.endDate);
          return cb.success(entries, cb.startDate, cb.endDate);
        } else {
          return cb.failure(cb.startDate, cb.endDate);
        }
      }).call(this));
    }
    return _result;
  };
  MKT.GoogleEventLoader.prototype.clearCallbacks = function(cacheInfo) {
    return (cacheInfo.callbacks = []);
  };
  MKT.GoogleEventLoader.prototype.getCachedEvents = function(startDate, endDate) {
    var _i, _len, _ref, cacheEntries, cacheInfo, entries, entry;
    cacheInfo = this.cache[this.getCacheKey(startDate)];
    cacheEntries = cacheInfo.entries;
    entries = [];
    _ref = cacheEntries;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entry = _ref[_i];
      if (entry.end > startDate && (entry.start <= endDate)) {
        entries.push(entry);
      }
    }
    return entries;
  };
  MKT.GoogleEventLoader.prototype.loadFromGoogle = function(startDate, endDate, successCallback, failureCallback, calNumber) {
    var eventsCallback, query, startMax, startMin, uri;
    eventsCallback = __bind(function(result) {
      var _i, _len, _ref, entries, entry, event, results;
      entries = result.feed.entry;
      results = [];
      _ref = entries;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entry = _ref[_i];
        event = this.createEventFromGoogleEvent(entry, calNumber);
        if (event.end > startDate) {
          results.push(event);
        }
      }
      return successCallback(results, startDate, endDate);
    }, this);
    uri = this.getFeedUriForCalendar(calNumber);
    query = new google.gdata.calendar.CalendarEventQuery(uri);
    startMin = new google.gdata.DateTime(startDate);
    startMax = new google.gdata.DateTime(endDate);
    query.setMinimumStartTime(startMin);
    query.setMaximumStartTime(startMax);
    query.setSingleEvents(true);
    query.setMaxResults(500);
    query.setOrderBy('starttime');
    query.setSortOrder('a');
    return this.service.getEventsFeed(query, eventsCallback, failureCallback);
  };
  MKT.GoogleEventLoader.prototype.createEventFromGoogleEvent = function(entry, calNumber) {
    var editable, endDate, endTime, entryEndDate, entryStartDate, length, startTime, summary, times;
    times = entry.getTimes();
    if (times.length > 0) {
      startTime = times[0].getStartTime().getDate();
      entryStartDate = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
      endTime = times[0].getEndTime().getDate();
      endDate = new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate());
      length = Math.round((endDate - entryStartDate) / (1000 * 60 * 60 * 24));
      if ((endTime - endDate) > 0) {
        length = +1;
      }
      entryEndDate = entryStartDate.addDays(length);
    }
    summary = $.trim(entry.getTitle().getText());
    editable = this.calendars[calNumber].editable;
    return this.createEventObject(summary, calNumber, entryStartDate, entryEndDate, length, editable, entry);
  };
  MKT.GoogleEventLoader.prototype.createEventObject = function(summary, calNumber, start, end, length, editable, googleEvent, isNew) {
    var event;
    event = {
      summary: summary,
      calNumber: calNumber,
      start: start,
      end: end,
      length: length,
      editable: editable,
      googleEvent: googleEvent,
      isNew: isNew
    };
    event.save = __bind(function(success, failure, startCalNumber) {
      var endTime, event_when, startTime;
      if (event.googleEvent) {
        event.googleEvent.getTitle().setText(event.summary);
        startTime = new google.gdata.DateTime(event.start, true);
        endTime = new google.gdata.DateTime(event.end, true);
        event_when = new google.gdata.When();
        event_when.setStartTime(startTime);
        event_when.setEndTime(endTime);
        event.googleEvent.setTimes([event_when]);
        return (typeof startCalNumber !== "undefined" && startCalNumber !== null) && event.calNumber !== startCalNumber ? this.moveToNewCalendar(event, startCalNumber, success, failure) : this.saveChanges(event, success, failure);
      } else {
        event.isNew = false;
        return this.createEvent(event, success, failure);
      }
    }, this);
    event.remove = __bind(function(success, failure) {
      if (!(event.googleEvent)) {
        return success();
      }
      return event.googleEvent.deleteEntry(__bind(function() {
        this.removeEvent(event);
        return success();
      }, this), __bind(function() {
        return failure();
      }, this));
    }, this);
    return event;
  };
  MKT.GoogleEventLoader.prototype.addEvent = function(event) {
    var cacheInfo, startDate;
    startDate = event.start;
    cacheInfo = this.cache[this.getCacheKey(startDate)];
    cacheInfo.entries.push(event);
    return this.addEventHook(event);
  };
  MKT.GoogleEventLoader.prototype.createEvent = function(event, successCallback, failureCallback) {
    var entry, feedUri;
    entry = new google.gdata.calendar.CalendarEventEntry({
      title: {
        type: 'text',
        text: event.summary
      },
      times: [
        {
          startTime: new google.gdata.DateTime(event.start, true),
          endTime: new google.gdata.DateTime(event.end, true)
        }
      ]
    });
    feedUri = this.getFeedUriForCalendar(event.calNumber);
    return this.service.insertEntry(feedUri, entry, __bind(function(response) {
      event.googleEvent = response.entry;
      return successCallback();
    }, this), __bind(function() {
      return failureCallback();
    }, this), google.gdata.calendar.CalendarEventEntry);
  };
  MKT.GoogleEventLoader.prototype.saveChanges = function(event, success, failure) {
    return event.googleEvent.updateEntry(__bind(function(response) {
      event.googleEvent = response.entry;
      event.googleEvent.getSequence().setValue(event.googleEvent.getSequence().getValue() + 1);
      return success(response);
    }, this), __bind(function(response) {
      return failure(response);
    }, this));
  };
  MKT.GoogleEventLoader.prototype.moveToNewCalendar = function(event, oldCalNumber, success, failure) {
    var feedUri;
    event.googleEvent.getSequence().setValue(event.googleEvent.getSequence().getValue() + 1);
    feedUri = this.getFeedUriForCalendar(event.calNumber);
    return this.service.insertEntry(feedUri, event.googleEvent, __bind(function(response) {
      var newGoogleEvent;
      newGoogleEvent = response.entry;
      event.googleEvent = newGoogleEvent;
      event.googleEvent.getSequence().setValue(event.googleEvent.getSequence().getValue() + 1);
      return event.googleEvent.deleteEntry(__bind(function(response) {
        return success(response);
      }, this), __bind(function(response) {
        return failure(response);
      }, this));
    }, this), __bind(function(response) {
      return failure(response);
    }, this), google.gdata.calendar.CalendarEventEntry);
  };
  MKT.GoogleEventLoader.prototype.updateEvent = function(event, oldStart, oldEnd) {
    return this.updateEventHook(event, oldStart, oldEnd);
  };
  MKT.GoogleEventLoader.prototype.removeEvent = function(event) {
    var _ref, cacheEntries, cacheInfo, entry, i, startDate;
    startDate = event.start;
    cacheInfo = this.cache[this.getCacheKey(startDate)];
    cacheEntries = cacheInfo.entries;
    _ref = cacheEntries.length;
    for (i = 0; (0 <= _ref ? i < _ref : i > _ref); (0 <= _ref ? i += 1 : i -= 1)) {
      entry = cacheEntries[i];
      if (this.eventsAreEqual(event, entry)) {
        Array.remove(cacheEntries, i);
        this.removeEventHook(event);
        return null;
      }
    }
    return null;
  };
  MKT.GoogleEventLoader.prototype.eventsAreEqual = function(a, b) {
    return a.summary === b.summary && a.start === b.start && a.end === b.end;
  };
}).call(this);
