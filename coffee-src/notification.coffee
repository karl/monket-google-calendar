class MKT.Notification
	show: (text) ->
		$("#notification-text").html text

		# Center the notification div
		$("#notification").css "margin-left", parseInt($("#notification").width() / -2) + "px"
		$("#notification").css "margin-top", parseInt($("#notification").height() / -2) + "px"

		$("#notification").fadeIn()

	hide: ->
		$("#notification").fadeOut()

