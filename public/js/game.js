/* global Phaser RemotePlayer io */
console.log(window.document.body.offsetWidth);
var winW = document.body.offsetWidth;
var winH = document.body.offsetHeight;

//var game = new Phaser.Game(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

var game = new Phaser.Game(winW, winH, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

function randomizer (min, max) {
 return Math.floor(Math.random()*((max-min) +1)) + min;
};

var scaleRatio = window.devicePixelRatio / 2;

var dictionary = {
};

var assetArray = [];

function AssetMake(name, location, source, opts){
  this.name = name;
  this.location = location;
  this.source = source;
  assetArray.push(this);
}

//slight code smell here
function assetProcesser(func, assets, dict, helperfunc) {
  assets.forEach(function(asset){
    dict[asset.name] = func(asset.name, asset.location, asset.source)
    game.physics.arcade.enable(dict[asset.name])
    if(helperfunc) {
      if([].isArray(helperfunc)) {
        helperfunc.forEach(function(func){
          func(dict[asset.name])
        })
      }  else {
        helperfunc(dict[asset.name])
        }
    }
  })
}

function preload () {
  game.load.image('ball','assets/snake_body.png');
  game.load.image('earth', 'assets/ice.png');
  game.load.image('apple', 'assets/apple.png');
  game.load.image('dude', 'assets/red_elf.png');
  game.load.audio('scream', 'assets/scream.mp3');
  game.load.audio('pointred', 'assets/pointred.mp3');
  game.load.audio('pointgreen', 'assets/pointgreen.mp3');
  game.load.image('snowman', 'assets/snowman.png');
  //game.load.spritesheet('dude2', 'assets/dude2.png', 64, 64)
  game.load.image('snakehat', 'assets/snake_head.png');
}

var socket; // Socket connection;
var land;
var player;
var enemies;

var currentSpeed = 0;
var currentSpeed2 = 0;
var cursors;
var snakeCountdown = 100;
var scoreTextRed;
var scoreTextGreen;
var redScore = 0;
var greenScore = 0;
var pointgreen;
var pointred;

var wsad;


// //var snakeOpts = {
//   goToPlayer: function (){game.physics.arcade.moveToObject(snakeHead, player, 200)},
//   goToObstacle: function(){game.physics.arcade.moveToObject(snakeHead, snowman, 300)},
//   goRight: function(){snakeHead.body.angularVelocity = 300},
//   goLeft: function(){snakeHead.body.angularVelocity = -300},
//   goToPlayerFast: function (){game.physics.arcade.moveToObject(snakeHead, player, 350)},
//   goToPlayerSlow: function (){game.physics.arcade.moveToObject(snakeHead, player, 150)},
//   currentOpt: function(){game.physics.arcade.moveToObject(snakeHead, player, 150)}
// //}

var curTarget;
var snakeOpts = [
  function (){game.physics.arcade.moveToObject(snakeHead, player, 250);
    snakeHead.rotation = game.physics.arcade.angleBetween(snakeHead, player)
    ;},
  function(){game.physics.arcade.moveToObject(snakeHead, snowman, 300);
    snakeHead.rotation = game.physics.arcade.angleBetween(snakeHead, snowman) * 0.9
    ;},
  function(){snakeHead.body.angularVelocity = 250},
  function(){snakeHead.body.angularVelocity = -250},
  function(){game.physics.arcade.moveToObject(snakeHead, player, 350);
    snakeHead.rotation = game.physics.arcade.angleBetween(snakeHead, player) * 0.9
    },
  function(){game.physics.arcade.moveToObject(snakeHead, player, 250);
    snakeHead.rotation = game.physics.arcade.angleBetween(snakeHead, player) * 0.9
    ;},
    function(){snakeHead.body.angularVelocity = 450},
  function(){game.physics.arcade.moveToObject(snakeHead, player, 250);
    snakeHead.rotation = game.physics.arcade.angleBetween(snakeHead, curTarget) * 0.9
    ;
  }
];


//snake stuff
var snakeHead; //head of snake sprite
var snakeSection = []; //array of sprites that make the snake body sections
var snakePath = []; //arrary of positions(points) that have to be stored for the path the sections follow
var numSnakeSections = 13; //number of snake body sections
var snakeSpacer = Math.round(scaleRatio * 9.5) ; //parameter that sets the spacing between sections
var snowman;
var snakeHat;

function randomizedStart(){
    return Math.round(Math.random() * (winH - 200));
}

function playerInit() {
  player = game.add.sprite(randomizedStart(), 0, 'dude');
  player.scale.setTo(scaleRatio, scaleRatio);
  player.team = "green";
  game.physics.arcade.enable(player);
  player.anchor.setTo(0.5, 0.5);
  //player.animations.add('move', [0, 1, 2, 3, 4, 5, 6, 7], 20, true);
  //player.animations.add('stop', [3], 20, true);
  player.body.bounce.setTo(0.8, 0.8);
  // This will force it to decelerate and limit its speed
  //player.body.drag.setTo(200, 200);
  player.body.maxVelocity.setTo(400, 400);
  player.body.collideWorldBounds = true;
  player.bringToTop();
  curentSpeed = 0;
  game.camera.follow(player);
}



function snakeInit(data) {
  console.log("snake init", data);
  snakeHead = game.add.sprite(data.x, data.y, 'snakehat');
  snakeHead.scale.setTo(scaleRatio, scaleRatio);
  snakeHead.anchor.setTo(0.5, 0.5);
  game.physics.arcade.enable(snakeHead);
   //snakeHat = snakeSection[1] = game.add.sprite(300, 300, 'snakehat')
  for (var i = 1; i <= numSnakeSections-1; i++) {
    snakeSection[i] = game.add.sprite(1200, 1200, 'ball');
    snakeSection[i].anchor.setTo(0.5, 0.5);
    snakeSection[i].scale.setTo(scaleRatio, scaleRatio);
        //if (i < 4){
      //snakeSection[i].anchor.setTo(0.3, 0.3);
    //}
  }
  for (var k = 0; k <= numSnakeSections * snakeSpacer; k++) {
    snakePath[k] = new Phaser.Point(1200, 1200);
  }

  snakeHead.body.collideWorldBounds = true;
  socket.emit('new countdown', {count: snakeCountdown})
  //snakeHead.bringToTop();
}

function obstacleInit(){
snowman = game.add.sprite(randomizedStart(), randomizedStart(), 'snowman');
game.physics.arcade.enable(snowman);
snowman.body.velocity.setTo(300, 300);
snowman.body.collideWorldBounds = true;
snowman.body.bounce.setTo(1, 1);
}

function create () {
  keys = game.input.keyboard.createCursorKeys();
   game.physics.startSystem(Phaser.Physics.ARCADE);
  socket = io.connect();
  // Resize our game world to be a 2000 x 2000 square
  //game.world.setBounds(0, 0, 2500, 2500);
  // Our tiled scrolling background
  land = game.add.tileSprite(0, 0, winW * 2, winH * 2, 'earth');
  land.fixedToCamera = true;
  scream = game.add.audio('scream');
  pointgreen = game.add.audio('pointgreen');
  pointred = game.add.audio('pointred');
  playerInit();
  //  Init snakeSection array
  //snakeInit();
  socket.emit('get snake');
  obstacleInit();
  // The base of our player
  //var startX = Math.round(Math.random() * (1000) - 500);
  //var startY = Math.round(Math.random() * (1000) - 500);
  //player = game.add.sprite(startX, startY, 'dude');

  // This will force it to decelerate and limit its speed
  //player.body.drag.setTo(200, 200);
  //snake.body.collideWorldBounds = true;
  //snakeHead.body.collideWorldBounds = true;
  // Create some baddies to waste :)
  enemies = [];
  game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
  game.camera.focusOnXY(0, 0);
  //cursors = game.input.keyboard.createCursorKeys()
  //key direction implementation
  // Start listening for events
  scoreTextGreen = game.add.text(8, 8, 'Green: 0', { fontSize: '24px', fill: '#3C8D0D' });
  scoreTextRed = game.add.text(8, 32, 'Red: 0', { fontSize: '24px', fill: '#D11111' });
  scoreTextRed.fixedToCamera = true;
  scoreTextGreen.fixedToCamera = true;
  scoreTextGreen.bringToTop();
  scoreTextRed.bringToTop();
  setEventHandlers();
}

var setEventHandlers = function () {
  // Socket connection successful
  socket.on('connect', onSocketConnected);
  // Socket disconnection
  socket.on('disconnect', onSocketDisconnect);
  // New player message received
  socket.on('new player', onNewPlayer);
  // Player move message received
  socket.on('move player', onMovePlayer);
  socket.on('snake decided', snakeHeading);
  // Player removed message received
  socket.on('remove player', onRemovePlayer);
  socket.on('score update', onScoreUpdate);
  socket.on('got snake', snakeInit)
  socket.on('refresh countdown', refreshTime)
};

// Socket connected

function refreshTime(data){
  snakeCountdown = data.newcount;
}

function onAskSnake() {
  console.log('snake asked!')
  socket.emit('snake asked')
}

function onScoreUpdate(data) {
  console.log("player killed!");
  redScore = data.data.red;
  greenScore = data.data.green;
  scoreTextRed.text = 'Red: ' + redScore;
  scoreTextGreen.text = 'Green: ' + greenScore;
  scream.play();
}
function onSocketConnected () {
  console.log('Connected to socket server');
  // Send local player data to the game server
  socket.emit('new player', { x: player.x, y: player.y });
}

// Socket disconnected
function onSocketDisconnect () {
  console.log('Disconnected from socket server');
}

// New player
function onNewPlayer (data) {
  console.log('New player connected:', data.id);

  // Add new player to the remote players array
  enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y));
}

