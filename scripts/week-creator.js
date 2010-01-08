window.WeekCreator = function(config, dayHighlighter, eventLoader) {
	var me = this;
	me.config = config;
	me.dayHighlighter = dayHighlighter;
	me.eventLoader = eventLoader;
	
	me.create = function(weekStart) {
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
				me.dayHighlighter.highlightDay($(this).parent());
			}
			
		});
		
		$('.day', week).droppable({
			hoverClass: 'ui-state-hover',
			tolerance: 'pointer',
			drop: function(ev, ui) {
				// Get date from day
				var id = $(this).attr('id');
				var dateString = id.substring(me.config.dayIdPrefix.length);
				var date = Date.parse(dateString);



				var event = ui.draggable.data('event');
				
				if ((event.start - date) == 0) {
					return;
				}
				
				ui.draggable.draggable('option', 'revert', false);

				var oldStart = event.start;
				var oldEnd = event.end;
				
				event.start = date;
				event.end = date.addDays(event.length);
				
				
				// re-render affected weeks
				me.eventLoader.updateEvent(event, oldStart, oldEnd);	




				// Update google event
				var when = new google.gdata.When();
				var startTime = new google.gdata.DateTime(event.start, true);
				var endTime = new google.gdata.DateTime(event.end, true);
				when.setStartTime(startTime);
				when.setEndTime(endTime);
				event.googleEvent.setTimes([when]);

				event.googleEvent.updateEntry(function(response) {

					console.log('Updated event!', arguments);
					event.googleEvent = response.entry;
					event.googleEvent.getSequence().setValue(event.googleEvent.getSequence().getValue() + 1);
				
				
				}, function() {

					console.log('Failed to update event :(', arguments);
				
				});
				
				
			}
		});
		
		
		return week;
	};	
};