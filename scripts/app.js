google.load("gdata", "1");

$.debug(true);

google.setOnLoadCallback(function() {
	var notification = new Notification();
	var loading = new Loading();

	var scope = "http://www.google.com/calendar/feeds/";
    
	notification.show('Checking Google Calendar access');
    if (google.accounts.user.checkLogin(scope)) {

		var myService = new google.gdata.calendar.CalendarService('monket-calendar-2');
		var googleEventLoader = new GoogleEventLoader(myService, loading);
		
		googleEventLoader.init(function() {
			
			var colourMap = ColourMap;
			var config = new MonketCalendarConfig();
			var eventCreator = new EventCreator(googleEventLoader, colourMap);
			var eventLayoutManager = new EventLayoutManager(config, eventCreator);
			var calendar = new Calendar(config, googleEventLoader, notification, eventLayoutManager);
			
		}, function() {
			notification.show('Unable to load Google Calendars');
		});

    } else {
        // still need to log in
		notification.hide();

		var login = new Login(google.accounts.user, scope);
		login.init();
		login.show();
    }
	
});