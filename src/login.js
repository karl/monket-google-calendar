(function() {
  MKT.Login = function(user, scope) {
    $('#login-button').click(function() {
      return user.login(scope);
    });
    return this;
  };
  MKT.Login.prototype.show = function() {
    $("#login").removeClass("hidden");
    $("#login").css("margin-left", parseInt($("#login").width() / -2) + "px");
    return $("#login").css("margin-top", parseInt($("#login").height() / -2) + "px");
  };
}).call(this);
