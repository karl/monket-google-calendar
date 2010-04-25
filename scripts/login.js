(function(){
  window.Login = function Login(user, scope) {
    $('#login-button').click(function() {
      return user.login(scope);
    });
    return this;
  };
  window.Login.prototype.show = function show() {
    $("#login").removeClass("hidden");
    // Center the notification div
    $("#login").css("margin-left", parseInt($("#login").width() / -2) + "px");
    return $("#login").css("margin-top", parseInt($("#login").height() / -2) + "px");
  };
})();
