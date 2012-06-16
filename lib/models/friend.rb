class Friend
  include Mongoid::Document
  field :name, type: String
  field :picture, type: String
  field :likes, type: Array
  field :city, type: String
  
  belongs_to :user
end