var express = require("express");
var bodyParser = require("body-parser");
var _ = require("underscore");
var fetch = require('whatwg-fetch');

module.exports = function(port, middleware, callback) {
    var app = express();

    if (middleware) {
        app.use(middleware);
    }
    app.use(express.static("public"));
    app.use(bodyParser.json());

    var h = {};

    // Create new list
    app.post("/api/todo", function(req, res) {
        var loc = req.body.loc;
        h[loc] = {};
        h[loc].bck = "#191818";
        h[loc].latestId = 0;
        h[loc].todos = [];
        res.sendStatus(201);
    });

    function getList(list) {
        return h[list].todos;
    }

    function getLatestId(list) {
        return h[list].latestId;
    }

    function getBck(list) {
        return h[list].bck;
    }

    function increaseLatestId(list){
        h[list].latestId++;
    }

    // create todo
    app.post("/api/todo/:list", function(req, res) {
        var list = req.params.list;
        var todo = req.body;
        todo.id = getLatestId(list);
        increaseLatestId(list);
        h[list].todos.push(todo);
        res.set("Location", "/api/todo/" + todo.id);
        res.sendStatus(201);
    });

    // Read
    app.get("/api/todo/:list", function(req, res) {
        var list = req.params.list;
        var response = {
            todos : getList(list),
            bck: getBck(list)
        };
        res.json(response);
    });

    // Delete
    app.delete("/api/todo/:list/:id", function(req, res) {
        var list = req.params.list;
        var id = req.params.id;
        var todo = getTodo(list, id);
        h[list].todos = h[list].todos.filter(function(otherTodo) {
            return otherTodo !== todo;
        });
        res.sendStatus(200);
    });

    app.delete("/api/todo/comment", function(req, res) {
        var list = req.body.list;
        var id = req.body.id;
        var comment = req.body.comment;
        var todo = getTodo(list, id);
        todo.comments = todo.comments.filter(function(comm){
            return comm !== comment;
        });
        res.sendStatus(200);
    });

     //Set background
    app.put("/api/todo/bck", function(req, res) {
        var list = req.body.list;
        h[list].bck = req.body.bck;
        res.sendStatus(200);
    });

    //Update
    app.put("/api/todo/:list/:id", function(req, res) {
        var list = req.params.list;
        var id = req.params.id;
        var todo = getTodo(list, id);
        todo.title = req.body.title;
        todo.isComplete = req.body.isComplete;
        todo.comments = req.body.comments;
        res.sendStatus(200);
    });

    function getTodo(list, id) {
        var todos = h[list].todos;
        return _.find(todos, function(todo) {
            return String(todo.id) === String(id);
        });
    }

    var server = app.listen(port, callback);

    // We manually manage the connections to ensure that they're closed when calling close().
    var connections = [];
    server.on("connection", function(connection) {
        connections.push(connection);
    });

    return {
        close: function(callback) {
            connections.forEach(function(connection) {
                connection.destroy();
            });
            server.close(callback);
        }
    };
};
