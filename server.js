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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const createDocument = function(db, createddocuments, callback){
    const client = new MongoClient(mongourl);
    client.connect(function(err) {
        assert.equal(null, err);
        console.log("Connected successfully to the MongoDB database server.");
        const db = client.db(dbName);

        db.collection('Library_document_info').insertOne(createddocuments, function(error, results){
            if(error){
            	throw error
            };
            console.log(results);
            return callback();
        });
    });
}


const findDocument =  function(db, criteria, callback){
    let cursor = db.collection('Library_document_info').find(criteria);
    console.log(`findDocument: ${JSON.stringify(criteria)}`);
    cursor.toArray(function(err, docs){
        assert.equal(err, null);
        console.log(`findDocument: ${docs.length}`);
        return callback(docs);
    });
}

const handle_Find = function(res, criteria){
    const client = new MongoClient(mongourl);
    client.connect(function(err) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        findDocument(db, criteria, function(docs){
            client.close();
            console.log("Closed DB connection");
            res.status(200).render('display', {nItems: docs.length, items: docs});
        });
    });
}

const handle_Details = function(res, criteria) {
    const client = new MongoClient(mongourl);
    client.connect(function(err) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        let user = {};
        user['_id'] = ObjectID(criteria._id)
        findDocument(db, user, function(docs){ 
            client.close();
            console.log("Closed DB connection");
            res.status(200).render('details', {item: docs[0]});
        });
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

app.get('/list', function(req, res){
    console.log("Show all information! ");
    handle_Find(res,req.query.docs);
    
});

app.get('/home', function(req, res){
    console.log("...Welcome to the home page!");
    return res.status(200).render("home");
});

app.get('/create', function(req, res){
    return res.status(200).render("create");
});

app.post('/create', function(req, res){
    const client = new MongoClient(mongourl);
    client.connect(function(err){
        assert.equal(null, err);
        console.log("Connected successfully to the DB server.");
        const db = client.db(dbName);
        
        documents["_id"] = ObjectID;        
	documents["UserName"] = req.body.UserName;	
	documents['Date']= req.body.date;
	documents['Borrow_or_Return']= req.body.borrow_or_return;
	//documents['Book Type']= req.body.book_type;
	//documents['Book Name']= req.body.book_name;
        documents['Telephone_Number']= req.body.phone_num;
        documents['Remark']= req.body.remark;
        
        var bookinfo ={};
        bookinfo['Book_Type'] = req.body.book_type;
        if(req.body.book_name){
            bookinfo['Book_Name'] = req.body.book_name;
        }
        documents['Book_Information']= bookinfo;
        
        console.log("...putting data into documents");
        
        documents["ownerID"] = `${req.session.userid}`;
        
     if(documents.UserName){
        console.log("...Creating the document");
        createDocument(db, documents, function(docs){
            client.close();
            console.log("Closed DB connection");
            return res.status(200).render('info', {message: "Document is created successfully!"});
        });
    } else{
        client.close();
        console.log("Closed DB connection");
        return res.status(200).render('info', {message: "Invalid entry - User Name is compulsory!"});
    }
        
        
    });
    
});

app.post('/search', function(req, res){
    const client = new MongoClient(mongourl);
    client.connect(function(err){
        assert.equal(null, err);
        console.log("Connected successfully to the DB server.");
        const db = client.db(dbName);
    
    var searchID={};
    searchID['UserName'] = req.body.UserName;
    
    if (searchID.UserName){
    console.log("...Searching the document");
    findDocument(db, searchID, function(docs){
            client.close();
            console.log("Closed DB connection");
            res.status(200).render('display', {nItems: docs.length, items: docs});
        });
    }
    else{
    console.log("Invalid Entry - UserName is compulsory for searching!");
    res.status(200).redirect('/find');
    }         	
	});
});

app.get('/find', function(req, res){
    return res.status(200).render("search");
});

app.get('/details', function(req,res){
    handle_Details(res, req.query);
});

// Restful find
app.get('/api/item/UserName/:UserName', function(req,res) {
    if (req.params.UserName) {
        let criteria = {};
        criteria['UserName'] = req.params.UserName;
        const client = new MongoClient(mongourl);
        client.connect(function(err) {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);

            findDocument(db, criteria, function(docs){
                client.close();
                console.log("Closed DB connection");
                res.status(200).json(docs);
            });
        });
    } else {
        res.status(500).json({"error": "missing restaurant id"});
    }
})




app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
//app.listen(app.listen(process.env.PORT || 8099));
