class User
  include Mongoid::Document
  field :name, type: String
  field :home_city, type: String
  field :new_city, type: String
  field :name, type: String
  field :email, type: String
  field :access_token, type: String
  field :uid, type: String
  
  has_many :friend
end