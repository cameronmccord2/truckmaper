var express = require('express');
var fs      = require('fs');
var api     = require('./routes/api');
var admin   = require('./routes/admin');
var adminPhoto   = require('./routes/adminPhoto');
var adminTruckClicks   = require('./routes/adminTruckClicks');
var adminContacts   = require('./routes/adminContacts');
var adminTruckData   = require('./routes/adminTruckData');
var database = require('./routes/database');
var clientContacts = require('./routes/clientContacts');
var clientLogClicks = require('./routes/clientLogClicks');
var clientTruckData = require('./routes/clientTruckData');
var http    = require('http');
var https   = require('https');
var mongodb = require('mongodb');


/**
 *  Define the sample application.
 */
var TruckListingApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = '54.214.238.10';
        self.port      = 443;
    };


    /**
     *  Populate the cache.
     */
    // self.populateCache = function() {
    //     if (typeof self.zcache === "undefined") {
    //         self.zcache = { 'index.html': '' };
    //     }

    //     //  Local cache for static content.
    //     self.zcache['index.html'] = fs.readFileSync('./index.html');
    // };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    // self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating trucklisting app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        // Routes for /health, /asciimo and /
        self.routes['/health'] = function(req, res) {
            res.send('1');
        };

        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

        // self.routes['/'] = function(req, res) {
        //     res.setHeader('Content-Type', 'text/html');
        //     res.send(self.cache_get('/public/index.html') );
        // };
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();

        // Configuration
 
        self.app.configure(function () {
            self.app.set('title', 'TruckListing');
            //self.app.set('views', __dirname + '/views');
            //self.app.set('view engine', 'jade');
            self.app.use(express.limit(100000000));//100 mb limit on file uploads
            self.app.use(express.compress());
            self.app.use(express.methodOverride());
            self.app.use(express.bodyParser({keepExtensions:true}));
            self.app.use(self.app.router);
            self.app.use(express.static('public'));
        });

        self.app.configure('development', function(){
          self.app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
        });

        self.app.configure('production', function(){
          self.app.use(express.errorHandler());
        });

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }

        // Routes


        // app.get('/', function(req,res){
        //     res.sendfile('index.html');
        // });

        //params
        self.app.param('id');

        self.app.get('/truckMap/user/new', user.newUser);
        self.app.get('/truckMap/doesUsernameExist', user.doesUsernameExist);
        self.app.put('/truckMap/company/new', company.newCompany);
        self.app.post('/truckMap/user/login', database.getDbConnection, user.login);


        self.app.all('*', authentication.checkForToken);
        self.app.all('*', database.getDbConnection);
        self.app.all('*', database.getUserFromToken);

        //static paths
        self.app.get('/truckMap/allTrucksSimple', map.allTrucksSimple);
        self.app.get('/truckMap/allTrucksComplex', map.allTrucksComplex);
        self.app.get('/truckMap/getUserData', user.userData);
        self.app.get('/truckMap/company/info', company.getCompanyInfo);
        self.app.get('/truckMap/location/ios', location.getLocationIos);
        self.app.get('/truckMap/location/android', location.getLocationAndroid);
        self.app.get('/truckMap/location/website', location.getLocationWebsite);
        self.app.get('/truckMap/item/new', item.newItem);
        self.app.get('/truckMap/item/all', item.allItems);

        self.app.put('/truckMap/truck/new', truck.new);

        self.app.post('/truckMap/location/ios', location.updateLocationIos);
        self.app.post('/truckMap/location/android', location.updateLocationAndroid);
        self.app.post('/truckMap/location/website', location.updateLocationWebsite);
        
        self.app.post('/truckMap/user/logout', user.logout);

        // variable paths
        self.app.get('/truckMap/truckComplex/:id', map.truckComplexId);
        self.app.get('/truckMap/item/editHistory', item.editHistory);
        self.app.put('/truckMap/truck/edit/:id', truck.editTruck);
        self.app.put('/truckMap/company/edit/:id', company.editCompany);
        self.app.put('/truckMap/item/edit/:id', item.editItem);
    };


    /**
     *  edit the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        // self.populateCache();
        self.setupTerminationHandlers();
        // Create the express server and routes.
        self.initializeServer();
    };

    self.options = {
        key: fs.readFileSync('server.key').toString(),
        cert: fs.readFileSync('server.crt').toString()
    }


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.server = https.createServer(self.options, self.app).listen(self.port, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

    
};   /*  Sample Application.  */

var tapp = new TruckListingApp();
tapp.initialize();
tapp.start();

/*Things to add
*   truncation of database field inserts, just in case something too long gets sent from the front end
*   all trucks and specific truck different return for admin to include extra data like clicks and contacts
*   add contact history to contacts
*/