
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
end