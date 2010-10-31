(function() {
  MKT.Notification = function() {};
  MKT.Notification.prototype.show = function(text) {
    $("#notification-text").html(text);
    $("#notification").css("margin-left", parseInt($("#notification").width() / -2) + "px");
    $("#notification").css("margin-top", parseInt($("#notification").height() / -2) + "px");
    return $("#notification").fadeIn();
  };
  MKT.Notification.prototype.hide = function() {
    return $("#notification").fadeOut();
  };
}).call(this);
