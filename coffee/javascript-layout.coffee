class window.MonketCalendarConfig 
	constructor: ->
		@dateFormat: "#YYYY#-#MM#-#DD#"
		@weekIdPrefix: "week-starting-"
		@dayIdPrefix: "day-"
		@eventColourPrefix: "colour-"

class window.Calendar
	constructor: (config, eventLoader, notification, eventLayoutManager, weekCreator, dayHighlighter) ->
		@config: config
		@eventLoader: eventLoader
		@notification: notification
		@eventLayoutManager: eventLayoutManager
		@weekCreator: weekCreator
		@dayHighlighter: dayHighlighter

		@weeksToUpdate: []

		@eventLoader.addEventHook: (event, oldStartDate, oldEndDate) => @eventChanged(event, oldStartDate, oldEndDate)
		@eventLoader.updateEventHook: (event, oldStartDate, oldEndDate) => @eventChanged(event, oldStartDate, oldEndDate)
		@eventLoader.removeEventHook: (event, oldStartDate, oldEndDate) => @eventChanged(event, oldStartDate, oldEndDate)
		
		@buildWeeks @getStartDate()
		@updateInterval: setInterval ( => @doUpdate() ), 1000 * 60 * 60 # update calendar every hour
		
		$("#body").mousewheel (e, delta) => @doScroll(e, delta)
		$('#body').dblclick (e) => @doubleClick(e)

		$('#body').mousedown (e) => @handlePanning(e)
		$(document).mouseup =>
			$('#body').unbind 'mousemove'
			$('body').css 'cursor', 'auto'
			@scrollToWeekStarting @topWeekStartDate

		document.onselectstart: -> false

		$(window).resize => @scrollToWeekStarting @topWeekStartDate

		$(document).keydown (e) =>
			return if $(e.target).parent().hasClass('editor')
			
			if e.keyCode == 38
				weeks: -1
			else if e.keyCode == 40
				weeks: 1
			else if e.keyCode == 33
				weeks: -4
			else if e.keyCode == 34
				weeks: 4;
			else if e.keyCode == 84
				# Scroll to today
				@scrollToWeekStarting new Date().addWeeks(-1)
			
			@scrollToWeekStarting @topWeekStartDate.addWeeks(weeks) if weeks
		
		@notification.hide()

	handlePanning: (e) ->
		return if $(e.target).parents().hasClass 'event'

		dayHeight: $("#calendar .week td:first").innerHeight()

		startY: e.pageY
		startWeekDate: @topWeekStartDate
		startWeek: $("#" + @config.weekIdPrefix + startWeekDate.customFormat(@config.dateFormat))
		$('body').css 'cursor', 'move'
		
		$('#body').mousemove (e) =>
			delta: -(e.pageY - startY)
			
			weeks: delta / 50
			weeks: if delta > 0 then Math.floor(weeks) else Math.ceil(weeks)
			
			newWeek: startWeekDate.addWeeks weeks
			if newWeek - @topWeekStartDate != 0
				@scrollToWeekStarting newWeek

	getStartDate: ->
		# Work out the start date (either today or a date given on the location hash)
		startDate: @getTodaysDate().addWeeks(-1)
		try
			startDate: Date.parseYMD location.hash.substring(1)
		catch exception
			$.log("Unable to parse location hash to date: " + location.hash + ", exception: " + exception);
		
		startDate
	
	getTodaysDate: ->
		now: new Date()
		new Date now.getFullYear(), now.getMonth(), now.getDate()

	doScroll: (event, delta) ->

		# Work out the start date of the new top week and scroll to it
		multiplier: if $.browser.mozilla then -3 else -1
		weeks: Math.round(delta * multiplier)
		week: @topWeekStartDate.addWeeks(weeks)
		@scrollToWeekStarting week

		false # prevent default scolling behaviour
	
	scrollToWeekStarting: (date, offset, immediate) ->
		clearTimeout @finishedScrollingTimeout
		
		weekDate: @getWeekStartDate date

		# Preload week elements as we near the edge of the currently loaded weeks
		@createWeekElementsAsRequired weekDate.addWeeks(-2)
		@createWeekElementsAsRequired weekDate.addWeeks(6)
				
		if !@scrollingStartTime?
			@scrollingStartTime: new Date()
			@scrollingStartWeek: @topWeekStartDate
				
		# Get the new top week
		@topWeekStartDate: weekDate
		@topWeek: $("#" + @config.weekIdPrefix + @topWeekStartDate.customFormat(@config.dateFormat))
		
		# TODO: Sometimes there is an error as new nodes are not yet in the DOM (seems to be fixed by preloading weeks)
		if @topWeek.length < 1
			throw "Unable to find week to scroll to. For date: " + date.customFormat(@config.dateFormat)
			
		@updateCurrentMonthLabel()

		# Make sure that only the currently executing animation is in the queue
		if $("#body").queue().length > 1
			$("#body").queue("fx", [ $("#body").queue().pop() ])

		if Math.abs(@topWeekStartDate - @scrollingStartWeek) > 3024000000
			@showingScrollNotification: true

		if @showingScrollNotification
			@notification.show @topWeekStartDate.addWeeks(2).customFormat("#MMMM#<br>#YYYY#")
		
		duration: if immediate then 0 else 200
		
		$("#body").scrollTo(@topWeek, duration, {easing : 'easeOutQuad', onAfter : ( => @finishedScrolling() ), offset: {top: offset} })
	
	setURLHash: ->
		location.hash: @topWeekStartDate.customFormat @config.dateFormat
	
	finishedScrolling: ->
		clearTimeout @finishedScrollingTimeout
		clearTimeout @finishedScrollingTimeout2
		
		if $("#body").queue().length == 0
			@setURLHash()
			document.title: @topWeekStartDate.addWeeks(2).customFormat("#MMMM# - #YYYY#") + ' - Monket Google Calendar'

			@finishedScrollingTimeout2: setTimeout ( =>
				@scrollingStartTime: null
				@scheduleLoadData()
			), 400
			
			@finishedScrollingTimeout: setTimeout ( =>
				@notification.hide()
				@showingScrollNotification: false
			), 1000
	
	createWeekElementsAsRequired: (date) ->
		# If the date is before the earliest first week
		firstWeekDate: @weekIdToDate $("#calendar .week:first").attr("id")
		if date < firstWeekDate
			# Create week elements and add them to body, from the first week down to the new date
			currentDate: firstWeekDate.addWeeks(-1)

			while currentDate >= date
				week: @createWeek currentDate
				$("#body").prepend week
				currentDate: currentDate.addWeeks(-1)

		
		# If the date is after the last week 
		lastWeekDate: @weekIdToDate $("#calendar .week:last").attr("id")
		if date > lastWeekDate
			# Create week elements and add them to the body, from the last week up to the new date
			currentDate: lastWeekDate.addWeeks 1
			while currentDate <= date
				week: @createWeek currentDate
				$("#body").append week
				currentDate: currentDate.addWeeks 1

	updateCurrentMonthLabel: ->
		$("#current-month-label").text @topWeekStartDate.customFormat("#MMMM#")
	
	buildWeeks: (startDate) ->
		startDate: @getWeekStartDate startDate
		firstWeek: startDate.addWeeks(-2)
		
		@topWeekStartDate: startDate.addWeeks(-1)

		# Create weeks for the first year surrounding the start date, and add them to the calendar body
		@createWeek(firstWeek.addWeeks(i)).appendTo($("#body")) for i in [0...8]
		
		# Scroll to the start date
		@scrollToWeekStarting startDate
	
	createWeek: (weekStart) ->
		week: @weekCreator.create weekStart
		@addWeekToUpdate weekStart
		week
	
	weekIdToDate: (id) ->
		dateString: id.substring @config.weekIdPrefix.length
		Date.parseYMD dateString
	
	getWeekStartDate: (date) ->
		while date.getDay() != 1
			date: date.addDays(-1) 
		date
	
	doUpdate: ->
		@dayHighlighter.highlightToday()
		# TODO: Update events from the server
	
	addWeekToUpdate: (date) ->
		@weeksToUpdate.push date
		@scheduleLoadData()
	
	scheduleLoadData: ->
		return if @scrollingStartTime

		if !@loadDataTimeout && @weeksToUpdate.length > 0
			@loadDataTimeout: setTimeout ( => @loadData() ), 10
	
	loadData: ->
		@loadDataTimeout: null
		middleWeekDate: @topWeekStartDate.addWeeks 2
		
		nearestDate: @weeksToUpdate[0]
		nearestIndex: 0
		nearestDifference: Math.abs(nearestDate - middleWeekDate)
		$.each @weeksToUpdate, (i, weekDate) ->
			difference: Math.abs(weekDate - middleWeekDate)
			if difference < nearestDifference
				nearestDifference: difference
				nearestIndex: i
				nearestDate: weekDate
		
		Array.remove @weeksToUpdate, nearestIndex
		@loadWeek nearestDate

	loadWeek: (startDate) ->
		$("#" + @config.weekIdPrefix + startDate.customFormat(@config.dateFormat))
			.removeClass('queued')
			.addClass("loading")
		@eventLoader.load startDate, startDate.addDays(6), ( (events, startDate, endDate) =>
			@eventLoadCallback(events, startDate, endDate)
		), (startDate, endDate) =>
			@eventLoadFailed(startDate, endDate)

	eventLoadFailed: (startDate, endDate) ->
		$("#" + @config.weekIdPrefix + date.customFormat(@config.dateFormat)).addClass("failed-loading")
		@scheduleLoadData()
	
	eventLoadCallback: (events, startDate, endDate) ->
		try
			# layout events in week
			@eventLayoutManager.layoutEventsForWeek startDate, events
			$("#" + @config.weekIdPrefix + startDate.customFormat(@config.dateFormat))
				.removeClass("loading")
				.addClass("loaded")
				.animate({opacity: 1}, 200)
		catch exception
			console.log "Unable to update week.", exception
			# Set failed-loading class on week
		
		@scheduleLoadData()

	doubleClick: (e) ->
		return unless $(e.target).hasClass('day')

		day: $(e.target)
		week: $(e.target).parents '.week'
		return unless week.hasClass 'loaded'
		
		id: $(e.target).attr 'id'
		dateString: id.substring @config.dayIdPrefix.length
		date: Date.parseYMD dateString

		event: @eventLoader.createEventObject '', 0, date, date.addDays(1), 1, true, null, true
		@eventLoader.addEvent event

		$('.new', day).click()		

	eventChanged: (event, oldStartDate, oldEndDate) ->
		# If event already exists then re-layout the weeks it used to be on
		if oldStartDate && oldEndDate
			startDate: oldStartDate
			while startDate.getDay() != 1
				startDate: startDate.addDays(-1)
			
			while startDate < oldEndDate
				@eventLayoutManager.layoutEventsForWeek(startDate, @eventLoader.getCachedEvents(startDate, startDate.addDays(6)))
				startDate: startDate.addWeeks 1
		
		# Re-layout the weeks the event is now on
		startDate: event.start
		while startDate.getDay() != 1
			startDate: startDate.addDays(-1)
		
		while startDate < event.end
			@eventLayoutManager.layoutEventsForWeek(startDate, @eventLoader.getCachedEvents(startDate, startDate.addDays(6)))
			startDate: startDate.addWeeks 1

