(function(){
  $.debug(true);
  google.setOnLoadCallback(function() {
    var googleEventLoader, loading, login, myService, notification, scope;
    notification = new Notification();
    loading = new Loading();
    scope = "http://www.google.com/calendar/feeds/";
    notification.show("Checking Google Calendar access");
    if (google.accounts.user.checkLogin(scope)) {
      myService = new google.gdata.calendar.CalendarService("monket-calendar-2");
      googleEventLoader = new GoogleEventLoader(myService, loading);
      return googleEventLoader.init((function() {
        var calendar, colourMap, config, dayHighlighter, eventCreator, eventLayoutManager, weekCreator;
        colourMap = ColourMap;
        config = new MonketCalendarConfig();
        dayHighlighter = new DayHighlighter(config);
        eventCreator = new EventCreator(googleEventLoader, colourMap, config);
        weekCreator = new WeekCreator(config, dayHighlighter, googleEventLoader);
        eventLayoutManager = new EventLayoutManager(config, eventCreator);
        calendar = new Calendar(config, googleEventLoader, notification, eventLayoutManager, weekCreator, dayHighlighter);
        return calendar;
      }), function() {
        return notification.show("Unable to load Google Calendars");
      });
    } else {
      // still need to log in
      notification.hide();
      login = new Login(google.accounts.user, scope);
      return login.show();
    }
  });
})();
