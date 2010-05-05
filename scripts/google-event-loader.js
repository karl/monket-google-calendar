(function(){
  var __slice = Array.prototype.slice, __bind = function(func, obj, args) {
    return function() {
      return func.apply(obj || {}, args ? args.concat(__slice.call(arguments, 0)) : arguments);
    };
  };
  window.GoogleEventLoader = function GoogleEventLoader(service, loading) {
    this.service = service;
    this.loading = loading;
    this.cache = {};
    this.addEventHook = function addEventHook() {    };
    this.updateEventHook = function updateEventHook() {    };
    this.removeEventHook = function removeEventHook() {    };
    return this;
  };
  window.GoogleEventLoader.prototype.init = function init(successCallback, failureCallback) {
    this.loading.show();
    return this.service.getAllCalendarsFeed('http://www.google.com/calendar/feeds/default/allcalendars/full', (__bind(function(result) {
        var _a, _b, _c, accessValue, calendar;
        this.loading.hide();
        this.calendars = result.feed.entry;
        _b = this.calendars;
        for (_a = 0, _c = _b.length; _a < _c; _a++) {
          calendar = _b[_a];
          accessValue = calendar.getAccessLevel().getValue();
          calendar.editable = accessValue === google.gdata.calendar.AccessLevelProperty.VALUE_OWNER || accessValue === google.gdata.calendar.AccessLevelProperty.VALUE_EDITOR;
        }
        return successCallback();
      }, this)), __bind(function() {
        this.loading.hide();
        return failureCallback();
      }, this));
    // // if (localStorage && localStorage.offlineCache) {
    // //	me.offlineCache = JSON.parse(localStorage.offlineCache, function (key, value) {
    // //				 var a;
    // //				 if (typeof value === 'string') {
    // //					 a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
    // //					 if (a) {
    // //						 return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]));
    // //					 }
    // //				 }
    // //				 return value;
    // //			 });
    // // }
  };
  window.GoogleEventLoader.prototype.getFeedUriForCalendar = function getFeedUriForCalendar(calNumber) {
    var calendar;
    calendar = this.calendars[calNumber];
    return calendar.getLink().href;
  };
  window.GoogleEventLoader.prototype.load = function load(startDate, endDate, successCallback, failureCallback) {
    var _a, _b, _c, cacheEndDate, cacheStartDate, i;
    // // if (me.offlineCache && me.datesInOfflineCache(startDate, endDate)) {
    // //	successCallback(me.getOfflineCachedEvents(startDate, endDate), startDate, endDate);
    // // }
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
      _a = []; _b = 0; _c = this.calendars.length;
      for (i = _b; (_b <= _c ? i < _c : i > _c); (_b <= _c ? i += 1 : i -= 1)) {
        _a.push(this.loadFromGoogle(cacheStartDate, cacheEndDate, (__bind(function(entries) {
            var cacheInfo;
            cacheInfo = this.cache[this.getCacheKey(startDate)];
            cacheInfo.remaining--;
            cacheInfo.entries = cacheInfo.entries.concat(entries);
            this.fireCallbacks(cacheInfo, true);
            if (cacheInfo.remaining === 0) {
              this.clearCallbacks(cacheInfo);
              return this.loading.hide();
            }
            // // if (localStorage) {
            // //	localStorage.offlineCache = JSON.stringify(me.cache);
            // // }
          }, this)), (__bind(function() {
            var cacheInfo;
            cacheInfo = this.cache[this.getCacheKey(startDate)];
            cacheInfo.remaining--;
            this.fireCallbacks(cacheInfo, false);
            if (cacheInfo.remaining === 0) {
              this.clearCallbacks(cacheInfo);
              return this.loading.hide();
            }
          }, this)), i));
      }
      return _a;
    }
  };
  window.GoogleEventLoader.prototype.getCacheKey = function getCacheKey(startDate) {
    return startDate.getFullYear();
  };
  window.GoogleEventLoader.prototype.isLoading = function isLoading(startDate, endDate) {
    return !!this.cache[this.getCacheKey(startDate)];
  };
  window.GoogleEventLoader.prototype.datesInCache = function datesInCache(startDate, endDate) {
    var cacheInfo;
    cacheInfo = this.cache[this.getCacheKey(startDate)];
    return cacheInfo && cacheInfo.remaining === 0;
  };
  window.GoogleEventLoader.prototype.addCallbacks = function addCallbacks(startDate, endDate, successCallback, failureCallback) {
    var cacheInfo;
    cacheInfo = this.cache[this.getCacheKey(startDate)];
    return cacheInfo.callbacks.push({
      success: successCallback,
      failure: failureCallback,
      startDate: startDate,
      endDate: endDate
    });
  };
  window.GoogleEventLoader.prototype.fireCallbacks = function fireCallbacks(cacheInfo, success) {
    var _a, _b, _c, _d, cb, entries;
    _a = []; _c = cacheInfo.callbacks;
    for (_b = 0, _d = _c.length; _b < _d; _b++) {
      cb = _c[_b];
      _a.push((function() {
        if (success) {
          entries = this.getCachedEvents(cb.startDate, cb.endDate);
          return cb.success(entries, cb.startDate, cb.endDate);
        } else {
          return cb.failure(cb.startDate, cb.endDate);
        }
      }).call(this));
    }
    return _a;
  };
  window.GoogleEventLoader.prototype.clearCallbacks = function clearCallbacks(cacheInfo) {
    cacheInfo.callbacks = [];
    return cacheInfo.callbacks;
  };
  window.GoogleEventLoader.prototype.getCachedEvents = function getCachedEvents(startDate, endDate) {
    var _a, _b, _c, cacheEntries, cacheInfo, entries, entry;
    cacheInfo = this.cache[this.getCacheKey(startDate)];
    cacheEntries = cacheInfo.entries;
    entries = [];
    _b = cacheEntries;
    for (_a = 0, _c = _b.length; _a < _c; _a++) {
      entry = _b[_a];
      entry.end > startDate && entry.start <= endDate ? entries.push(entry) : null;
    }
    return entries;
  };
  //	// me.datesInOfflineCache = function(startDate, endDate) {
  //	//	var cacheInfo = me.offlineCache[me.getCacheKey(startDate)];
  //	//	return (cacheInfo && cacheInfo.remaining == 0);
  //	// };
  //	//
  //	// me.getOfflineCachedEvents = function(startDate, endDate) {
  //	//	var cacheInfo = me.offlineCache[me.getCacheKey(startDate)];
  //	//	var cacheEntries = cacheInfo.entries;
  //	//
  //	//	var entries = [];
  //	//	for (var i = 0; i < cacheEntries.length; i++) {
  //	//		var entry = cacheEntries[i];
  //	//
  //	//		if (entry.end > startDate && entry.start <= endDate) {
  //	//			entries.push(entry);
  //	//		}
  //	//	}
  //	//
  //	//	return entries;
  //	// }
  window.GoogleEventLoader.prototype.loadFromGoogle = function loadFromGoogle(startDate, endDate, successCallback, failureCallback, calNumber) {
    var eventsCallback, query, startMax, startMin, uri;
    eventsCallback = __bind(function(result) {
        var _a, _b, _c, endTime, entries, entry, entryendDate, entrystartDate, event, length, results, startTime, times;
        entries = result.feed.entry;
        results = [];
        _b = entries;
        for (_a = 0, _c = _b.length; _a < _c; _a++) {
          entry = _b[_a];
          times = entry.getTimes();
          if (times.length > 0) {
            startTime = times[0].getStartTime().getDate();
            entrystartDate = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
            endTime = times[0].getEndTime().getDate();
            endDate = new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate());
            // Get the whole number of days difference
            // And then add on any extra hours in the last day
            // Done like this to avoid issues when summer time changes
            length = Math.round((endDate - entrystartDate) / (1000 * 60 * 60 * 24));
            (endTime - endDate) > 0 ? length++ : null;
            entryendDate = entrystartDate.addDays(length);
          }
          event = {};
          event.summary = $.trim(entry.getTitle().getText());
          event.calNumber = calNumber;
          event.start = entrystartDate;
          event.end = entryendDate;
          event.length = length;
          event.editable = this.calendars[calNumber].editable;
          event.googleEvent = entry;
          if (entryendDate > startDate) {
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
  window.GoogleEventLoader.prototype.createEvent = function createEvent(event, successCallback, failureCallback) {
    var endTime, entry, feedUri, google_when, startTime;
    // Create an instance of CalendarEventEntry representing the new event
    entry = new google.gdata.calendar.CalendarEventEntry();
    // Set the title of the event
    entry.setTitle(google.gdata.Text.create(event.summary));
    // Create a When object that will be attached to the event
    google_when = new google.gdata.When();
    // Set the start and end time of the When object
    startTime = new google.gdata.DateTime(event.start, true);
    endTime = new google.gdata.DateTime(event.end, true);
    google_when.setStartTime(startTime);
    google_when.setEndTime(endTime);
    // Add the When object to the event
    entry.addTime(google_when);
    feedUri = this.getFeedUriForCalendar(event.calNumber);
    // Submit the request using the calendar service object
    return this.service.insertEntry(feedUri, entry, (__bind(function(response) {
        event.googleEvent = response.entry;
        return successCallback();
      }, this)), (__bind(function() {
        return failureCallback();
      }, this)), google.gdata.calendar.CalendarEventEntry);
  };
  window.GoogleEventLoader.prototype.saveChanges = function saveChanges(event, success, failure) {
    return event.googleEvent.updateEntry((__bind(function(response) {
        event.googleEvent = response.entry;
        return success(response);
      }, this)), __bind(function(response) {
        return failure(response);
      }, this));
  };
  window.GoogleEventLoader.prototype.moveToNewCalendar = function moveToNewCalendar(event, oldCalNumber, success, failure) {
    var feedUri;
    // Insert the entry into the new calendar
    // then if successful remove it from the old calendar
    feedUri = this.getFeedUriForCalendar(event.calNumber);
    return this.service.insertEntry(feedUri, event.googleEvent, (__bind(function(response) {
        var newGoogleEvent;
        newGoogleEvent = response.entry;
        return event.googleEvent.deleteEntry((__bind(function(response) {
            event.googleEvent = newGoogleEvent;
            event.googleEvent.getSequence().setValue(event.googleEvent.getSequence().getValue() + 1);
            return success(response);
          }, this)), __bind(function(response) {
            return failure(response);
          }, this));
      }, this)), (__bind(function(response) {
        return failure(response);
      }, this)), google.gdata.calendar.CalendarEventEntry);
  };
  window.GoogleEventLoader.prototype.addEvent = function addEvent(event) {
    var cacheInfo, startDate;
    startDate = event.start;
    cacheInfo = this.cache[this.getCacheKey(startDate)];
    cacheInfo.entries.push(event);
    return this.addEventHook(event);
  };
  window.GoogleEventLoader.prototype.updateEvent = function updateEvent(event, oldStart, oldEnd) {
    return this.updateEventHook(event, oldStart, oldEnd);
  };
  window.GoogleEventLoader.prototype.removeEvent = function removeEvent(event) {
    var _a, _b, cacheEntries, cacheInfo, entry, i, startDate;
    startDate = event.start;
    cacheInfo = this.cache[this.getCacheKey(startDate)];
    cacheEntries = cacheInfo.entries;
    _a = 0; _b = cacheEntries.length;
    for (i = _a; (_a <= _b ? i < _b : i > _b); (_a <= _b ? i += 1 : i -= 1)) {
      entry = cacheEntries[i];
      if (this.eventsAreEqual(event, entry)) {
        Array.remove(cacheEntries, i);
        this.removeEventHook(event);
        return null;
      }
    }
  };
  window.GoogleEventLoader.prototype.eventsAreEqual = function eventsAreEqual(a, b) {
    return a.summary === b.summary && a.start === b.start && a.end === b.end;
  };
})();
