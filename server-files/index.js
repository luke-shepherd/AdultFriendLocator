
//Get the packages that we need =============
//==========================================
const express = require('express'),
      morgan = require('morgan'),
      passport = require('passport'),
      jwt = require('jsonwebtoken'),
      config = require('./config');
      database = require('./database');	
      mongoose = require('mongoose');      
      bodyParser = require('body-parser');      
      WebSocket = require('ws');
      url = require('url');
      http = require('http');
      //multer = require('multer');

//MongoDB stuff
mongoose.connect('mongodb://localhost:27017/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function(){
console.log(db);
});
// gfs
//var gfs = Grid(db, mongoose);

//Load User model from mongo.js
var User = require('./mongo.js').User;

var app = express();
app.set('superSecret', config.secret);

//Configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
   extended: true
}));
app.use(bodyParser.json());

app.set('port', process.env.PORT || 8080);



//API ROUTES =================================================================
//============================================================================

/*Registration route. Catches a x-www-form-urlencoded name and password key using body-parser.
Searched MongoDB for a name with the name key and creates a new User model to be saved into MongoDB. 
*/
app.post('/registration', function(req, res){
   //Store form into DB
   console.log("Received password: ", req.body.pass);
   console.log("Received username: ", req.body.username);
   console.log("Received name: ", req.body.firstName + ' ' + req.body.lastName);
   
  User.findOne({'username': req.body.username}, function(err, obj){
    if (err) return handleError(err);
    
    console.log("Object received from query: ", obj);

    if(!obj){
      var newUser = new User({username : req.body.username, password: req.body.pass,
                             firstName: req.body.firstName, lastName: req.body.lastName});
      newUser.save(function (err,obj,numAffected){
        if(err) return handleError(err);
        res.json({"type": 'registration',
                  "success": true,});
        console.log('Number of lines affected: ', numAffected);
      });
    }else{
      res.json({"type": 'registration',
                "success": false,
                "reason": 'User already exists'});
      console.log('User already exists');
    }
  });

});


var apiRoutes = express.Router(); 

//Login route 
apiRoutes.post('/login', function(req,res){
   console.log("Received username: ", req.body.username);
   console.log("Received password: ", req.body.pass);
   User.findOne({'username': req.body.username}, function(err,obj){
     if(err) return handleError(err);
     console.log("Object received from query: ", obj);
     if(!obj){
        res.json({"type": 'login',
                  "success": false,
                  "reason": 'User does not exist!'});
     }else if(req.body.pass !== obj.password){
        res.json({"type": 'login',
                  "success": false,
                  "reason": 'Incorrect password'});
     }else{
         var token = jwt.sign(obj, app.get('superSecret'), {
                expiresIn: 60*180*7 // expires in 180 mins
         });
         obj.token = token;
         res.json({"type": "login",
                    "success": true,
                    "token" : token,
                    "reason": 'Correct username and password'});
         console.log("Object after adding token: ", obj);         
     }
   });
});

//Middleware to verify incoming JWT token
apiRoutes.use(function(req, res, next){
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
   
    if(token){
       jwt.verify(token, app.get('superSecret'), function(err, decoded){
          if(err){
            return res.json({"type": 'response',
                             "success": false,
                             "reason": 'Failed to authenticate'});
          }else{
             req.decoded = decoded;
             next();
          }
       });
    }else{
      return  res.status(403).send({"type": 'resopnse',
                                    "success": false,
                                    "reason": 'No token provided'});
    }
});

//Add friend route from Packet Notes
apiRoutes.post('/addFriend/', function(req, res){
   var requesting_user = req.body.username;
   var friend_requested = req.body.friend;
   console.log("Requesting user: ", requesting_user);  
   console.log("Requesting friend for: ", friend_requested);   

   User.findOneAndUpdate({'username': friend_requested,
			  'friends_request': { $ne: requesting_user}},
			   {$push: {friends_request: requesting_user}},
			   {new: true}, function(err, obj){
      if(err) return handleError(err);
      
      if(obj == null){
         res.json({"type": 'addFriend',
                   "success": false,
                   "reason": 'User does not exist'});
      }else{
        console.log("Querying user: ", friend_requested);
        console.log("Friends request array: ", obj.friends_request); 
        User.findOneAndUpdate({'username': requesting_user},
                              {$push: {friends_pending: friend_requested}},
                              {new: true}, function(err, obj){
                if(err) return handleError(err);         
                console.log("Querying username: ", requesting_user);
                console.log("This is pendings array for: ", obj.friends_pending);
                res.json({"type": 'addFriend',
                  "success": true,
                  "reason": 'Both friends exist and no errors reported'});
        });      
      }
   });

});
    


