var util = require('util');
var http = require('http');
var path = require('path');
var ecstatic = require('ecstatic');
var io = require('socket.io');
var Snake = require('./Snake');
var Player = require('./Player');

var port = process.env.PORT || 8080

/* ************************************************
** GAME VARIABLES
************************************************ */
var socket	// Socket controller
var players	// Array of connected players
var score = {
  "red": 0,
  "green": 0
}
var optNo = 0;
var redTeam = 0;
var greenTeam = 0;
/* ************************************************
** GAME INITIALISATION
************************************************ */

// Create and start the http server
var server = http.createServer(
  ecstatic({ root: path.resolve(__dirname, '../public') })
).listen(port, function (err) {
  if (err) {
    throw err
  }

  init()
})

function init () {
  // Create an empty array to store players
  players = []
  players.push(new Snake(1200, 1200))
  // Attach Socket.IO to server
  socket = io.listen(server)
  // Configure Socket.IO
  socket.configure(function () {
    // Only use WebSockets
    socket.set('transports', ['websocket'])

    // Restrict log output
    socket.set('log level', 2)
  })
  // Start listening for events
  setEventHandlers()
} //init end

//Event Handlers
var setEventHandlers = function () {
  // Socket.IO
  socket.sockets.on('connection', onSocketConnection)
}

// New socket connection
function onSocketConnection (client) {
  console.log('New player has connected: ' + client.id)

  // Listen for client disconnected
  client.on('disconnect', onClientDisconnect)

  // Listen for new player message
  client.on('new player', onNewPlayer)

  client.on('get snake', getSnake)
  // Listen for move player message
  client.on('move player', onMovePlayer)

  client.on('snake asked', snakeDecision)

  client.on('player killed', scoreUpdate)

  client.on('new countdown', countUpdate)
  //client.on('snake decision', getSnakeDecision)
  //client.on('move snake', onMoveSnake)
  //snakseDecision(client)
}

function countUpdate(data) {
  console.log("countupdate", data)
  this.emit('refresh countdown', {newcount: data.count})
}
function getSnake(data) {
 this.emit('got snake', {id: players[0].id, x: players[0].getX(), y: players[0].getY()})
}
function scoreUpdate(data) {
  score[data.playerTeam]++;
  this.emit('score update', {data: score})
}

// Socket client has disconnected
function onClientDisconnect () {
  util.log('Player has disconnected: ' + this.id)

  var removePlayer = playerById(this.id)

  // Player not found
  if (!removePlayer) {
    console.log('Player not found: ' + this.id)
    return
  }

  // Remove player from players array
  players.splice(players.indexOf(removePlayer), 1)

  // Broadcast removed player to connected socket clients
  this.broadcast.emit('remove player', {id: this.id})
}

// New player has joined


function onNewPlayer (data) {
  // Create a new player
  var newPlayer = new Player(data.x, data.y)
  newPlayer.id = this.id

  // Broadcast new player to connected socket clients
  this.broadcast.emit('new player', {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()})

  // Send existing players to the new player
  var i, existingPlayer
  for (i = 1; i < players.length; i++) {
    existingPlayer = players[i]
    this.emit('new player', {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()})
  }

  // Add new player to the players array
  players.push(newPlayer)
}

// Player has moved
function onMoveSnake() {
}

function onMovePlayer (data) {
  // Find player in array
  var movePlayer = playerById(this.id)

  // Player not found
  if (!movePlayer) {
    util.log('Player not found: ' + this.id)
    return
  }

  // Update player position
  movePlayer.setX(data.x)
  movePlayer.setY(data.y)

  // Broadcast updated position to connected socket clients
  this.broadcast.emit('move player', {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY()})
}


function snakeDecision(){
  optNo++;
  optNo = optNo > 7 ? 0 : optNo;
  console.log(optNo)
  //this.broadcast.emit('snake decided', optNo)
  this.emit('snake decided', {data: optNo})
}





/* ************************************************
** GAME HELPER FUNCTIONS
************************************************ */
// Find player by ID

function randomizer (min, max) {
 return Math.floor(Math.random()*((max-min) +1)) + min;
};

function playerById (id) {
  var i
  for (i = 0; i < players.length; i++) {
    if (players[i].id === id) {
      return players[i]
    }
  }

  return false
}

//

