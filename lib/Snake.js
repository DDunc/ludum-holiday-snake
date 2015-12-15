/* ************************************************
** GAME SNAKE CLASS
************************************************ */
var Snake = function (startX, startY) {
  var x = startX
  var y = startY
  var id = 111;

  // Getters and setters
  var getX = function () {
    return x
  }

  var getY = function () {
    return y
  }

  var setX = function (newX) {
    x = newX
  }

  var setY = function (newY) {
    y = newY
  }

  // Define which variables and methods can be accessed
  return {
    getX: getX,
    getY: getY,
    setX: setX,
    setY: setY,
    id: id
  }
}

// Export the Player class
module.exports = Snake