/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var LEFT = 1;
var RIGHT = 2;
var BOTTOM = 3;

var cellSide = 24;
var gridCols = 18;
var gridRows = 24;

var stageOrigin = [0,0];
var timeOutInterval = 500;

var tetrinosConfig = [
  [
    [[0,0],[1,0],[2,0],[2,1]], // First shape, first rotation.
    [[1,0],[1,1],[0,2],[1,2]], // First shape, second rotation.
    [[0,0],[0,1],[1,1],[2,1]], // First shape, third rotation.
    [[1,0],[2,0],[1,1],[1,2]], // First shape, fourth rotation.
  ]
];

// Create an new instance of a pixi stage
var stage = new PIXI.Stage(0x000000);

// Stage dimensions.
var stageWidth = cellSide * gridCols;
var stageHeight = cellSide * gridRows;

// Create a renderer instance.
var renderer = PIXI.autoDetectRenderer(stageWidth, stageHeight);

var gameGrid = function() {  
  // Initialise the grid.
  this.grid = createArray(gridCols, gridRows);
  this.oldActiveShapeCoors = new Array(0, 0);
  
  this.initialiseActiveShape = function (shapeCoors) {
    // Map the active shape on to the grid.
    for (i = 0; i < shapeCoors.length; i++) {
      this.grid[stageOrigin[0] + shapeCoors[i][0]][stageOrigin[1] + shapeCoors[i][1]] = 1;
    }
  }
  
  this.moveActiveShape = function (x, y, shapeCoors) {
    for (i = 0; i < shapeCoors.length; i++) {
      // Wipe the old position of the active shape.
      this.grid[stageOrigin[0] + this.oldActiveShapeCoors[0] + shapeCoors[i][0]][stageOrigin[1] + this.oldActiveShapeCoors[0] + shapeCoors[i][1]] = 0;
      // Map the active shape on to the grid in its new position.
      this.grid[stageOrigin[0] + x + shapeCoors[i][0]][stageOrigin[1] + y + shapeCoors[i][1]] = 1;
    }
    // Save the origin of the shape for next time.
    this.oldActiveShapeCoors = [x, y];
  }
  
  this.moveAllowed = function (x, y, shapeCoors) {
    for (i = 0; i < shapeCoors.length; i++) {
      requestedX = stageOrigin[0] + x + shapeCoors[i][0];
      requestedY = stageOrigin[1] + y + shapeCoors[i][1];
      
      // Things that tell us immediately this move cannot be made.
      if (requestedX >= gridCols || requestedX < 0) {
        return false;
      }
      if (requestedY >= gridRows || requestedY < 0) {
        return false;
      }
    }
    return true;
  }
}

var tetrino = function() {
  // Here's the constructor of the object.
  // Choose which tetrino we will render from the tetrinoConfig.
  this.shape = 0;
  this.shapeConfig = tetrinosConfig[this.shape];
  this.shapeRotation = Math.floor(Math.random() * (this.shapeConfig.length));
  this.shapeCoors = this.shapeConfig[this.shapeRotation];
  
  // The cell coordinates of the shape's position on the grid.
  this.x = 0;
  this.y = 0;
  
  // Create a new graphics object
  this.graphics = new PIXI.Graphics();
  
  this.rotateShape = function() {
    this.shapeRotation++;
    if (this.shapeRotation >= this.shapeConfig.length) {
      this.shapeRotation = 0;
    }
    this.shapeCoors = this.shapeConfig[this.shapeRotation];
  }
  
  this.makeShape = function() {
    this.graphics.clear();
    // Loop through the coordinates of this shape and draw it.
    for (index = 0; index < this.shapeCoors.length; ++index) {
      var cellOrigin = [
        this.shapeCoors[index][0] * cellSide, 
        this.shapeCoors[index][1] * cellSide,
      ];

      this.graphics.beginFill(0x00FF00);
      this.graphics.drawRect(
        stageOrigin[0] + cellOrigin[0] + (this.x * cellSide), 
        stageOrigin[1] + cellOrigin[1] + (this.y * cellSide),
        cellSide, 
        cellSide
      );
    }

    this.graphics.endFill();
  }
  
  this.fall = function () {
    this.makeShape();
    
    stage.addChild(this.graphics);

    // Update the shape on the grid.
    grid.moveActiveShape(this.x, this.y, this.shapeCoors);

    renderer.render(stage);
    
    var t = this;
    setTimeout(function () {
      t.y += 1;
      t.fall();
    }, timeOutInterval);
  }
  
  this.slide = function () {
    this.makeShape();
    
    stage.addChild(this.graphics);

    // Update the shape on the grid.
    grid.moveActiveShape(this.x, this.y, this.shapeCoors);

    renderer.render(stage);
  }
}

function createArray(cols, rows) {
  var a = new Array();

  for (x = 0; x < cols; x++) {
    a[x] = new Array();
    for (y = 0; y < cols; y++) {
      a[x][y] = 0;
    }
  }
  return a;
}

// Add the renderer view element to the DOM
document.body.appendChild(renderer.view);

// Create the grid that will hold the pieces.
var grid = new gameGrid();
// Create a new tetris piece.
var piece = new tetrino();

// Add the new piece to the grid.
grid.initialiseActiveShape(piece.shapeCoors);

// Start its fall from the top of the stage.
piece.fall();

// Event listener to listen for left, right, space keypresses.
window.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
    case 37: // Left
      if (grid.moveAllowed(piece.x - 1, piece.y, piece.shapeCoors)) {
        piece.x -= 1;
      }
      break;
    case 39: // Right
      if (grid.moveAllowed(piece.x + 1, piece.y, piece.shapeCoors)) {
        piece.x += 1;
      }
      break;
    case 32: // Spacebar
      piece.rotateShape();
  }
  
  piece.slide();
  
}, false);

// The grid based rules are working to stop the shape disappearing off the left
// of the screen, but not the right.
// Implement functionality for the space bar so that we can twist the shape.
// Comment the functions and methods.