//Accept friend request route
apiRoutes.post('/acceptFriend/', function(req, res){    
   var requesting_user = req.body.username;
   var accepting_friend = req.body.friend;
   var accept_notification = requesting_user + " has accepted your friend request";
   console.log("Requesting user for: ", requesting_user);  
   console.log("Accepting friend for: ", accepting_friend);   
   
   //Update friends list of requesting user
   User.findOneAndUpdate({'username': requesting_user},
    {$pull: {friends_request: accepting_friend}, $push: {friends_list: accepting_friend}},
	{new: true}, function(err, obj){
      if(err) return handleError(err);
      
      if(obj == null){
         res.json({"type": 'acceptFriend',
                   "success": false,
                   "reason": 'User does not exist'});
      }else{
        console.log("Querying user: ", requesting_user);
        console.log("This is updated user object: ", obj); 
        console.log("Friends request array: ", obj.friends_request); 
        //Update friends list of friend
        User.findOneAndUpdate({'username': accepting_friend},
			   {$pull: {friends_pending: requesting_user} ,$push: {friends_list: requesting_user, friends_notifications: accept_notification}},
			   {new: true}, function(err, obj){
            if(err) return handleError(err);
      
            if(obj == null){
                res.json({"type": 'acceptFriend',
                   "success": false,
                   "reason": 'Friend does not exist'});
            }else{
                console.log("Querying user: ", accepting_friend);
                console.log("This is updated Friend object: ", obj); 
                console.log("Friends request array: ", obj.friends_request); 
                res.json({"type": 'acceptFriend',
                  "success": true,
                  "reason": 'Both friends exist'});
            }
        });
      }
   });
   
});

//Reject friend request route
apiRoutes.post('/rejectFriend/', function(req, res){
   var requesting_user = req.body.username;
   var rejecting_friend = req.body.friend;
   var reject_notification = requesting_user + " has rejected your friend request";
   console.log("Requesting user for: ", requesting_user);  
   console.log("Rejecting friend for: ", rejecting_friend);      
   console.log("Reject notification:", reject_notification);
   
   //Update friends request of requesting user
    User.findOneAndUpdate({'username': requesting_user},
        {$pull: {friends_request: rejecting_friend}},
	    {new: true}, function(err, obj){
      if(err) return handleError(err);
      
      if(obj == null){
         res.json({"type": 'rejectFriend',
                   "success": false,
                   "reason": 'User does not exist'});
      }else{
        console.log("Querying user: ", requesting_user);
        console.log("Requesting user object: ", obj); 
        console.log("Friends request array: ", obj.friends_request); 
         //Update notifications list of friend
        User.findOneAndUpdate({'username': rejecting_friend},
			{$pull: {friends_pending: requesting_user}, $push: {friends_notifications: reject_notification}},
			{new: true}, function(err, obj){
            if(err) return handleError(err);
      
            if(obj == null){
                res.json({"type": 'rejectFriend',
                   "success": false,
                   "reason": 'User does not exist'});
            }else{
                console.log("Querying user: ", rejecting_friend);
                console.log("Friend object: ", obj); 
                console.log("Notifications: ", obj.friends_notifications); 
                res.json({"type": 'rejectFriend',
                  "success": true,
                  "reason": 'Both users exist'});
            }
        });
      }
   });
   
});

//Delete friend for both users route
apiRoutes.post('/deleteFriend/', function(req, res){
    var requesting_user = req.body.username;
    var deleting_user = req.body.friend;
    console.log("Requesting user for: ", requesting_user);
    console.log("Delete user for: ", deleting_user);
    
    //Update friends list of requesting user
    User.findOneAndUpdate({'username':requesting_user},
        {$pull: {friends_list: deleting_user}},
        {new: true}, function(err, obj){
          if(err) return handleError(err);
          
          if(obj == null){
            res.json({"type": 'deleteFriend',
                   "success": false,
                   "reason": 'User does not exist'});
          }else{
            console.log("Requesting user object: ", obj);
            console.log("Friends list array: ", obj.friends_list); 
            //Update friends list of friend
            User.findOneAndUpdate({'username': deleting_user},
                {$pull: {friends_list: requesting_user}},
                {new: true}, function(err, obj){
                    if(err) return handleError(err);
          
                    if(obj == null){
                        res.json({"type": 'deleteFriend',
                            "success": false,
                            "reason": 'Deleting user does not exist'});
                    }else{
                        console.log("Friend object: ", obj); 
                        console.log("Friends list array: ", obj.friends_list); 
                        res.json({"type": 'deleteFriend',
                                  "success": true,
                                  "reason": 'Both users exist'
                        });      
                    }   
            });
          }
    });     
   

});

