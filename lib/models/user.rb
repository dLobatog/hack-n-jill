class User
  include Mongoid::Document
  field :name, type: String
  field :home_city, type: String
  field :new_city, type: String
  field :fb_suggested_hometown, type: String
  field :fb_suggested_new_city, type: String
  field :name, type: String
  field :email, type: String
  field :uid, type: String
  
  has_many :friend
  
  def self.find_or_create_user(info, likes)
    if @user = User.safe_find_by(uid: info[:id])
      @user
    else
      @user = User.new name: info[:name],
    	  uid: info[:id],
    	  gender: info[:gender],
    	  facebook_suggested_hometown: info[:hometown][:name],
    	  facebook_suggested_new_city: info[:location][:name],
    	  picture: info[:picture],
    	  likes: @likes,
    	  email: info[:email]
  	end
  end
  
  def self.safe_find_by(query)
    begin
      User.find_by(query)
    rescue
      nil
    end
  end
end