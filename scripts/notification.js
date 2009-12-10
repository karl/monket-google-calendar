window.Notification = function() {
	var me = this;
	
	me.show = function(text) {
		$("#notification-text").html(text);
		$("#notification").removeClass("hidden");

		// Center the notification div
		$("#notification").css("margin-left", parseInt($("#notification").width() / -2) + "px");
		$("#notification").css("margin-top", parseInt($("#notification").height() / -2) + "px");
	};

	me.hide = function() {
		$("#notification").addClass("hidden");
	};
	
};