//Get Friends List route from Packet Notes
apiRoutes.post('/friendpage/getlist/', function(req, res){
    var requesting_user = req.body.username;
    console.log("Requesting user: ", requesting_user);
    
    User.findOne({'username': requesting_user}, function(err,obj){
        if(err) return handleError(err);  
        console.log("User object received from query: ", obj);
        if(obj == null){
            res.json({"type": 'response',
                "success": false,
                "reason": 'Error: User does not exist'});
        }else{ 
            res.json({"type": 'response',
                "success": true,
                "reason": 'Requesting username exists',
                "friends": obj.friends_list});
        }
    }); 
    
});

//Update user route from Packet Notes
apiRoutes.post('/updateuser/', function(req, res){
    var requesting_user = req.body.username;
    console.log("Requesting user: ", requesting_user);
    
    User.findOne({'username': requesting_user}, function(err,obj){
        if(err) return handleError(err);    
        console.log("User object received from query: ", obj);
        if(obj == null){
            res.json({"type": 'updateUser',
                "success": false,
                "reason": 'Error: User does not exist'});
        }else{ 
            res.json({"type": 'updateUser',
                "success": true,
                "reason": 'Requesting user exists',
                "notifications": obj.friends_notifications});
        }
    }); 
    
});

//Groups page route
apiRoutes.post('/grouppage/', function(req, res){
    var requesting_user = req.body.name;
    console.log("Requesting user: ", requesting_user);
    
    User.findOne({'username': req.body.name}, function(err,obj){
        if(err) return handleError(err);
    
        console.log("Object received from query: ", obj);
    
        if(obj == null){
            res.json({"type": 'response',
                "success": false,
                "reason": 'Error: User does not exist'});
        }else{ 
            res.json({"type": 'response',
                "success": true,
                "friends_request": obj.friends_request,
                "friends": obj.friends_list});
        }
    }); 
 
});

//Create group route
apiRoutes.post('/grouppage/create/:name', function(req, res){
    var requesting_user = req.body.name;
    console.log("Requesting user: ", requesting_user);
    
    User.findOneAndUpdate({'username': req.params.username},
			   {$push: {groups: req.params.name}},
			   {new: true}, function(err, obj){
      if(err) return handleError(err);
      
      if(obj == null){
         res.json({"type": 'response',
                   "success": false,
                   "reason": 'User does not exist'});
      }else{
        console.log("Friends request array: ", obj.friends_request); 
        res.json({"type": 'response',
                  "success": true});
      }
   });
 
});

//Location update from Packet Notes
apiRoutes.post('/updateloc/', function(req, res){
    var requesting_user = req.body.username;
    var updated_longitude = req.body.longitude;
    var updated_latitude = req.body.latitude;
    console.log("Requesting user: ", requesting_user);
    console.log("Updated longitude: ", updated_longitude);
    console.log("Updated latitude: ", updated_latitude);
    
    User.findOneAndUpdate({'username':requesting_user},
                           // {$pushAll: {"location.coordinates": [updated_longitude, updated_latitude]}},
                           { $set: {"longitude": updated_longitude, "latitude": updated_latitude}},
                            {new: true}, function(err, obj){
        if(err) return handleError(err);
          
        if(obj == null){
         res.json({"type": 'updateloc',
                   "success": false,
                   "reason": 'User does not exist'});
        }else{
        console.log("This is object: ", obj);
        res.json({"type": 'updateloc',
                  "success": true,
                  "reason": 'User exists and no errors reported'});
        }
   });   
    
});

