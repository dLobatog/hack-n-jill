function logResponse(response) {
  if (console && console.log) {
    console.log('The response was', response);
  }
}

$(function(){
  // Set up so we handle click on the buttons
  $('#postToWall').click(function() {
    FB.ui(
      {
        method : 'feed',
    link   : $(this).attr('data-url')
      },
      function (response) {
        // If response is null the user canceled the dialog
        if (response != null) {
          logResponse(response);
        }
      }
      );
  });

  $('#sendToFriends').click(function() {
    FB.ui(
      {
        method : 'send',
      link   : $(this).attr('data-url')
      },
      function (response) {
        // If response is null the user canceled the dialog
        if (response != null) {
          logResponse(response);
        }
      }
      );
  });

  $('#sendRequest').click(function() {
    FB.ui(
      {
        method  : 'apprequests',
      message : $(this).attr('data-message')
      },
      function (response) {
        // If response is null the user canceled the dialog
        if (response != null) {
          logResponse(response);
        }
      }
      );
  });
});  

window.fbAsyncInit = function() {
  FB.init({
    appId      : "<%= @app['id'] %>",                     // App ID
    channelUrl : "<%= url_no_scheme('/channel.html') %>", // Channel File
    status     : true,                                    // check login status
    cookie     : true,                                    // enable cookies to allow the server to access the session
    xfbml      : true                                     // parse XFBML
  });

  // Listen to the auth.login which will be called when the user logs in
  // using the Login button
  FB.Event.subscribe('auth.login', function(response) {
    // We want to reload the page now so Ruby can read the cookie that the
    // Javascript SDK sat. But we don't want to use
    // window.location.reload() because if this is in a canvas there was a
    // post made to this page and a reload will trigger a message to the
    // user asking if they want to send data again.
    window.location = window.location;
  });

  FB.Canvas.setAutoGrow();
};

// Load the SDK Asynchronously
(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/all.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk')); 
