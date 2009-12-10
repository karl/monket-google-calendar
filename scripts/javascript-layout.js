// TODO: Have a link that scrolls you straight to today
// TODO: Tidy this code further

function MonketCalendarConfig() {
	this.dateFormat = "#YYYY#-#MM#-#DD#";
	this.weekIdPrefix = "week-starting-";
	this.dayIdPrefix = "day-";
	this.eventColourPrefix = "colour-";
	this.updateURL = "update/";
}

function Calendar(config, eventLoader, notification, eventLayoutManager) {
	var me = this; // so that the object can always reference itself, even within event handlers
	
	this.config = config;
	this.eventLoader = eventLoader;
	this.notification = notification;
	this.eventLayoutManager = eventLayoutManager;

	this.events;
	this.topWeekStartDate;
	this.weeksToUpdate = [];
		
	me.constructor = function () {
		me.buildWeeks(me.getStartDate());
		me.updateInterval = setInterval(me.doUpdate, 1000 * 60 * 60); // update calendar every hour
		
		$("#body").mousewheel(me.doScroll);
		
		me.notification.hide();
 	};

	me.getStartDate = function() {
		// Work out the start date (either today or a date given on the location hash)
		var startDate = new Date().addWeeks(-1);		
		try {
			startDate = Date.parse(location.hash.substring(1));
		} catch (exception) {
			$.log("Unable to parse location hash to date: " + location.hash + ", exception: " + exception);
		}
		
		return startDate;
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
	
	me.highlightToday = function() {
		today = $("#" + me.config.dayIdPrefix + new Date().customFormat(me.config.dateFormat));
		me.highlightDay(today);
	};
	
	me.highlightDay = function(day) {
		$("#calendar .week td").removeClass("today");
		day = $(day);
		
		if (day.length > 0) {
			day.addClass("today");
		}
	};
	
	me.createWeek = function(weekStart) {
		// Clone the week template and set it's id to it's start date
		var week = $("#templates .week").clone().attr("id", me.config.weekIdPrefix + weekStart.customFormat(me.config.dateFormat));
		
		// Set the id of each day to that day's date 
		$("td", week).attr("id", function (j) {
			return me.config.dayIdPrefix + weekStart.addDays(j).customFormat(me.config.dateFormat);
		});
		
		// Set the day label for each day, e.g. '12'
		$(".day-label", week).each(function(j) {
			var dayDate = weekStart.addDays(j);
			var dayNumber = dayDate.customFormat("#D#");

			// If this is the first day in the month then add a month label, e.g. 'February'
			$(this).html(dayNumber);
			if (dayNumber == "1") {
				var monthLabel = $("#templates .month-label").clone().html(dayDate.customFormat("#MMMM#"));
				$(this).after(monthLabel);
				
				$(this).parent().addClass("start-month");
			}
			
			// if the this is todays date then highlight it
			if (dayDate.customFormat(me.config.dateFormat) == new Date().customFormat(me.config.dateFormat)) {
				me.highlightDay($(this).parent());
			}
			
		});


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
		me.highlightToday();
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
			$("#" + me.config.weekIdPrefix + startDate.customFormat(me.config.dateFormat)).removeClass("loading");
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
		
		
	me.constructor();
}