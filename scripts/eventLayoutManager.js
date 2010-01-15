
// Lays out events using javascript
function EventLayoutManager(config, eventCreator) {
	var me = this;
	this.config = config;
	this.eventCreator = eventCreator;

	this.recaculateConstants;

	this.dayWidth;
	this.dayHeight;
	this.linesHeight;
	this.linesPerDay;
	
	me.constructor = function() {
		// Create an event that we can use for working out attributes of events before displaying them
		$("#templates .event").clone().appendTo($("#layout-test")).attr("id", "layout-event");
		
		me.recaculateConstants = true;
		// TODO: recaculate constants on browser resize
	};

	// only recaculate constants if they need redefining (e.g. first layout or browser resize)
	me.getConstants = function() {
		if (me.recaculateConstants) {
			me.calculateConstants();
		}
	};

	// must be called after the frist week has been added to the DOM
	me.calculateConstants = function() {
		// Empty text so we are sure that we calculate single line height
		$("#layout-event .text").text("");
		
		me.dayWidth = $("#calendar .week td:first").width();
		me.dayHeight = $("#calendar .week td:first").innerHeight();
		me.lineHeight = $("#layout-event").outerHeight();
		me.linesPerDay = 1000; // Math.floor(me.dayHeight / me.lineHeight) - 1;  // -1 line for the date marker in top right of each day

		// set width of test event to single day
		$("#layout-event").width(me.dayWidth);
	};
	
	// In order to lay out events we divide the week into a grid
	// The columns of the grid represent each day
	// The rows represent a number of lines (each line is tall enough for a single line event)
	//
	// We work out how many cells a given event needs 
	// (e.g. two vertical cells if text spans two lines, or 3 columns for a 3 day event)
	// We see if we can fit the event in the grid
	// If we can, then we mark those cells in the grid as used
	me.layoutEventsForWeek = function(weekDate, events) {
		me.getConstants();

		me.initLayoutGridForWeek(weekDate);
		preppedEvents = me.prepareEvents(weekDate, events);

		var week = $("#" + me.config.weekIdPrefix + weekDate.customFormat(me.config.dateFormat));
		$('.event', week).remove();
				
		// foreach event
		$.each(preppedEvents, function(i, event) {
			me.placeEvent(event);
		});
		
		
		// TODO: Have 'show more' link appear if more events than will fit in a day
		// foreach day
		//   if show-more count > 0
		//     display 'X more' link 
		
	};
	
	me.placeEvent = function(event) {
		var eventDOM = me.eventCreator.create(event);

		// Now attempt to find a line where we can place the event
		startLine = me.findLineForEvent(event);
		if (startLine != null) {
			eventDOM.css({ 
				top: (startLine + 1) * me.lineHeight
//				display: 'none'
			});
			eventDOM.appendTo($("#" + me.config.dayIdPrefix + event.weekStart.customFormat(me.config.dateFormat)));	
//			eventDOM.fadeIn();
			
			me.markLayoutSpaceAsUsed(event, startLine);	
		} else {
			// increment show-more count for all days the event spans
			$.log("No room to place event: " + event.summary);
		}
	};
	
	me.initLayoutGridForWeek = function(weekDate) {
		// initialise layoutGrid array
		me.layoutGrid = new Array();
		for (var i = 0; i < me.linesPerDay; i++) {
			me.layoutGrid[i] = new Object();
			for (var j = 0; j < 7; j++) {
				var index = weekDate.addDays(j);
				me.layoutGrid[i][index] = 0;
			}
		}
	};
	
	me.prepareEvents = function(weekDate, events) {
		
		// convert the events object to an array so we can sort it
		// also add in some extra fields that speed up processing
		preppedEvents = new Array();
		for (var i in events) {
			
			var event = events[i];
			event.weekStart = (event.start < weekDate) ? weekDate : event.start;
			event.weekEnd = (event.end > weekDate.addWeeks(1)) ? weekDate.addWeeks(1) : event.end;
			event.weekLength = Math.round((event.weekEnd.getTime() - event.weekStart.getTime()) / (1000 * 60 * 60 * 24));
			event.requiredLines = event.length == 1 ? me.getRequiredLines(event) : 1;
			
			event.isStart = (event.start >= weekDate);
			event.isEnd = (event.end <= weekDate.addWeeks(1));
			
			preppedEvents[preppedEvents.length] = event;
		}

		// order events by num of days, then by text length
		preppedEvents.sort(me.eventSort);

		return preppedEvents;
	};
	
	me.getRequiredLines = function(event) {
		var text = event.summary;
		var textEl = $("#layout-event .text");
		
		textEl.text(text);
		$("#layout-event").width((event.weekLength * 14.2857) + "%");			
		return Math.ceil(textEl.outerHeight() / me.lineHeight);
	};
	
	me.findLineForEvent = function(event) {
		for (var i = 0; i <= (me.layoutGrid.length - event.requiredLines); i++ ) {
			isSpace = 0;
			for (var j = i; j < (i + event.requiredLines); j++) {
				for (var date = event.weekStart; date < event.weekEnd; date = date.addDays(1)) {
					isSpace += me.layoutGrid[j][date];
				}
			}
			if (isSpace == 0) {
				return i;
			}
		}
		return null;
	};
	
	me.markLayoutSpaceAsUsed = function(event, startLine) {
		for (var j = startLine; j < (startLine + event.requiredLines); j++) {
			for (var date = event.weekStart; date < event.weekEnd; date = date.addDays(1)) {
				me.layoutGrid[j][date] = 1;
			}
		}
	};
	
	// order events by week length, then by text length
	me.eventSort = function(eventA, eventB) {
		if (eventB.weekLength == eventA.weekLength) {
			if (eventB.length == eventA.length) {
				return eventB.summary.length - eventA.summary.length;
			} else {
				return eventB.length - eventA.length;
			}
		} else {
			return eventB.weekLength - eventA.weekLength;
		}
	};
	
	me.constructor();
}