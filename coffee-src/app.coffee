# Define console.log if it does not exist
if not window.console then window.console = 
  log: ->

google.setOnLoadCallback ->
	notification = new MKT.Notification()
	loading = new MKT.Loading()
	
	scope = "http://www.google.com/calendar/feeds/"
	
	notification.show "Checking Google Calendar access"

	if google.accounts.user.checkLogin scope
		
		myService = new google.gdata.calendar.CalendarService "monket-calendar-2"
		googleEventLoader = new MKT.GoogleEventLoader myService, loading
		
		googleEventLoader.init ->
			colourMap = MKT.ColourMap
			config = new MKT.MonketCalendarConfig()
			dayHighlighter = new MKT.DayHighlighter config
			eventCreator = new MKT.EventCreator googleEventLoader, colourMap, config
			weekCreator = new MKT.WeekCreator config, dayHighlighter, googleEventLoader
			eventLayoutManager = new MKT.EventLayoutManager config, eventCreator
			calendar = new MKT.Calendar config, googleEventLoader, notification, eventLayoutManager, weekCreator, dayHighlighter
		, -> 
			notification.show "Unable to load Google Calendars" 
		
	else
		# still need to log in
		notification.hide()
		
		login = new MKT.Login(google.accounts.user, scope)
		login.show()

