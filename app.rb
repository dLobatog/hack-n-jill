require "sinatra"
require 'rubygems'
require 'koala'  
require 'mongo_mapper'

class MyApp < Sinatra::Application
  
  enable :sessions, :logging
  set :raise_errors, false
  set :show_exceptions, false
  set :environment, :development

  # Scope defines what permissions that we are asking the user to grant.
  # In this example, we are asking for the ability to publish stories
  # about using the app, access to what the user likes, and to be able
  # to use their pictures.  You should rewrite this scope with whatever
  # permissions your app needs.
  # See https://developers.facebook.com/docs/reference/api/permissions/
  # for a full list of permissions
  FACEBOOK_SCOPE = 'user_likes,user_photos,friends_about_me,friends_likes,email'
  
  configure do
    config = File.open( 'config/mongo.yml' ) { |yf| YAML::load( yf ) }
    MongoMapper.setup(config, "development")
  end

  before do
    # HTTPS redirect
    if settings.environment == :production && request.scheme != 'https'
      redirect "https://#{request.env['HTTP_HOST']}"
    end
  end

  helpers do
    def host
      request.env['HTTP_HOST']
    end

    def scheme
      request.scheme
    end

    def url_no_scheme(path = '')
      "//#{host}#{path}"
    end

    def url(path = '')
      "#{scheme}://#{host}#{path}"
    end

    def authenticator
      @authenticator ||= Koala::Facebook::OAuth.new(ENV["FACEBOOK_APP_ID"], ENV["FACEBOOK_SECRET"], url("/auth/facebook/callback"))
    end
    
    def current_user
      @current_user ||= User.safe_find_by( uid: session[:uid] )
    end
    
    
    def logger
      request.logger
    end

  end

  # the facebook session expired! reset ours and restart the process
  error(Koala::Facebook::APIError) do
    session[:access_token] = nil
    redirect "/auth/facebook"
  end

  get "/" do
    # Get base API Connection
    @graph  = Koala::Facebook::API.new(session[:access_token])

    # Get public details of current application
    @app  =  @graph.get_object(ENV["FACEBOOK_APP_ID"])

    haml :index
  end

  # used by Canvas apps - redirect the POST to be a regular GET
  post "/" do
    redirect "/"
  end
  
  # used to close the browser window opened to post to wall/send to friends
  get "/close" do
    "<body onload='window.close();'/>"
  end

  get "/sign_out" do
    session[:access_token] = nil
    redirect '/'
  end

  get "/auth/facebook" do
    session[:access_token] = nil
    redirect authenticator.url_for_oauth_code(:permissions => FACEBOOK_SCOPE)
  end

  get '/auth/facebook/callback' do
  	session[:access_token] = authenticator.get_access_token(params[:code])
  	@graph  = Koala::Facebook::API.new(session[:access_token])
  	@fb_info = @graph.get_object('me', fields: "email,picture,id,name,location,hometown,likes,gender")
  	@user = User.find_or_create_user(@fb_info)
  	
  	if @user.persisted?
  	  session[:uid] = @user.uid
  	  redirect '/home'
  	else
    	if @user.save
    	  session[:uid] = @user.uid
    	  redirect '/settings'
  	  else
  	    redirect '/auth/failure'
      end
    end
  end
  
  get '/get_friends.json' do
    if current_user
      graph  = Koala::Facebook::API.new(session[:access_token])
      friends = graph.get_connections('me', 'friends', fields: "id,picture,name,gender")
      return friends.to_json
    else
      redirect '/'
    end
  end
  
  get '/query.json' do
    p session
    city = params[:city]
    graph  = Koala::Facebook::API.new(session[:access_token])
    ids = graph.get_connections('me', 'friends', fields: 'id')
    ids = ids.collect {|id| id['id'] }
    return ids.to_json
  end
  
  get '/settings' do
    @graph = Koala::Facebook::API.new(session[:access_token])
    @app  =  @graph.get_object(ENV["FACEBOOK_APP_ID"])
    @user = current_user
    @friends = @graph.get_connections('me', 'friends').to_json
    @hometown = current_user.fb_suggested_hometown
    haml :settings
  end
  
  get '/home' do
    if current_user
      graph = Koala::Facebook::API.new(session[:access_token])
    else
      redirect '/'
    end  
    city                      = current_user.new_city unless params[:city].nil?
    @list_of_possible_friends = current_user.find_people_in_your_city(city, current_user.uid)
    @app                      = graph.get_object(ENV["FACEBOOK_APP_ID"])
    haml :home
  end
  
  post '/save' do
    @friends      = params[:friends]
    @home_city    = params[:home_city]
    @graph        = Koala::Facebook::API.new(session[:access_token])
    @friends_info = get_objects(@friends, fields: [:id, :picture, :name]).to_json
    @friends_info.each do |friend|
      friend[:likes] = @graph.get_connections(friend[:id], "likes")
      db_friend = current_user.friends.build likes: friend[:likes], name: friend[:name], picture: friend[:picture], city: @home_city
      db_friend.save
    end
    
    current_user.home_city = @home_city
    current_user.save
     
    redirect '/home'
  end
  
  get '/auth/failure' do
    "Your Facebook authentication failed, please go to the <a href='/'>home page</a> and try again!"
  end
end

require_relative 'lib/models/init'
