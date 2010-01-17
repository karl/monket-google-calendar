window.WeekCreator = function(config, dayHighlighter, eventLoader) {
	var me = this;
	me.config = config;
	me.dayHighlighter = dayHighlighter;
	me.eventLoader = eventLoader;
	
	me.create = function(weekStart) {
		// Clone the week template and set it's id to it's start date
		var week = $("#templates .week").clone().attr("id", me.config.weekIdPrefix + weekStart.customFormat(me.config.dateFormat));
		week.css('opacity', 0.3);
		
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
		
		return week;
	};	
};