(function(){
  window.Notification = function Notification() {  };
  window.Notification.prototype.show = function show(text) {
    $("#notification-text").html(text);
    // Center the notification div
    $("#notification").css("margin-left", parseInt($("#notification").width() / -2) + "px");
    $("#notification").css("margin-top", parseInt($("#notification").height() / -2) + "px");
    return $("#notification").fadeIn();
  };
  window.Notification.prototype.hide = function hide() {
    return $("#notification").fadeOut();
  };
})();
