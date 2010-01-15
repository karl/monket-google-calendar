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

		$('#body').mousedown(me.handlePanning);
		$(document).mouseup(function() {
			$('#body').unbind('mousemove');
			$('body').css('cursor', 'auto');
			me.scrollToWeekStarting(me.topWeekStartDate);				
		});
		document.onselectstart = function () { return false; };

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

	me.handlePanning = function(e) {
		if ($(e.target).parents().hasClass('event')) {
			return;
		}

		var dayHeight = $("#calendar .week td:first").innerHeight();

		var startY = e.pageY;
		var startWeekDate = me.topWeekStartDate;
		var startWeek = $("#" + me.config.weekIdPrefix + startWeekDate.customFormat(me.config.dateFormat));
		$('body').css('cursor', 'move');
		
		$(this).mousemove(function(e) {
			var delta = -(e.pageY - startY);
			
			// var weeks = delta / dayHeight;
			// weeks = delta > 0 ? Math.floor(weeks) : Math.ceil(weeks);
			// 
			// var offset = delta % dayHeight;

			var weeks = delta / 50;
			weeks = delta > 0 ? Math.floor(weeks) : Math.ceil(weeks);
			
			var newWeek = startWeekDate.addWeeks(weeks);
			if (newWeek - me.topWeekStartDate != 0) {
				me.scrollToWeekStarting(newWeek);				
				// me.scrollToWeekStarting(newWeek, offset, true);				
				// setTimeout(function() {
				// 	$('#body').scrollTo(me.topWeek, 0, {offset: {top: offset}});
				// }, 1);
			// } else {
				// $('#body').scrollTo(me.topWeek, 0, {offset: {top: offset}});
			}
		});
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
		var multiplier = $.browser.mozilla ? -3 : -1;
		me.scrollToWeekStarting(me.topWeekStartDate.addWeeks(Math.round(delta * multiplier)));
		
		return false; // prevent default scolling behaviour
	};
	
	me.scrollToWeekStarting = function(date, offset, immediate) {
		clearTimeout(me.finishedScrollingTimeout);
		
		weekDate = me.getWeekStartDate(date);

		// Preload week elements as we near the edge of the currently loaded weeks
		me.createWeekElementsAsRequired(weekDate.addWeeks(-2));
		me.createWeekElementsAsRequired(weekDate.addWeeks(6));
				
		if (me.scrollingStartTime == null) {
			me.scrollingStartTime = new Date();
			me.scrollingStartWeek = me.topWeekStartDate;
		}
				
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
		

		if (Math.abs(me.topWeekStartDate - me.scrollingStartWeek) > 3024000000) {
			me.showingScrollNotification = true;
		}

		if (me.showingScrollNotification) {
			me.notification.show(me.topWeekStartDate.addWeeks(2).customFormat("#MMMM#<br>#YYYY#"));
		}
		
		var duration = immediate ? 0 : 200;
		
		$("#body").scrollTo(me.topWeek, duration, {easing : 'easeOutQuad', onAfter : me.finishedScrolling, offset: {top: offset} });
	};
	
	me.setURLHash = function() {
		location.hash = me.topWeekStartDate.customFormat(me.config.dateFormat);
	};
	
	me.finishedScrolling = function() {
		clearTimeout(me.finishedScrollingTimeout);
		clearTimeout(me.finishedScrollingTimeout2);
		
		if ($("#body").queue().length == 0) {
			me.setURLHash();
			document.title = me.topWeekStartDate.addWeeks(2).customFormat("#MMMM# - #YYYY#") + ' - Monket Google Calendar';

				me.finishedScrollingTimeout2 = setTimeout(function() { 
					me.scrollingStartTime = null;
					me.scheduleLoadData();
				}, 400);
				
				me.finishedScrollingTimeout = setTimeout(function() { 
					me.notification.hide(); 
					me.showingScrollNotification = false;
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
			return;
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
			$("#" + me.config.weekIdPrefix + startDate.customFormat(me.config.dateFormat))
				.removeClass("loading")
				.addClass("loaded")
				.animate({opacity: 1}, 200);
		} catch (exception) {
			console.log("Unable to update week.", exception);
			// Set failed-loading class on week
		}
		
		me.scheduleLoadData();
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

	// Will need to be updated for multiline events
	me.eventChanged = function(event, oldStartDate, oldEndDate) {
		var startDate;

		if (oldStartDate && oldEndDate) {
			startDate = oldStartDate;
			while (startDate.getDay() != 1) {
				startDate = startDate.addDays(-1);
			}
			
			while (startDate < oldEndDate) {
				me.eventLayoutManager.layoutEventsForWeek(startDate, me.eventLoader.getCachedEvents(startDate, startDate.addDays(6)));
				startDate = startDate.addWeeks(1);				
			}

		}
		
		startDate = event.start;
		while (startDate.getDay() != 1) {
			startDate = startDate.addDays(-1);
		}
		
		while (startDate < event.end) {
			me.eventLayoutManager.layoutEventsForWeek(startDate, me.eventLoader.getCachedEvents(startDate, startDate.addDays(6)));
			startDate = startDate.addWeeks(1);				
		}
		
	};
			
	me.constructor();
}