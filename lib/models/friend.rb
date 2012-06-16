
class Friend
  include MongoMapper::Document
  key :name, String
  key :picture, String
  key :likes, Array
  key :city, String
  key :user_id, String
  
  belongs_to :user
end