// Move player
function onMovePlayer (data) {
  var movePlayer = playerById(data.id);

  // Player not found
  if (!movePlayer) {
    console.log('Player not found: ', data.id);
    return;
  }

  // Update player position
  movePlayer.player.x = data.x;
  movePlayer.player.y = data.y;
}

function snakeHeading(data){
  console.log(data.data)
  var curData = data.data || 5
  console.log(curData)
  //console.log(curData);
  //snakeCountdown--;
  //if(snakeCountdown === 0){
    //snakeCountdown = 10;
    //console.log(curData)
    snakeOpts[snakeOpts.length-1] = snakeOpts[curData];
  //}
  snakeOpts[snakeOpts.length-1]();
}


function onMoveSnake (data) {
  console.log(data)
  // Update player position
  snake.x = data.x;
  snake.y = data.y;
}


// Remove player
function onRemovePlayer (data) {
  var removePlayer = playerById(data.id);

  // Player not found
  if (!removePlayer) {
    console.log('Player not found: ', data.id);
    return;
  }

  removePlayer.player.kill();

  // Remove player from array
  enemies.splice(enemies.indexOf(removePlayer), 1);
}

function update () {
  game.camera.follow(player);
  curTarget = curTarget || player;
  snakeCountdown--;
  if(snakeCountdown < 10){
    console.log("getting to ask")
      onAskSnake()
      snakeCountdown = 100;
  }
  game.physics.arcade.collide(player, snowman);
  game.physics.arcade.collide(snakeHead, snowman);
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].alive) {
      enemies[i].update();
      game.physics.arcade.collide(player, enemies[i].player);
    }
  }
   if (keys.left.isDown) {
    player.angle -= 5;
    if (currentSpeed > 0){
      currentSpeed = currentSpeed - 10 ;
    }
  } if (keys.right.isDown) {
    player.angle += 5
      if (currentSpeed > 0){
      currentSpeed = currentSpeed - 10 ;
    }
  } else {
    currentSpeed = currentSpeed + 5;
    player.body.velocity.setTo(player.body.velocity + 100);
  }
  currentSpeed++;


  /* if (keys.up.isDown) {
    player.angle += 10
  } else if (keys.down.isDown) {
    player.angle -= 10
  } */
  if (currentSpeed > 0) {
    game.physics.arcade.velocityFromRotation(player.rotation, currentSpeed, player.body.velocity);
      land.tilePosition.x = -game.camera.x;
      land.tilePosition.y = -game.camera.y;
    //player.animations.play('move');
  } else {
    //player.animations.play('stop');
  }

  land.tilePosition.x = -game.camera.x;
  land.tilePosition.y = -game.camera.y;
  socket.emit('move player', { x: player.x, y: player.y });
  if(snakeHead){
      for (var i = 0; i < snakeSection.length; i++) {
      game.physics.arcade.collide(player, snakeSection[i]);
  }
  snakeHead.body.velocity.copyFrom(game.physics.arcade.velocityFromAngle(snakeHead.angle, 300));
  var part = snakePath.pop();
  part.setTo(snakeHead.x, snakeHead.y);
  //snakeHead.bringToTop();
  snakePath.unshift(part);
  for (var j = 1; j < numSnakeSections; j++) {
    if(j === 1){
      snakeSection[j].visible = false;
    }
    snakeSection[j].x = (snakePath[j * snakeSpacer]).x;
    snakeSection[j].y = (snakePath[j * snakeSpacer]).y;
  }
  //snakeHead.bringToTop();
    game.physics.arcade.collide(snakeHead, player, collisionHandler, null, this);

     snakeOpts[snakeOpts.length-1]()//snakeHeading()
   }

}

function render () {
 //game.debug.spriteInfo(snakeHead, 32, 32);
}

// Find player by ID
function playerById (id) {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].player.name === id) {
      return enemies[i];
    }
  }
  return false;
}

function collisionHandler (snake, deadplayer) {
  var pointsTo = deadplayer.team
  if (pointsTo === "red"){
    //pointred.play()
  }
  if(pointsTo === "green") {
    //pointgreen.play()
  }

  deadplayer.kill();
  numSnakeSections++;
  //console.log(snakeSection);
  //console.log(snakePath.length);
  //debugger;
  //snakePath.push(new Phaser.Point(400, 300));
  snakeSection.push(game.add.sprite(1200, 1200, 'ball'));
  snakeSection[(numSnakeSections - 1)].anchor.setTo(0.5, 0.5);
  for (var q = 0; q <= numSnakeSections * snakeSpacer; q++) {
    snakePath[q] = snakePath[q] || new Phaser.Point(1200, 1200);
  }//these teams are the team that gets points, remember
  socket.emit('player killed', {playerTeam: pointsTo})
    if (pointsTo === "red"){
  }
  if(pointsTo === "green") {
    playerInit()
  }

}

