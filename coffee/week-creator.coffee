class window.WeekCreator
	constructor: (config, dayHighlighter, eventLoader) ->
		@config: config
		@dayHighlighter: dayHighlighter
		@eventLoader: eventLoader
		
	create: (weekStart) ->
		# Clone the week template and set it's id to it's start date
		week: $("#templates .week").clone().attr "id", @config.weekIdPrefix + weekStart.customFormat(@config.dateFormat)
		week.css 'opacity', 0.3

		# Set the id of each day to that day's date 
		$("td", week).attr "id", (index) =>
			@config.dayIdPrefix + weekStart.addDays(index).customFormat(@config.dateFormat);
		
		# Set the day label for each day, e.g. '12'
		@add_day_label label, index, weekStart for label, index in $('.day-label', week)
			
		return week

	add_day_label: (label, index, weekStart) ->
		dayDate: weekStart.addDays index
		dayNumber: dayDate.customFormat "#D#"
		$(label).html dayNumber

		# If this is the first day in the month then add a month label, e.g. 'February'
		@add_month_label dayDate, label if dayNumber == "1"
		
		# if the this is todays date then highlight it
		if dayDate.customFormat(@config.dateFormat) == new Date().customFormat(@config.dateFormat)
			@dayHighlighter.highlightDay $(label).parent()
		

	add_month_label: (dayDate, label) ->
		monthLabel: $("#templates .month-label").clone().html dayDate.customFormat("#MMMM#")
		$(label).after monthLabel
		$(label).parent().addClass "start-month"
		