//Request location permission for a friend route
apiRoutes.post('/requestLocation/', function(req, res){
   var requesting_user = req.body.username;
   var friend_requested = req.body.friend;
   console.log("Requesting user: ", requesting_user);  
   console.log("Requesting location for: ", friend_requested);   

   User.findOneAndUpdate({'username': friend_requested,
			  'friends_list': { $in: [requesting_user]}},
			   {$push: {location_requests: requesting_user}},
			   {new: true}, function(err, obj){
      if(err) return handleError(err);
      
      if(obj == null){
         res.json({"type": 'locationRequest',
                   "success": false,
                   "reason": 'User does not exist'});
      }else{
        console.log("Querying user: ", friend_requested);
        console.log("Location request array: ", obj.location_requests); 
        User.findOneAndUpdate({'username': requesting_user},
                              {$push: {locations_pending: friend_requested}},
                              {new: true}, function(err, obj){
                if(err) return handleError(err);         
                console.log("Querying username: ", requesting_user);
                console.log("This is pendings array for: ", obj.locations_pending);
                res.json({"type": 'locationRequest',
                  "success": true,
                  "reason": 'Both friends exist and no errors reported'});
        });      
      }
   });

});

//Accept location permission for a friend route
apiRoutes.post('/acceptLocation/', function(req, res){    
   var requesting_user = req.body.username;
   var accepting_friend = req.body.friend;
   var accept_notification = requesting_user + " has accepted your location request";
   console.log("Requesting user for: ", requesting_user);  
   console.log("Accepting location for: ", accepting_friend);   
   
   //Update friends list of requesting user
   User.findOneAndUpdate({'username': requesting_user},
    {$pull: {location_requests: accepting_friend}, $push: {friends_viewable: accepting_friend}},
	{new: true}, function(err, obj){
      if(err) return handleError(err);
      
      if(obj == null){
         res.json({"type": 'acceptLocation',
                   "success": false,
                   "reason": 'User does not exist or User is not friend'});
      }else{
        console.log("Querying user: ", requesting_user);
        console.log("This is updated user object: ", obj); 
        console.log("Location request array: ", obj.location_requests); 
        //Update friends list of friend
        User.findOneAndUpdate({'username': accepting_friend},
			   {$pull: {locations_pending: requesting_user} ,$push: {friends_viewable: requesting_user, friends_notifications: accept_notification}},
			   {new: true}, function(err, obj){
            if(err) return handleError(err);
      
            if(obj == null){
                res.json({"type": 'acceptFriend',
                   "success": false,
                   "reason": 'Friend does not exist'});
            }else{
                console.log("Querying user: ", accepting_friend);
                console.log("This is updated Friend object: ", obj); 
                console.log("Friends viewable array: ", obj.friends_viewable); 
                res.json({"type": 'acceptLocation',
                  "success": true,
                  "reason": 'Both friends exist'});
            }
        });
      }
   });
   
});

//Remove friend from friends_viewable
apiRoutes.post('/deleteLocation/', function(req, res){
    var requesting_user = req.body.username;
    var deleting_user = req.body.friend;
    console.log("Requesting user for: ", requesting_user);
    console.log("Delete user for: ", deleting_user);
    
    //Update friends list of requesting user
    User.findOneAndUpdate({'username':requesting_user},
        {$pull: {friends_viewable: deleting_user}},
        {new: true}, function(err, obj){
          if(err) return handleError(err);
          
          if(obj == null){
            res.json({"type": 'deleteFriend',
                   "success": false,
                   "reason": 'User does not exist'});
          }else{
            console.log("Requesting user object: ", obj);
            console.log("Friends list array: ", obj.friends_viewable); 
            //Update friends list of friend
            User.findOneAndUpdate({'username': deleting_user},
                {$pull: {friends_viewable: requesting_user}},
                {new: true}, function(err, obj){
                    if(err) return handleError(err);
          
                    if(obj == null){
                        res.json({"type": 'deleteFriend',
                            "success": false,
                            "reason": 'Deleting user does not exist'});
                    }else{
                        console.log("Friend object: ", obj); 
                        console.log("Friends viewable array: ", obj.friends_viewable); 
                        res.json({"type": 'deleteFriend',
                                  "success": true,
                                  "reason": 'Both users exist'
                        });      
                    }   
            });
          }
    });     
   

});

