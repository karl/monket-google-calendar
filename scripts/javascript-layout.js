// TODO: Tidy this code further

function MonketCalendarConfig() {
	this.dateFormat = "#YYYY#-#MM#-#DD#";
	this.weekIdPrefix = "week-starting-";
	this.dayIdPrefix = "day-";
	this.eventColourPrefix = "colour-";
}

function Calendar(config, eventLoader, notification, eventLayoutManager, weekCreator, dayHighlighter) {
	var me = this; // so that the object can always reference itself, even within event handlers
	
	me.config = config;
	me.eventLoader = eventLoader;
	me.notification = notification;
	me.eventLayoutManager = eventLayoutManager;
	me.weekCreator = weekCreator;
	me.dayHighlighter = dayHighlighter;

	me.events;
	me.topWeekStartDate;
	me.weeksToUpdate = [];
		
	me.constructor = function () {
		
		me.eventLoader.addEventHook = me.eventChanged;
		me.eventLoader.updateEventHook = me.eventChanged;
		me.eventLoader.removeEventHook = me.eventChanged;
		
		me.buildWeeks(me.getStartDate());
		me.updateInterval = setInterval(me.doUpdate, 1000 * 60 * 60); // update calendar every hour
		
		$("#body").mousewheel(me.doScroll);
		$('#body').dblclick(me.doubleClick);

		$(document).keydown(function(e) {
			if ($(e.target).parent().hasClass('editor')) {
				return;
			}
			
			var weeks;
			if (e.keyCode == 38) {
				weeks = -1;
			} else if (e.keyCode == 40) {
				weeks = 1;
			} else if (e.keyCode == 33) {
				weeks = -4;
			} else if (e.keyCode == 34) {
				weeks = 4;
			} else if (e.keyCode == 84) {
				me.scrollToWeekStarting(new Date().addWeeks(-1));
			}
			
			if (weeks) {
				me.scrollToWeekStarting(me.topWeekStartDate.addWeeks(weeks));
			}
		});
		
		me.notification.hide();
 	};

	me.getStartDate = function() {
		// Work out the start date (either today or a date given on the location hash)
		var startDate = me.getTodaysDate().addWeeks(-1);		
		try {
			startDate = Date.parse(location.hash.substring(1));
		} catch (exception) {
			$.log("Unable to parse location hash to date: " + location.hash + ", exception: " + exception);
		}
		
		return startDate;
	};
	
	me.getTodaysDate = function() {
		var now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), now.getDate());
	};

	me.doScroll = function(event, delta) {
		// Work out the start date of the new top week and scroll to it
		var multiplier = $.browser.mozilla ? -3 : -0.5;
		me.scrollToWeekStarting(me.topWeekStartDate.addWeeks(Math.round(delta * multiplier)));
		
		return false; // prevent default scolling behaviour
	};
	
	me.scrollToWeekStarting = function(date) {
		clearTimeout(me.finishedScrollingTimeout);
		
		weekDate = me.getWeekStartDate(date);

		// Preload week elements as we near the edge of the currently loaded weeks
		me.createWeekElementsAsRequired(weekDate.addWeeks(-2));
		me.createWeekElementsAsRequired(weekDate.addWeeks(6));
				
		// Get the new top week
		me.topWeekStartDate = weekDate;
		me.topWeek = $("#" + me.config.weekIdPrefix + me.topWeekStartDate.customFormat(me.config.dateFormat));
		
		
		// TODO: Sometimes there is an error as new nodes are not yet in the DOM (seems to be fixed by preloading weeks)
		if (me.topWeek.length < 1) {
			throw "Unable to find week to scroll to. For date: " + date.customFormat(me.config.dateFormat)	;
		}
			
		
		me.updateCurrentMonthLabel();

		// Make sure that only the currently executing animation is in the queue
		if ($("#body").queue().length > 1) {
			$("#body").queue("fx", [ $("#body").queue().pop() ]);
		}
		
		// Only show the notification if we have been scrolling for while
		if (me.scrollingStartTime == null) {
			me.scrollingStartTime = new Date();
		} else if (me.scrollingStartTime.getTime() + 500 < new Date().getTime()) {
			me.notification.show(me.topWeekStartDate.addWeeks(2).customFormat("#MMMM#<br>#YYYY#"));
		}
		
		$("#body").scrollTo(me.topWeek, 200, {easing : 'easeOutQuad', onAfter : me.finishedScrolling });
	};
	
	me.setURLHash = function() {
		location.hash = me.topWeekStartDate.customFormat(me.config.dateFormat);
	};
	
	me.finishedScrolling = function() {
		clearTimeout(me.finishedScrollingTimeout);
		
		if ($("#body").queue().length == 0) {
			me.setURLHash();
			document.title = me.topWeekStartDate.addWeeks(2).customFormat("#MMMM# - #YYYY#") + ' - Monket Google Calendar';

			me.finishedScrollingTimeout = setTimeout(function() { 
				me.notification.hide(); 
				me.scrollingStartTime = null; 
			}, 1000);
		}
	};
	
	me.createWeekElementsAsRequired = function(date) {
		// If the date is before the earliest first week
		firstWeekDate = me.weekIdToDate($("#calendar .week:first").attr("id"));
		if (date < firstWeekDate) {
			
			// Create week elements and add them to body, from the first week down to the new date
			currentDate = firstWeekDate.addWeeks(-1);
			while (currentDate >= date) {
				
				week = me.createWeek(currentDate);
				$("#body").prepend(week);
				
				currentDate = currentDate.addWeeks(-1);
			}
		}
		
		// If the date is after the last week 
		lastWeekDate = me.weekIdToDate($("#calendar .week:last").attr("id"));
		if (date > lastWeekDate) {
			
			// Create week elements and add them to the body, from the last week up to the new date
			currentDate = lastWeekDate.addWeeks(1);
			while (currentDate <= date) {
				
				week = me.createWeek(currentDate);
				$("#body").append(week);
				
				currentDate = currentDate.addWeeks(1);
			}
		}
	};
	
	me.updateCurrentMonthLabel = function() {
		$("#current-month-label").text(me.topWeekStartDate.customFormat("#MMMM#"));
	};
	
	me.buildWeeks = function(startDate) {
		startDate = me.getWeekStartDate(startDate);
		
		firstWeek = startDate.addWeeks(-2);
		
		// Create weeks for the first year surrounding the start date, and add them to the calendar body
		for (var i = 0; i < 8; i++) {
			me.createWeek(firstWeek.addWeeks(i)).appendTo($("#body"));
		}
		
		// Scroll to the start date
		me.scrollToWeekStarting(startDate);
	};
	
	me.createWeek = function(weekStart) {
		var week = me.weekCreator.create(weekStart);
		me.addWeekToUpdate(weekStart);
		return week;
	};
	
	me.weekIdToDate = function(id) {
		dateString = id.substring(me.config.weekIdPrefix.length);
		return Date.parse(dateString);
	};
	
	me.getWeekStartDate = function(date) {
		while (date.getDay() != 1) {
			date = date.addDays(-1);
		}
		return date;
	};
	
	me.doUpdate = function() {
		me.dayHighlighter.highlightToday();
		// TODO: Update events from the server
	};
	
	me.addWeekToUpdate = function(date) {
		me.weeksToUpdate[me.weeksToUpdate.length] = date;

		me.scheduleLoadData();
	};
	
	me.scheduleLoadData = function() {
		if (me.scrollingStartTime) {
			setTimeout(me.scheduleLoadData);
		}
		
		if (me.loadDataTimeout == null && me.weeksToUpdate.length > 0) {
			me.loadDataTimeout = setTimeout(me.loadData, 10);
		}
	};
	
	me.loadData = function() {
		me.loadDataTimeout = null;
		
		var middleWeekDate = me.topWeekStartDate.addWeeks(2);
		
		var nearestDate = me.weeksToUpdate[0];
		var nearestIndex = 0;
		var nearestDifference = Math.abs(nearestDate - middleWeekDate);
		$.each(me.weeksToUpdate, function(i, weekDate) {
			var difference = Math.abs(weekDate - middleWeekDate);
			if (difference < nearestDifference) {
				nearestDifference = difference;
				nearestIndex = i;
				nearestDate = weekDate;
			}
		});
		
		Array.remove(me.weeksToUpdate, nearestIndex);
		
		me.loadWeek(nearestDate);
	};

	me.loadWeek = function(startDate) {
		$("#" + me.config.weekIdPrefix + startDate.customFormat(me.config.dateFormat))
			.removeClass('queued')
			.addClass("loading");
		me.eventLoader.load(startDate, startDate.addDays(6), me.eventLoadCallback, me.eventLoadFailed);		
	};

	me.eventLoadFailed = function(startDate, endDate) {
		$("#" + me.config.weekIdPrefix + date.customFormat(me.config.dateFormat)).addClass("failed-loading");
		me.scheduleLoadData();
	};
	
	me.eventLoadCallback = function(events, startDate, endDate) {
		try {
			// layout events in week
			me.eventLayoutManager.layoutEventsForWeek(startDate, events);
			$("#" + me.config.weekIdPrefix + startDate.customFormat(me.config.dateFormat)).removeClass("loading").addClass("loaded");
		} catch (exception) {
			$.log("Unable to update week." + exception);
			// Set failed-loading class on week
		}
		
		me.scheduleLoadData();
	};

	me.convertDates = function(events) {
		$.each(events, function (i, event) {
			event.start = Date.parse(event.start);
			event.end = Date.parse(event.end);
		});
		
		return events;
	};
	
	me.doubleClick = function(e) {
		if (!$(e.target).hasClass('day')) {
			return;
		}

		var day = $(e.target);
		var week = $(e.target).parents('.week');
		if (!week.hasClass('loaded')) {
			return;
		}
		
		var id = $(e.target).attr('id');
		var dateString = id.substring(me.config.dayIdPrefix.length);
		var date = Date.parse(dateString);
		
		var event = {
			isNew: true,
			summary: '',
			calNumber: 1,
			start: date,
			end: date.addDays(1),
			length: 1
		};
				
		me.eventLoader.addEvent(event);

		$('.new', day).click();			
		
	};
	
	me.eventChanged = function(event) {
		// Find affected weeks, and ensure they are refreshed
		var startDate = event.start;
		while (startDate.getDay() != 1) {
			startDate = startDate.addDays(-1);
		}
		
		// Will need to be updated for multiline events
		me.eventLayoutManager.layoutEventsForWeek(startDate, me.eventLoader.getCachedEvents(startDate, startDate.addDays(6)));
	};
			
	me.constructor();
}