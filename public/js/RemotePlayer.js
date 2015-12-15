/* global game */

var RemotePlayer = function (index, game, player, startX, startY) {
  var x = startX
  var y = startY

  this.game = game
  this.health = 3
  this.player = player
  this.alive = true
  game.physics.startSystem(Phaser.Physics.ARCADE);


  this.player = game.add.image(x, y, 'enemy')
  game.physics.arcade.enable(this.player);

  this.player.anchor.setTo(0.5, 0.5)

  this.player.name = index.toString()
  //this.player.body.immovable = true
  this.player.body.collideWorldBounds = true

  this.player.angle = game.rnd.angle()

  this.lastPosition = { x: x, y: y }
}

RemotePlayer.prototype.update = function () {
  if (this.player.x !== this.lastPosition.x || this.player.y !== this.lastPosition.y) {
    this.player.rotation = Math.PI + game.physics.arcade.angleToXY(this.player, this.lastPosition.x, this.lastPosition.y)
  } else {
  }
  this.lastPosition.x = this.player.x
  this.lastPosition.y = this.player.y
}

window.RemotePlayer = RemotePlayer
