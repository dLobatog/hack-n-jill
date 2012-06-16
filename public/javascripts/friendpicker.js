$(document).ready(function(){
        function partial(func /*, 0..n args */) {
          var args = Array.prototype.slice.call(arguments).splice(1);
          return function() {
            var allArguments = args.concat(Array.prototype.slice.call(arguments));
            return func.apply(this, allArguments);
          };
        }
        
        var update_progress = function(percent) {
                $('.progress-bar span').css('width', percent)
                if (percent === '25%') {
                        $('.progress-message').text("Drawing friends from Facebook. If you have a lot of friends, (1500+), this process could take a while (30 seconds) the first time you visit Like Secret. Feel free to click away from the page and return in a bit.")
                }
                else if (percent === '50%') {
                        $('.progress-message').text("Processing friends.")
                } else if (percent === '75%') {
                        $('.progress-message').text("Almost done. Sorry for the wait!")
                } else if (percent === '80%' || percent == '20%') {
                        $('.progress-message').text("Just give us one second! The first time you log in, this process could take a little while.")
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
        function load_friends(){
                $.getJSON('/get_friends.json', function(data){
                        update_progress("100%");
                        var marked = data.marked
                        var friends = data.friends
                        var type = data.facebook
                        limit = 15 - marked.length
                        friend_count = friends.length;
                        friends.sort(function(a,b) {
                                a = a.name;
                                b = b.name;
                                
                                return a < b ? -1 : (a > b ? 1 : 0);
                        })
                        $.each(friends, function(){
                                var clone = '',
                                        network;
                                        
                                // markup for a user's new friend
                                // TODO: is this the correct way to do this? I think not.
                if (type) {
                        clone += '<li class="'+ this.gender +'" data-id="'+ this.id +'">';
                        clone += '<img src="'+ this.picture +'" />';
                        clone += '<span>'+ this.name +'</span>';
                        clone += '</li>';
                } else {
                        clone += '<li class="'+ this.gender +'" data-id="'+ this._id +'">';
                        clone += '<img src="'+ this.picture +'" />';
                        clone += '<span>'+ this.name +'</span>';
                        clone += '</li>';
                }
        
                clone = $(clone);
                
                if(this.education){
                        for(var i = 0, n = this.education.length; i < n ; i++){
                                if(education[this.education[i].school.name]){
                                        education[this.education[i].school.name]++;
                                        education_ids[this.education[i].school.name].push(clone);
                                } else {
                                        education[this.education[i].school.name] = 1;
                                        education_ids[this.education[i].school.name] = [clone];
                                }
                        }
                }
                
                if (type) {
                        if (marked && marked.indexOf(this.id) !== -1) {
                                clone.addClass('premarked');
                        } 
                }       else {
                                        if (marked && marked.indexOf(this._id) !== -1) {
                                                clone.addClass('premarked');
                                        }
                        }

                                // append the string for the user's new friend to the friends string
                                placeholder.append(clone);
                        });
                        
                        
                }).success(function(){
                        var csrf = $('meta[name="csrf-token"]').attr('content');
                        //sort education stuff
                        education_sorted = education_sort(education, education_ids)
                        // stop and remove the pulse animation
                        $('.progress-bar-container').remove();

                        for(var i = 0; i < 10; i++){
                                $('.network').append('<li><input type="checkbox" data-network="'+ education_sorted[i][0] +'"><a href="#">'+ education_sorted[i][0] +' <span>('+ education_sorted[i][1]  +')</span></a></li>');
                        }

                        // append all of the user's friends at once, fade in.
                        $('.friends-list').append(placeholder).fadeIn();

                        $('form').append('<input type="hidden" name="authenticity_token" value="'+ csrf +'">');
                });
        }


        
        // event binding for the gender filter
        $('.gender .male, .gender .female').click(function(){
                if($(this).hasClass('selected')){
                        // the user clicks an already selected filter, remove the filter
                        $(this).removeClass('selected');
                        $('.friends-list li').each(function(){
                                $(this).removeClass('gender-disabled');
                        });
                } else {
                        // the user clicks a not-selected filter, filter the friends
                        // if there is an active filter, remove it
                        if($('.gender .selected')){
                                $('.gender .selected').removeClass('selected');
                                $('.friends-list li').each(function(){
                                        $(this).removeClass('gender-disabled');
                                });
                        }
                        var this_class = $(this).attr('class');

                        $(this).addClass('selected');
        
                        // filter each friend based on gender
                        $('.friends-list li').each(function(){
                                if(!$(this).hasClass(this_class)){
                                        $(this).addClass('gender-disabled');
                                }
                        });
                }
        });

        // event binding for the search filter
        $('.search-box').keyup(function(){
                if(typeof searchTimer != 'undefined'){
                        window.clearTimeout(searchTimer);
                }
                searchTimer = window.setTimeout(function(){
                        search($('.search-box').val().toLowerCase());
                }, 200);
        });

        function search(query){
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
        $('.add-with-email, .add-with-phone, .add-without-email').click(function(){
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
                $(image).append('<input type="hidden" name="emails[]" value="'+ email +'">');
                $(image).append('<input type="hidden" name="numbers[]" value="'+ phone +'">');
                $(image).append('<input type="hidden" name="ids[]" value="'+ id +'">');
                $(image).append('<input type="hidden" name="names[]" value="'+ name +'">');
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

        $('.network a').live('click', function(){
                var checkbox = $(this).parent().find('input'),
                        network;
                
                if(checkbox.attr('checked') === 'checked'){
                        checkbox.removeAttr('checked');
                        network = checkbox.attr('data-network');

                        $(this).parent().removeClass('selected');
                        
                        for(var i = 0; i < education_ids[network].length; i++){
                                education_ids[network][i].removeClass('chosen_network');
                        }
                } else {
                        checkbox.attr('checked', 'checked');
                        network = checkbox.attr('data-network');
                        
                        $(this).parent().addClass('selected');

                        for(var i = 0; i < education_ids[network].length; i++){
                                education_ids[network][i].addClass('chosen_network').removeClass('disabled');
                        }
                }

                if($('.network').find('input:checked').length > 0){
                        $('.friends-list li').each(function(){
                                if(!$(this).hasClass('chosen_network')){
                                        $(this).addClass('disabled');
                                }
                        });
                } else {
                        $('.chosen_network').removeClass('chosen_network');
                        $('.friends-list li.disabled').removeClass('disabled');
                }

                return false;
        });
});