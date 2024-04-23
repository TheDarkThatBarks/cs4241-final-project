const express = require('express'),
    ViteExpress = require("vite-express");
    app = express(),
    { MongoClient, ObjectId } = require("mongodb")

//for sending files
const multer = require('multer');
const path = require('path');
//set up mutler
// Set up Multer to handle file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/'); // Specify the directory where images will be stored
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename the file to avoid conflicts
    }
});

const upload = multer({ storage: storage });

app.use(express.static('public'))
app.use(express.static('views'))
app.use(express.json())

require("dotenv").config()

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@${process.env.HOST}`
const client = new MongoClient(uri)

let userCollection;
let eventsCollection;

(async function () {
    await client.connect()
    const database = client.db('finalProj')
    userCollection = database.collection('users')
    eventsCollection = database.collection("events");
})();

const cookieSession = require('cookie-session')
const passport = require('passport');
const session = require('express-session');

app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [process.env.COOKIE_KEY]
}));


app.use(session({
    secret: process.env.EXPRESS_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const GitHubStrategy = require('passport-github2').Strategy;

passport.serializeUser((user, done) => {
    done(null, user.userId);
});

passport.deserializeUser((id, done) => {
    userCollection.findOne({ "userId": id }).then((user) => {
        done(null, user);
    });
});

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/github/callback"
},
    (accessToken, refreshToken, profile, done) => {
        userCollection.findOne({ "userId": profile.id }).then((currentUser) => {
            if (currentUser) {
                console.log(currentUser)
                done(null, currentUser)
            } else {
                const newUser = {
                    "userId": profile.id,
                    "username": profile.username,
                    "events": []
                }
                userCollection.insertOne(newUser).then(user => {
                    console.log("new user created:" + newUser)
                    done(null, newUser)
                })
            }
        })
    }
));


const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/redirect'
    },
        (accessToken, refreshToken, profile, done) => {
            userCollection.findOne({ "userId": profile.id }).then((currentUser) => {
                if (currentUser) {
                    console.log(currentUser)
                    done(null, currentUser)
                } else {
                    const newUser = {
                        "userId": profile.id,
                        "username": profile.displayName,
                        "events": []
                    }
                    userCollection.insertOne(newUser).then(user => {
                        console.log("new user created:" + newUser)
                        done(null, newUser)
                    })
                }
            });
        })
);

//used for github auth
app.get('/github', passport.authenticate('github', {
    scope: ['profile']
}))

//checks to ensure that the user is authorized before getting to loggedIn.html
const authCheck = (req, res, next) => {
    if (!req.session.login) {
        res.redirect('/index.html')
    } else {
        next()
    }
};

//redirects to loggedIn.html if logged in
app.get('/loggedIn', authCheck, (req, res) => {
    console.log("ran loggedIn")
    res.sendFile(__dirname + '/public/loggedIn.html')
});

//defaults to login page 
app.get('/', (req, res) => {
    res.sendFile('index')
});

//handles redirect from github login
app.get('/auth/github/callback', passport.authenticate('github'), (req, res) => {
    req.session.login = true
    res.redirect('/loggedIn')
});


//google routes 
app.get('/google', passport.authenticate('google', {
    scope: ['profile']
}));

app.get('/auth/google/redirect', passport.authenticate('google'), (req, res) => {
    req.session.login = true
    res.redirect('/loggedIn');
});

app.get('/logout', (req, res) => {
    req.logout();
    req.session.login = false
    res.redirect('/');
});

app.get('/profilePage', authCheck, (req, res) => {
    res.sendFile(__dirname + '/public/profile.html')
})

//send to post event page
app.get('/eventBoard', authCheck, (req, res) => {
    res.sendFile(__dirname + '/public/eventBoard.html')
})

app.get('/allEvents', authCheck, (req, res) => {
    res.sendFile(__dirname + '/public/viewEvents.html')
})

app.get('/user', (req, res) => {
    console.log("fetching username")
    res.json({"username" : req.user.username});
})

app.get("/user-events", async (req, res) => {
    console.log("fetching user events");
    userCollection.findOne({
        userId: req.user.userId
    })
    .then((user) => user.events)
    .then((events) => {
        console.log(events);
        if (events.length === 0) {
            return res.json([]);
        } else {
            let query = {$or: []};
            events.forEach((e) => query.$or.push({_id: new ObjectId(e.eventId)}));
            return eventsCollection.find(query).toArray().then((eventList) => {console.log(eventList);res.json(eventList)});
        }
    });
});
//let image; //for mopngoDB
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    image = '/uploads/' + req.file.filename;
    res.sendStatus(200);
});
let description; //mongoDB
app.post("/description", async (req, res) => {
    console.log("description: ", req.body);
    if(req.body == ""){
        return res.send(JSON.stringify('No description uploaded.'))
    }
    description = req.body;
    res.send(JSON.stringify("Uploaded successfully."));
})

//submit - gets entry (name, date, time, loaction) from client checks for event of same time, name, location
// adds to array and database and sends client updated array
app.post("/submit", upload.single('image'), async (req, res) => {
    let data = req.body;
    console.log(data);
    const eventExists = await eventsCollection.findOne({event: data.event});
    console.log(eventExists);
    if (eventExists != null) {
        console.log("Event already posted!");
        res.send(JSON.stringify("Event already posted!"));
        return;
    }
    console.log("data: ", data.image)
    //console.log("data: ", data.image.file.filename)
    var entry = {
      //name: req.user.username, fix after appened to login page
      event: data.event,
      date: data.date,
      startTime: new Date(data.date + "T" + data.startTime + ':00'),
      endTime: new Date(data.date + "T" + data.endTime + ':00'),
      //length: elapsedTime(data.startTime, data.endTime, data.date), 
      location: data.location,
      image: data.image,
      description: data.description
    };
    //console.log("length ", (eventPost.length + 1));
    //eventPost.push(entry);
    const result = await eventsCollection.insertOne(entry)
    //req.json = JSON.stringify(eventPost);
    res.json(await eventsCollection.find({}).toArray());
  });

  function convertTime(time) {
    // Parse the time string
    var timeSplit = time.split(':');
    var hours = parseInt(timeSplit[0]);
    var minutes = parseInt(timeSplit[1]);

    // Convert to 12 hour
    var ampm = (hours >= 12) ? 'PM' : 'AM';
    hours = (hours % 12) || 12;

    var newTime = hours + ':' + (minutes < 10 ? '0' : '') + minutes + ' ' + ampm;
    return newTime;
}

function elapsedTime(startTime, endTime, date) {
    // full dates to get time differences for multi days
    var start = new Date(date + "T" + startTime + ':00');
    var end = new Date(date + "T" + endTime + ':00');

    // Calculate the difference in milliseconds
    var elapsedTime = end - start;

    // Convert milliseconds to hours and minutes
    var hours = Math.floor(elapsedTime / (1000 * 60 * 60));
    var minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));

    return hours + ' hours ' + minutes + ' minutes';
}

// app.post("/view", async (req, res) => {
//     console.log(eventPost);
//     if (eventsCollection !== null) {
//         const events = await eventsCollection.find({}).toArray()
//         res.json( events )
//       }
//       //res.send(JSON.stringify(events))
// })

app.post("/info", async (req, res) => {
    console.log("index: ", req.body.entryIndex);
    const indexToRemove = req.body.entryIndex;
    
    // if (isNaN(indexToRemove) || indexToRemove < 0 || indexToRemove >= eventPost.length) {
    //   return res.status(400).send(JSON.stringify("Invalid index"));
    // }

    const details = eventPost[indexToRemove];
    console.log("details: ", details);
    const eventName = details.event;  
  
    // Use the attribute 'name' of the object to remove data from MongoDB
    const filter = { event: eventName }; // Filter to find the document by the original item
    const foundItem = await eventsCollection.findOne(filter);
    
    console.log(foundItem);
    res.send(foundItem);
    
  });

app.post("/refresh", express.json(), async (req, res) => {
    const mongoData = await eventsCollection.find({}).toArray();
    res.json(mongoData);
});

//app.listen(process.env.PORT);
ViteExpress.listen(app, 3000);