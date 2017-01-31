var http = require('http');
var fs = require('fs');
var url = require('url');
var oracledb = require('oracledb');
var port = process.env.port || 1337;
var keyWord = new Buffer('nodejs');
var apiKey = keyWord.toString('base64'); //bm9kZWpz

http.createServer(onRequest).listen(port);

function onRequest(req, res) {

    var urlParts = url.parse(req.url, true);
    var key = urlParts.query['apiKey'];

    if (req.method == 'GET' && urlParts.pathname == '/getUsers' && key == apiKey) {
        console.log("Authenticated");
        getUsers(req, res);
    } else if (req.method == 'POST' && urlParts.pathname == '/insertUser' && key == apiKey){
        console.log("Authenticated");
        insertUser(req, res);
    } else if (req.method == 'GET' && urlParts.pathname == '/getUserById' && key == apiKey){
        console.log("Authenticated");
        var sID = urlParts.query['USERID'];
        getUserById(sID, req, res);
    } else {
        send404Response(res);
    };

};

function getUsers(request, response) {
    var oRequest = request;
    var oResponse = response;

    oracledb.getConnection(
        {
            user: "dev",
            password: "password",
            connectString: "localhost/XE"
        },
        function (err, connection) {
            if (err) {
                console.error(err.message);
                oResponse.writeHead(500, { "Content-Type": "application/json" });
                var json = JSON.stringify({
                    status: 500,
                    message: "Error connecting to DB",
                    detailed_message: err.message
                });
                oResponse.end(json);
            }
            connection.execute(
                "SELECT * FROM USERS ",
                {},
                { outFormat: oracledb.OBJECT }, //RETURN THE RESULT AS OBJECT
                function (err, result) {
                    if (err) {
                        console.error(err.message);
                        oResponse.writeHead(500, { "Content-Type": "application/json" });
                        var json = JSON.stringify({
                            status: 500,
                            message: "Error getting the user",
                            detailed_message: err.message
                        });
                        oResponse.end(json);
                    } else {
                        console.log(JSON.stringify(result.rows));
                        oResponse.writeHead(200, { "Content-Type": "application/json" });
                        oResponse.end(JSON.stringify(result.rows));
                    };
                    doRelease(connection);                   
                });            
        });
};

function getUserById(id, request, response) {
    var oRequest = request;
    var oResponse = response;
    var sId = id;

    oracledb.getConnection(
        {
            user: "dev",
            password: "password",
            connectString: "localhost/XE"
        },
        function (err, connection) {
            if (err) {
                console.error(err.message);
                oResponse.writeHead(500, { "Content-Type": "application/json" });
                var json = JSON.stringify({
                    status: 500,
                    message: "Error connecting to DB",
                    detailed_message: err.message
                });
                oResponse.end(json);
            }
            connection.execute(
                "SELECT * FROM USERS WHERE ID = :ID",
                [sId],
                { outFormat: oracledb.OBJECT }, //RETURN THE RESULT AS OBJECT
                function (err, result) {
                    if (err) {
                        console.error(err.message);
                        oResponse.writeHead(500, { "Content-Type": "application/json" });
                        var json = JSON.stringify({
                            status: 500,
                            message: "Error getting the user",
                            detailed_message: err.message
                        });
                        oResponse.end(json);
                    } else {
                        console.log(JSON.stringify(result.rows));
                        oResponse.writeHead(200, { "Content-Type": "application/json" });
                        oResponse.end(JSON.stringify(result.rows));
                    };
                    doRelease(connection);
                });
        });
};

function insertUser(request, response) {
    var oRequest = request;
    var oResponse = response;

    console.log('Inserting data....');
    var data = [];
    oRequest.on('data', function (chunk) {
        data.push(chunk.toString());
    });

    oRequest.on('end', function () {
        var oData = JSON.parse(data);

        oracledb.getConnection(
            {
                user: "dev",
                password: "password",
                connectString: "localhost/XE"
            },
            function (err, connection) {
                var sUsername = oData.USERNAME;
                var sPassword = oData.PASSWORD;

                if (err) {
                    console.error(err.message);
                    oResponse.writeHead(500, { "Content-Type": "application/json" });
                    var json = JSON.stringify({
                        status: 500,
                        message: "Error connecting to DB",
                        detailed_message: err.message
                    });
                    oResponse.end(json);
                }
                connection.execute(
                    "INSERT INTO USERS(USERNAME, PASSWORD) VALUES(:USERNAME, :PASSWORD)",
                    [sUsername, sPassword],
                    { autoCommit: true },
                    function (err, result) {
                        if (err) {
                            console.error(err.message);
                            oResponse.writeHead(500, { "Content-Type": "application/json" });
                            var json = JSON.stringify({
                                status: 500,
                                message: "Error inserting the user",
                                detailed_message: err.message
                            });
                            oResponse.end(json);
                        } else {
                            oResponse.writeHead(200, { "Content-Type": "text/plain" });
                            oResponse.write('pass');
                            oResponse.end();
                        };
                        doRelease(connection);
                    });
            });

    });
};

function updateUserById(id) {

};

function deleteUserById(id) {

};

function send404Response(resp) {
    resp.writeHead(404, { 'Content-Type': 'text/plain' });
    resp.write("Error 404: Page not found!");
    resp.end();
};

//release db connection
function doRelease(connection) {
    connection.close(function (err) {
        if (err) {
            //todo: create custom error handler
            console.log(err.message);
        } else {
            console.log("closed connection");
        };
    });
};