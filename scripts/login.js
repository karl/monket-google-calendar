window.Login = function(user, scope) {
	var me = this;
	me.user = user;
	me.scope = scope;

	me.init = function() {
		$('#login-button').click(me.doLogin);
	};
	
	me.show = function() {
		$("#login").removeClass("hidden");
		
		// Center the notification div
		$("#login").css("margin-left", parseInt($("#login").width() / -2) + "px");
		$("#login").css("margin-top", parseInt($("#login").height() / -2) + "px");
	};
	
	me.doLogin = function() {
		me.user.login(me.scope);		
	}
}