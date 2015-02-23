/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var stageWidth = 640;
var stageHeight = 480;
var stageOrigin = [0,0];
var timeOutInterval = 500;

this.cellSide = 25;

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

// Create a renderer instance.
var renderer = PIXI.autoDetectRenderer(stageWidth, stageHeight);

var tetrino = function() {
  // Here's the constructor of the object.
  // Choose which tetrino we will render from the tetrinoConfig.
  this.shape = 0;
  this.shapeConfig = tetrinosConfig[this.shape];
  this.shapeRotation = Math.floor(Math.random() * (this.shapeConfig.length));
  this.shapeCoors = this.shapeConfig[this.shapeRotation];
  
  this.xPos = 0;
  this.yPos = 0;
  
  // Create a new graphics object
  this.graphics = new PIXI.Graphics();
  
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
        stageOrigin[0] + cellOrigin[0] + this.xPos, 
        stageOrigin[1] + cellOrigin[1] + this.yPos,
        cellSide, 
        cellSide
      );
    }

    this.graphics.endFill();
  }
  
  this.fall = function () {
    this.makeShape();
    
    stage.addChild(piece.graphics);

    renderer.render(stage);
    
    var t = this;
    setTimeout(function () {
      if (t.yPos <= 240) {
        t.yPos += cellSide;
        t.fall();
      }
    }, timeOutInterval);
  }
}

// Add the renderer view element to the DOM
document.body.appendChild(renderer.view);

// Create a new tetris piece.
var piece = new tetrino();
// Start its fall from the top of the stage.
piece.fall(0);

// Event listener to listen for left, right, space keypresses.
window.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
    case 37: // Left
      piece.xPos -= cellSide;
      piece.fall(0);
      console.log(piece.xPos);
      break;
    case 39: // Right
      piece.xPos += cellSide;
      piece.fall(0);
      console.log(piece.xPos);
      break;
  }
}, false);