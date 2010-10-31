class MKT.Login
	constructor: (user, scope) ->
		$('#login-button').click ->
			user.login scope

	show: ->
		$("#login").removeClass "hidden"
	
		# Center the notification div
		$("#login").css "margin-left", parseInt($("#login").width() / -2) + "px"
		$("#login").css "margin-top", parseInt($("#login").height() / -2) + "px"

