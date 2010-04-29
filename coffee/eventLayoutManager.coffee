class window.EventLayoutManager
	constructor: (config, eventCreator) ->
		@config: config
		@eventCreator: eventCreator
		
		# Create an event that we can use for working out attributes of events before displaying them
		$("#templates .event").clone().appendTo($("#layout-test")).attr("id", "layout-event")
		
		@recalculateConstants: true
		
		$(window).resize @resize
		
	resize: ->
		@recalculateConstants: true
		
		clearTimeout @resizeTimeout
		@resizeTimeout: setTimeout(( ->
			console.log 're-layout weeks'
		), 500)
		
	# only recaculate constants if they need redefining (e.g. first layout or browser resize)
	getConstants: ->
		@calculateConstants() if @recalculateConstants

	# must be called after the first week has been added to the DOM
	calculateConstants: ->
		# Empty text so we are sure that we calculate single line height
		$("#layout-event .text").text ""
	
		@dayWidth: $("#calendar .week td:first").width()
		@dayHeight: $("#calendar .week td:first").innerHeight()
		@lineHeight: $("#layout-event").outerHeight()
		@linesPerDay: 1000
		# Math.floor(@dayHeight / @lineHeight) - 1 # -1 line for the date marker in top right of each day

		# set width of test event to single day
		$("#layout-event").width @dayWidth

	# In order to lay out events we divide the week into a grid
	# The columns of the grid represent each day
	# The rows represent a number of lines (each line is tall enough for a single line event)
	# 
	# We work out how many cells a given event needs 
	# (e.g. two vertical cells if text spans two lines, or 3 columns for a 3 day event)
	# We see if we can fit the event in the grid
	# If we can, then we mark those cells in the grid as used
	layoutEventsForWeek: (weekDate, events) ->
		@getConstants()

		@initLayoutGridForWeek weekDate
		preppedEvents: @prepareEvents weekDate, events

		week: $("#" + @config.weekIdPrefix + weekDate.customFormat(@config.dateFormat))
		$('.event', week).remove()
			
		for event in preppedEvents
			@placeEvent event
	
		# TODO: Have 'show more' link appear if more events than will fit in a day
		# foreach day
		#   if show-more count > 0
		#     display 'X more' link 
	
	placeEvent: (event) ->
		eventDOM: @eventCreator.create event

		# Now attempt to find a line where we can place the event
		startLine: @findLineForEvent event
		if startLine != null
			eventDOM.css({ 
				top: (startLine + 1) * @lineHeight
			})
			eventDOM.appendTo $("#" + @config.dayIdPrefix + event.weekStart.customFormat(@config.dateFormat))
			
			@markLayoutSpaceAsUsed event, startLine
		else
			# increment show-more count for all days the event spans
			$.log("No room to place event: " + event.summary)

	initLayoutGridForWeek: (weekDate) ->
		# initialise layoutGrid array
		@layoutGrid: []

		row: 0
		while row < @linesPerDay
			@layoutGrid[row]: {}

			day: 0
			while day < 7
				index: weekDate.addDays day
				@layoutGrid[row][index]: 0
				day++
			row++
			null

	prepareEvents: (weekDate, events) ->
		# convert the events object to an array so we can sort it
		# also add in some extra fields that speed up processing
		preppedEvents: []
		
		for event in events
			event.weekStart: if event.start < weekDate then weekDate else event.start
			event.weekEnd: if event.end > weekDate.addWeeks(1) then weekDate.addWeeks(1) else event.end
			event.weekLength: Math.round((event.weekEnd.getTime() - event.weekStart.getTime()) / (1000 * 60 * 60 * 24))
			
			event.isStart: event.start >= weekDate
			event.isEnd: event.end <= weekDate.addWeeks(1)

			event.requiredLines: if event.isStart && event.isEnd then @getRequiredLines(event) else 1
			
			preppedEvents[preppedEvents.length]: event

		# order events by num of days, then by text length
		preppedEvents.sort @eventSort

		return preppedEvents

	getRequiredLines: (event) ->
		text: event.summary
		textEl: $("#layout-event .text")
		
		textEl.text(text)
		$("#layout-event").width((event.weekLength * 14.2857) + "%")
		return Math.ceil(textEl.outerHeight() / @lineHeight)

	findLineForEvent: (event) ->

		i: 0
		while i <= @layoutGrid.length - event.requiredLines
			isSpace: 0
			j: i
			while j < i + event.requiredLines
				date: event.weekStart
				while date < event.weekEnd
					isSpace += @layoutGrid[j][date]
					date: date.addDays 1
				j++
			return i if isSpace == 0
			i++
		return null;

	markLayoutSpaceAsUsed: (event, startLine) ->
		j: startLine
		while j < (startLine + event.requiredLines)
			date: event.weekStart
			while date < event.weekEnd
				@layoutGrid[j][date]: 1
				date: date.addDays 1
			j++
			null

	# order events by week length, then by text length
	eventSort: (eventA, eventB) ->
		if eventB.weekLength == eventA.weekLength
			if eventB.length == eventA.length
				return eventB.summary.length - eventA.summary.length
			else
				return eventB.length - eventA.length
		else
			return eventB.weekLength - eventA.weekLength
