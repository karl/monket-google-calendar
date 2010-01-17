window.Notification = function() {
	var me = this;
	
	me.show = function(text) {
		$("#notification-text").html(text);

		// Center the notification div
		$("#notification").css("margin-left", parseInt($("#notification").width() / -2) + "px");
		$("#notification").css("margin-top", parseInt($("#notification").height() / -2) + "px");

		$("#notification").fadeIn();
	};

	me.hide = function() {
		$("#notification").fadeOut();
	};
	
};
