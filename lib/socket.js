var io;

var sockets = {};

// io.sockets.clients().clients (hash by id)

var api = {
  init : function(server) {
    io = require('socket.io')(server);
    io.on('connection', function (socket) {
      console.log(socket.id);
    });
  },
  get : function(id) {
    var sockets = io.sockets.clients().sockets;
    return io.sockets.clients().sockets[id];
  }
};


module.exports = api;
