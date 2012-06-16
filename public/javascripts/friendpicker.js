$(document).ready(function(){
  
  var update_progress = function(percent) {
          $('.progress-bar span').css('width', percent);
          if (percent === '25%') {
                  $('.progress-message').text("Drawing friends from Facebook.");
          }
          else if (percent === '50%') {
                  $('.progress-message').text("Processing friends.");
          } else if (percent === '75%') {
                  $('.progress-message').text("Almost done. Sorry for the wait!");
          } else if (percent === '80%' || percent == '20%') {
                  $('.progress-message').text("Just give us one second! The first time you log in, this process could take a little while.");
          }
  }
  var placeholder = $('<div>').addClass('placeholder'),
          searchTimer,
          limit,
          education = {},
          education_ids = {},
          newHeight = $(window).height() - 550,


  newHeight = (newHeight < 200) ? 300 : newHeight;

  $('.friends').css('height', newHeight +'px');

  var education_sort = function(education, education_ids) {
          var education_sorted = [];
          for (var key in education){
                  education_sorted.push([key, education[key], education_ids[key]]);
          }

          education_sorted.sort(function(a,b) {
                  a = a[1];
                  b = b[1];
                  
                  return a < b ? 1 : (a > b ? -1 : 0);
          });
          
          return education_sorted;
  }
  
  
  update_progress('20%');
  load_friends();

  // request the user's friends
  function load_friends() {
      $.getJSON('/get_friends.json', function(data){
          update_progress("100%");
          var friends = data;
          friend_count = friends.length;
          friends.sort(function(a,b) {
                  a = a.name;
                  b = b.name;
                
                  return a < b ? -1 : (a > b ? 1 : 0);
          });
        
          $.each(friends, function(){
              var clone = '',
                  network;
                
          clone += '<li  data-id="'+ this.id +'">';
          clone += '<img src="'+ this.picture +'" />';
          clone += '<span>'+ this.name +'</span>';
          clone += '</li>';
  
          clone = $(clone);
          
        

            // append the string for the user's new friend to the friends string
          placeholder.append(clone);
              
              
          })
          var csrf = $('meta[name="csrf-token"]').attr('content');
          // stop and remove the pulse animation
          $('.progress-bar-container').remove();

          // append all of the user's friends at once, fade in.
          $('.friends-list').append(placeholder).fadeIn();

          $('form').append('<input type="hidden" name="authenticity_token" value="'+ csrf +'">');
    });
  }
  // event binding for the search filter
  $('.search-box').keyup(function(){
          if(typeof searchTimer != 'undefined'){
                  window.clearTimeout(searchTimer);
          }
          searchTimer = window.setTimeout(function(){
                  search($('.search-box').val().toLowerCase());
          }, 200);
  });

  function search(query) {
          $('.friends-list li span').each(function(){
                  if($(this).text().toLowerCase().indexOf(query) !== 0){
                          $(this).parent().addClass('search-disabled');
                  } else {
                          $(this).parent().removeClass('search-disabled');
                  }
          });
  }

  // event binding for adding a new friend
  $('.friends-list li').live('click', function(){
          var clone, gender, gender_word, id, name;
          
          // do nothing if the list is disabled
          if($('.friends-list').hasClass('disabled')){
                  return false;
          }
          

          if($(this).hasClass('selected') || ($(this).hasClass('premarked'))){
                  // the user has already added this friend, do nothing
                  return false;
          } else {
                  // the user is adding a friend
                  // disable the list until the process is complete
                  $('.friends-list').addClass('disabled');
                  $(this).addClass('selected');

                  // set up the color-class/diction based on gender
                  if($(this).hasClass('female')){
                          gender = "female";
                          gender_word = "her";
                  }       else if ($(this).hasClass('male')) {
                                  gender = "male";
                                  gender_word = "him";
                  } else {
                                  gender = "male";
                                  gender_word = "them";
                  }

                  name = $(this).find('span').text();
                  clone = $(this).clone();
                  id = $(this).attr('data-id');

                  // attach the user's id to the add-to-queue while it is active there
                  $('.add-to-queue').attr('data-id', id);

                  // replace the user's name/user's gender in the info text below
                  $('.add-to-queue').find('.name').text(name);
                  $('.add-to-queue').find('.gender').text(gender_word);

                  // slide up the add-to-queue menu
                  $('.add-to-queue').removeClass('male').removeClass('female').addClass(gender).slideDown();
                  
                  // append the user's image
                  $(clone).find('span').remove();
                  $('.add-to-queue .container .image').html($(clone).html()).addClass('pick');
          }
  });

  // event binding for adding a user to the queue
  $('.add-without-email').click(function(){
          var old_image = $(this).parent('.container').find('.image'),
                  name = $(this).parent('.container').find('.name').text();
                  image = $($(old_image).clone()),
                  id = $('.add-to-queue').attr('data-id'),
                  email = '',
                  phone = '';

          if($(this).hasClass('add-with-email')){
                  email = $('.add-to-queue .email').val();
                  if(email.length < 5){
                          return false;
                  }

                  phone = 'false';
          } else if($(this).hasClass('add-with-phone')){
                  phone = $('.add-to-queue .phone').val();
                  if(phone.length < 10){
                          return false;
                  }

                  email = 'false';
          } else {
                  email = 'false';
                  phone = 'false';
          }

          $('.add-to-queue .phone').val('');
          $('.add-to-queue .email').val('');

          $(old_image).html('');
          // give the image the user's id
          $(image).attr('data-id', id);

          $(image).attr('data-email', email);

          $(image).attr('data-phone', phone);

          // add the image to the queue
          $(image).append('<input type="hidden" name="friends[]" value="'+ id +'">');
          $(image).append('<a href="#" class="delete" data-id="'+ id +'">delete</a>');
          

          $('.picked').show();
          $('.picked .container').prepend(image);

          // slide down the menu
          $('.add-to-queue').slideUp();

          // let users interact with the friends list
          $('.friends-list').removeClass('disabled');
          
          if($('.picked .image').length === limit){
                  $('.friends-list').addClass('disabled');
                  $('.friends-limit').show();
          }
  });

  // event binding for choosing not to add that friend, after all
  $('.add-to-queue .cancel').click(function(){
          var id = $('.add-to-queue').attr('data-id');

          // slide down the menu
          $('.add-to-queue').slideUp();

          // let users interact with the friends list
          $('.friends-list').removeClass('disabled');

          // remove the "selected" attribute from the friend in the friends-list
          $('.friends-list').find('li[data-id='+ id +']').removeClass('selected');

          return false;
  });

  $('.pick').live('mouseover', function(){
          // the icon from this is from http://www.iconfinder.com/search/?q=iconset%3Abrightmix
          // and is licensed under WTFPL.

          $(this).find('.delete').show();
  }).live('mouseout', function(){
          $(this).find('.delete').hide();
  });

  $('.delete').live('click', function(){
          var id = $(this).parent('.image').attr('data-id');

          $(this).parent('.image').remove();
          if($('.picked .image').length == 0){
                  $('.picked').slideUp();
          }

          // remove the "selected" attribute from the friend in the friends-list
          $('.friends-list').find('li[data-id='+ id +']').removeClass('selected');

          $('.friends-list').removeClass('disabled');
          $('.friends-limit').hide();

          return false;
  });

});