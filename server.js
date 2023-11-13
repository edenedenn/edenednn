const assert = require('assert');

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const mongourl = 'mongodb+srv://s1299841:1303313524Aa@cluster0.uuchtz5.mongodb.net/?retryWrites=true&w=majority'; 
const dbName = 'test';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const session = require('cookie-session');

//app.use(formidable());
app.set('view engine', 'ejs');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


//2.userinfo
var usersinfo = new Array(
    {name: "ds1", password: "381"},
    {name: "ds2", password: "381"},
    {name: "ds3", password: "381"},
    {name: "ds4", password: "381"}
);
var documents = {};
const SECRETKEY = '381';
//Main Body
app.use(session({
    userid: "session",  
    keys: [SECRETKEY],
}));


const findDocument =  function(db, criteria, callback){
    let cursor = db.collection('book_information').find(criteria);
    console.log(`findDocument: ${JSON.stringify(criteria)}`);
    cursor.toArray(function(err, docs){
        assert.equal(err, null);
        console.log(`findDocument: ${docs.length}`);
        return callback(docs);
    });
}


app.get('/', function(req, res) {
  if (!req.session.authenticated) {
    console.log("...Not authenticated; directing to login");
    res.redirect("/login");
  } else {
    console.log("...Authenticated user; redirecting to home");
    res.redirect("/home");
  }
});

//1.login
app.get('/login', function(req, res){
    console.log("...Welcome to login page.")
    res.sendFile(__dirname + '/public/login.html');
    return res.status(200).render("login");
});    
app.post('/login', function(req, res){
    console.log("...Handling your login request");
    for (var i=0; i<usersinfo.length; i++){
        if (usersinfo[i].name == req.body.account && usersinfo[i].password == req.body.password) {
        req.session.authenticated = true;
        req.session.userid = usersinfo[i].name;
        console.log(req.session.userid);
        return res.status(200).redirect("/home");
        }
    }
        console.log("Error username or password.");
        return res.redirect("/");
});




//logout
app.get('/logout', function(req, res){
    req.session = null;
    req.authenticated = false;
    res.redirect('/login');
});

app.get('/home', function(req, res){
    console.log("...Welcome to the home page!");
    return res.status(200).render("home");
});




app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
//app.listen(app.listen(process.env.PORT || 8099));
