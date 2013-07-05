var express = require('express');
var fs      = require('fs');
// routes
var authentication   = require('./routes/authentication');
var company = require('./routes/company');
var database = require('./routes/database');
var item   = require('./routes/item');
var location = require('./routes/location');
var login   = require('./routes/login');
var map   = require('./routes/map');
var user = require('./routes/user');
var dbAdmin = require('./routes/dbAdmin');
// not my stuff
var http    = require('http');
var https   = require('https');
var mongodb = require('mongodb');


var ItemMaperApp = function() {
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
        self.port      = 8909;
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
           console.log('%s: Received %s - terminating item maper app ...',
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
            self.app.set('title', 'ItemMaper');
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

        // paths
        self.app.get('/test2', function(req, res){
            
        });
        self.app.get('/dbAdmin/*', database.getDbConnection);
        self.app.get('/dbAdmin/clearTokens', dbAdmin.clearTokens);
        self.app.get('/dbAdmin/clearUsers', dbAdmin.clearUsers);
        //non-security paths
        self.app.all('/map/*', database.getDbConnection);
        self.app.get('/map/user/new', user.newUser);
        self.app.get('/map/doesUsernameExist', user.doesUsernameExist);
        //self.app.put('/map/company/new', company.newCompany);
        self.app.get('/map/user/login', user.login);
        self.app.get('/map/user/logout', user.logout);

        //security checkers
        self.app.all('/map/*', authentication.checkForToken);
        self.app.all('/map/*', database.getUserFromToken);

        //security-restricted paths
        self.app.get('/map/user/data', user.userData);
        self.app.get('/map/company/info', company.getCompanyInfo);
        self.app.put('/map/company/edit', company.editCompany);
        self.app.get('/map/location/ios', location.getLocationIos);
        self.app.get('/map/location/android', location.getLocationAndroid);
        self.app.get('/map/location/website', location.getLocationWebsite);
        self.app.get('/map/item/new', item.newItem);
        self.app.get('/map/item', item.items);
        self.app.put('/map/item/edit', item.editItem);

        self.app.post('/map/location/ios', location.updateLocationIos);
        self.app.post('/map/location/android', location.updateLocationAndroid);
        self.app.post('/map/location/website', location.updateLocationWebsite);
        self.app.post('/map/user/logout', user.logout);

        self.app.all('/map/*', database.closeDb, database.endResponse);
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

    self.httpsOptions = {
        key: fs.readFileSync('key.pem').toString(),
        cert: fs.readFileSync('cert.pem').toString()
    }

    // console.log(fs.readFileSync('key.pem').toString(),fs.readFileSync('cert.pem').toString())
    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        // self.server = https.createServer(self.httpsOptions, self.app).listen(self.port, function() {
        self.server = self.app.listen(self.port, function(){
            console.log('%s: Node https server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
        // console.log(self.server);
    };

    
};   /*  Sample Application.  */

var tapp = new ItemMaperApp();
tapp.initialize();
tapp.start();

/*Things to add
*   truncation of database field inserts, just in case something too long gets sent from the front end
*   all trucks and specific truck different return for admin to include extra data like clicks and contacts
*   add contact history to contacts
*/