//Update friends viewable location 
//ToDo: Update updatelocation method to store new location schema, Merge function with updateUser
apiRoutes.post('/updateFriendsViewable/', function(req, res){
    var requesting_user = req.body.username;
   
    
    console.log("Requesting user: ", requesting_user);
    console.log("Friends viewable array: ", friends_viewable);

    
    User.findOne({'username':requesting_user}, function(err, obj){
        if(err) return handleError(err);
          
        if(obj == null){
         res.json({"type": 'updateFriendsViewable',
                   "success": false,
                   "reason": 'User does not exist'});
        }else{
        var array = [];
        console.log("This is friends viewable: ", obj.friends_viewable);
        for(var i = 0; i < obj.friends_viewable.length; i++){
            var friend_to_lookup = obj.friends_viewable[i];
            User.findOne({'username': friend_to_lookup}, function(err, obj){
                if(err) return handleError(err);  
                if(obj == null){
                    res.json({"type": 'updateFriendsViewable',
                        "success": false,
                        "reason": 'User does not exist'});
                }else{
                    if(obj.broadcast){
                        console.log("Pushing user into array: ", obj.username);
                        console.log("Longitude for user: ", obj.longitude);
                        console.log("Latitude for user: ", obj.latitude);
                        array.push({
                            username: friend_to_lookup,
                            longitude: obj.longitude,
                            latitude: obj.latitude
                    
                        });
                    }
                }
            });
        }
   
        res.json({"type": 'updateFriendsViewable',
                  "success": true,
                  "reason": 'User exists and no errors reported',
                  "locations": array});
        }
   });   
    
});


//Delete group route

//Add friends to a group route

//Delete friends from a group route

//Send location to people in group route

//Upload profile pic route
/*
app.post('/fs/upload', multer({
    upload: null,
    onFileUploadStart: function (file) {
        // Set upload with WritableStream
        this.upload = gfs.createWriteStream({
            filename: file.originalname,
            mode: "w",
            chunkSize: 1024*4,
            content_type: file.mimitype,
            root: "fs"
        });
    },
    onFileUploadData: function (file, data) {
        // Put the chunks into the DB
        this.upload.write(data)
    },
    onFileUploadComplete: function (file) {
        // End the process
        this.upload.end();
    }
}), function (req, res) {
    res.sendStatus(200);
});
// Test the profile pic route
app.route('/fs/download/:file').get(function(req, res) {
    var readstream = gfs.createReadStream({_id: req.params.file});
    readstream.pipe(res);
});
*/

// Query a user's info
apiRoutes.post('/userquery', function (req, res) {
    console.log("Received name: ", req.body.username);
    console.log("Received password: ", req.body.pass);
    User.findOne({'username': req.body.username}, function(err, obj) {
        if(err) {
            return handleError(err);
        }
        console.log("The following object was received from the query: ", obj);
        if (!obj) {
            res.json({"type": 'userquery',
                      "success": false,
                      "reason": 'The user does not exist!'});
        }
        else {
            res.json({"type": 'userquery',
                      "username": true,
                      "success": true,
                      "friends_list": obj.friends_list,
                      "reason": 'A valid user was provided'});
        }
    });
});


//Search bar function
apiRoutes.post('/search', function(req,res){
  var lookup  = req.body.lookup;
  console.log("Looking up:", lookup);
  var regex = '.*' + lookup + '.*'  

  User.find({$or:[
              {'firstName':{$regex: new RegExp(regex),$options: 'i' }},
              {'lastName': {$regex: new RegExp(regex), $options: 'i'}  },
              {'username': {$regex: new RegExp(regex), $options: 'i'} } ]}, function(err,obj){
    if (err) return handleError(err);

    console.log("Object received from query: ", obj);

    if(obj==null){
      res.json({"type": 'search',
                "success": false,
                "reason": 'Error: User does not exist'});
    }else{
      var searchResults = [];
      obj.forEach(function(obj){
         searchResults.push(obj.username);
                   
                   
      });
      
      res.json({"type": 'search',
                "success": true,
                "results": searchResults});
    }
  });
});


app.use('/api', apiRoutes);





/*
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws){
   const location = url.parse(ws.upgradeReq.url, true);
   ws.on('message', function incoming(message){
      console.log('received: %s', message);
   });

   ws.send('something');
});
*/


/* MySQL stuff that we can ignore for now

var connection = mysql.createConnection({
   host    : 'localhost',
   user    : 'production',
   password : 'adultfriendlocator',
   database  : 'production_database'
});

connection.connect(function(err){
   if(err){
     console.error('Error connection: ' + err.stack);
     return;
   }
   console.log('connected as id ' + connection.threadId);
});
*/

//Start the server==============================================
//==============================================================

app.listen(app.get('port'), function(){
   console.log('Express started on http://localhost:' + 
   app.get('port') + '; press Ctrl-C to terminate.');
});

