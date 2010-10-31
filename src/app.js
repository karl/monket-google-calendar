(function() {
  if (!window.console) {
    window.console = {
      log: function() {}
    };
  }
  google.setOnLoadCallback(function() {
    var googleEventLoader, loading, login, myService, notification, scope;
    notification = new MKT.Notification();
    loading = new MKT.Loading();
    scope = "http://www.google.com/calendar/feeds/";
    notification.show("Checking Google Calendar access");
    if (google.accounts.user.checkLogin(scope)) {
      myService = new google.gdata.calendar.CalendarService("monket-calendar-2");
      googleEventLoader = new MKT.GoogleEventLoader(myService, loading);
      return googleEventLoader.init(function() {
        var calendar, colourMap, config, dayHighlighter, eventCreator, eventLayoutManager, weekCreator;
        colourMap = MKT.ColourMap;
        config = new MKT.MonketCalendarConfig();
        dayHighlighter = new MKT.DayHighlighter(config);
        eventCreator = new MKT.EventCreator(googleEventLoader, colourMap, config);
        weekCreator = new MKT.WeekCreator(config, dayHighlighter, googleEventLoader);
        eventLayoutManager = new MKT.EventLayoutManager(config, eventCreator);
        return (calendar = new MKT.Calendar(config, googleEventLoader, notification, eventLayoutManager, weekCreator, dayHighlighter));
      }, function() {
        return notification.show("Unable to load Google Calendars");
      });
    } else {
      notification.hide();
      login = new MKT.Login(google.accounts.user, scope);
      return login.show();
    }
  });
}).call(this);
