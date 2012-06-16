class User
  include MongoMapper::Document
  key :name, String
  key :home_city, String
  key :new_city, String
  key :fb_suggested_hometown, String
  key :email, String
  key :uid,  String
  key :embedded_friends, Array

  many :friends, in: :embedded_friends
  
  def self.find_or_create_user(info)
    if @user = User.safe_find_by( uid: info["id"] )
      @user
    else
      @user = User.new name: info["name"],
    	  uid: info["id"],
    	  gender: info["gender"],
    	  facebook_suggested_hometown: info["hometown"]["name"],
    	  facebook_suggested_new_city: info["location"]["name"],
    	  picture: info["picture"],
    	  likes: info['likes'],
    	  email: info["email"]
  	end
  	return @user
  end
  
  def self.safe_find_by(query)
    begin
      User.all(query)[0]
    rescue
      nil
    end
  end

  def find_people_in_your_city(city, current_user_id)
    city = "New York, New York"
    p city
    p city
    p city
    p city
    p city
    p city
    p city
    p city
    p city
    p city
    p city
    p city
    p city
    p city
    p city
    all_people_in_city = User.safe_find_by( facebook_suggested_new_city: city)
    p all_people_in_city
    p all_people_in_city
    p all_people_in_city
    p all_people_in_city
    p all_people_in_city.class
    common_friends = []
    list_of_possible_friends = []
    all_people_in_city.each do |stranger|
      common_friends = self.friends & stranger.friends 
      (list_of_possible_friends << stranger) if possible_friend(common_friends) 
    end

    list_of_possible_friends
  end

  def possible_friend(common_friends)
    common_friends.empty? ? false : true
  end

end
