/**
 * Defines a game object that will be used to control the global actions in the
 * game. Also sets all the variables that will be required to set up the game.
 */
var game = function() {
  // Grid variables.
  var ACTIVE = 1; // A cell in the grid containing part of an active tetris piece.
  var FOSSIL = 2; // A cell in the grid containing part of a fossilised (static) tetris piece.
  var EMPTY = 0; // An empty cell in the grid.
  
  // Colours.
  var BACKGROUND_COLOUR = 0x000000; // The background colour of the game stage.
  var SHAPE_DEFAULT_COLOUR = 0x00FF00; // The default colour of the tetris pieces.
  var RED = 0xFF0000;
  var GREEN = 0x00FF00;
  var BLUE = 0x0000FF;
  var YELLOW = 0xFFFF00;

  // Screen dimensions
  var cellSide = 24; // The width and height in pixels of a cell on the game stage.
  var gridCols = 18; // The number of columns on the game grid.
  var gridRows = 24; // The number of cells on the game grid.

  var stageOrigin = [0,0];
  var timeOutInterval = 500;

  var tetrinosConfig = [
    [
      [[0,0],[1,0],[2,0],[2,1]], // First shape, first rotation.
      [[1,0],[1,1],[0,2],[1,2]], // First shape, second rotation.
      [[0,0],[0,1],[1,1],[2,1]], // First shape, third rotation.
      [[1,0],[2,0],[1,1],[1,2]], // First shape, fourth rotation.
    ],
    [
      [[0,0],[0,1],[0,2],[0,3]], // Second shape, first rotation.
      [[0,0],[1,0],[2,0],[3,0]], // Second shape, second rotation.
    ],
    [
      [[0,0],[0,1],[1,0],[1,1]], // Third shape, only rotation.
    ]
  ];
  
  var tetrinoColours = [RED, GREEN, BLUE, YELLOW];

  // Create an new instance of a pixi stage
  var stage = new PIXI.Stage(BACKGROUND_COLOUR);

  // Stage dimensions.
  var stageWidth = cellSide * gridCols;
  var stageHeight = cellSide * gridRows;

  // Create a renderer instance.
  var renderer = PIXI.autoDetectRenderer(stageWidth, stageHeight);

  // Add the renderer view element to the DOM
  document.body.appendChild(renderer.view);

  /**
   * Initialises a two dimensional array of specified dimensions.
   * 
   * @param {integer} cols
   *  The number of columns in the array.
   * @param {integer} rows
   *  The number of rows in the array.
   * 
   * @returns {Array}
   *  An array initialised with zeros.
   */
  function createArray(cols, rows) {
    var a = new Array();

    for (x = 0; x < cols; x++) {
      a[x] = new Array();
      for (y = 0; y < rows; y++) {
        a[x][y] = 0;
      }
    }
    return a;
  }

  /**
   * Defines a class used to create the grid on which the game is played.
   * 
   * @returns {gameGrid}
   */
  var gameGrid = function() {  
    // Initialise the grid.
    this.grid = createArray(gridCols, gridRows);
    this.oldShapeCoors = new Array();

    /**
     * Create a new shape on the grid.
     * 
     * @param {Array} shapeCoors
     *  The coordinates of the shape relative to its origin.
     */
    this.initialiseActiveShape = function (shapeCoors) {
      // Map the active shape on to the grid.
      for (i = 0; i < shapeCoors.length; i++) {
        this.grid[stageOrigin[0] + shapeCoors[i][0]][stageOrigin[1] + shapeCoors[i][1]] = 1;
      }
      // Save the old shape coordinates. They will change if the shape
      // rotates.
      this.oldShapeCoors = shapeCoors;
      // Reset the current origin of the shape to zero.
      this.oldActiveShapeOrigin = new Array(0, 0);
    }

    /**
     * Moves an active shape on the grid.
     * 
     * @param {Integer} x
     *  The new x origin of the shape.
     * @param {Integer} y
     *  The new y origin of the shape.
     * @param {Array} shapeCoors
     *  The new coordinates of the shape relative to the origin.
     */
    this.moveActiveShape = function (x, y, shapeCoors) {      
      // Wipe the old position of the active shape.
      for (i = 0; i < shapeCoors.length; i++) {
        oldX = stageOrigin[0] + this.oldActiveShapeOrigin[0] + this.oldShapeCoors[i][0]
        oldY = stageOrigin[1] + this.oldActiveShapeOrigin[1] + this.oldShapeCoors[i][1]
        this.grid[oldX][oldY] = EMPTY;
      }
      
      // We require two separate loops here. Otherwise the new positions get
      // overwritten if they are in the same place as old positions.
      
      // Map the active shape on to the grid in its new position.
      for (i = 0; i < shapeCoors.length; i++) {
        newX = stageOrigin[0] + x + shapeCoors[i][0];
        newY = stageOrigin[1] + y + shapeCoors[i][1];
        this.grid[newX][newY] = ACTIVE;
      }
      // Save the origin and coordinates of the shape for next time.
      this.oldActiveShapeOrigin = [x, y];
      this.oldShapeCoors = shapeCoors;
    }

    /**
     * Fossilises an active shape on the grid when it can no longer move.
     * 
     * @param {Integer} x
     *  The new x origin of the shape.
     * @param {Integer} y
     *  The new y origin of the shape.
     * @param {Array} shapeCoors
     *  The new coordinates of the shape relative to the origin.
     */
    this.fossiliseActiveShape = function (x, y, shapeCoors) {
      // Fossilise the shape by changing the values on its coordiates in the grid
      // to FOSSIL (2) rather than ACTIVE (1).
      for (i = 0; i < shapeCoors.length; i++) {
        this.grid[stageOrigin[0] + x + shapeCoors[i][0]][stageOrigin[1] + y + shapeCoors[i][1]] = FOSSIL;
      }
    }

    /**
     * Given the hyperthetical origin and coordinates of a shape, decides if the
     * shape is allowed to have that state.
     * 
     * @param {integer} x
     *  The x position of the shape origin. 
     * @param {integer} y
     *  The y position of the shape origin.
     * @param {Array} shapeCoors
     *  The current shape coordinates, relative to the origin.
     *  
     * @returns {Boolean}
     *  Whether or not the shape is allowed to exist in this position.
     */
    this.moveAllowed = function (x, y, shapeCoors) {
      // Loop through each cell in the shape.
      for (i = 0; i < shapeCoors.length; i++) {
        var requestedX = stageOrigin[0] + x + shapeCoors[i][0];
        var requestedY = stageOrigin[1] + y + shapeCoors[i][1];

        // Things that tell us immediately this move cannot be made.
        if (requestedX >= gridCols || requestedX < 0) {
          // The shape is off the right of the grid.
          return false;
        }
        if (requestedY >= gridRows || requestedY < 0) {
          // The shape is off the left of the grid.
          return false;
        }
        
        // Look at the grid to see if the coordinates are already taken up by
        // a fossilised shape.
        if (this.grid[requestedX][requestedY] === FOSSIL) {
          return false;
        }
      }
      return true;
    }
    
    this.debugShowGrid = function() {
      var row = '';
      var cols = '';
      for (y = 0; y < gridRows; y++) {
        for (x = 0; x < gridCols; x++) {
          console.log(this.grid[x, y]);
        }
      }
    };
    
    /**
     * Looks for lines in the grid that can be collapsed and removes them if
     * so.
     */
    this.collapse = function () {
      // Initialise an array to hold the rows that are discovered to be complete.
      var completeRows = new Array();
      
      // Search through the grid from the bottom up.
      for (y = this.grid[0].length - 1; y >= 0; y--) {
        // Assume the row is complete to begin with.
        var rowComplete = true;
        for (x = 0; x < this.grid.length; x++) {
          if (this.grid[x][y] !== FOSSIL) {
            // If any of the cells in the row are not fossils, mark the whole
            // row not complete and break out.
            rowComplete = false;
            break;
          }
        }
        if (rowComplete) {
          // Maintain an array that holds complete rows.
          completeRows.push(y);
        }
      }
      console.log(completeRows);
    };
  }

  /**
   * Defines a class used to create an active shape on the tetris game grid.
   * 
   * @returns {tetrino}
   */
  var tetrino = function() {
    // Here's the constructor of the object.
    // Choose which tetrino we will render from the tetrinoConfig.
    this.shape = Math.floor(Math.random() * (tetrinosConfig.length));
    this.shapeConfig = tetrinosConfig[this.shape];
    this.shapeRotation = Math.floor(Math.random() * (this.shapeConfig.length));
    this.shapeCoors = this.shapeConfig[this.shapeRotation];
    this.shapeColour = tetrinoColours[Math.floor(Math.random() * (tetrinoColours.length))];

    // The cell coordinates of the shape's position on the grid. It will start
    // from the origin of the stage.
    this.x = stageOrigin[0];
    this.y = stageOrigin[1];

    // Create a new graphics object
    this.graphics = new PIXI.Graphics();

    /**
     * Increments the rotation parameter or loops it back to zero if it is too 
     * large.
     * 
     * @param {integer} rotation
     *
     * @returns {integer}
     */
    this.incrementRotation = function(rotation) {
      rotation++;
      if (rotation >= this.shapeConfig.length) {
        rotation = 0;
      }
      return rotation;
    }

    /**
     * Rotates the shape to the next state defined in the shapeCoors array.
     */
    this.rotate = function() {
      this.shapeRotation = this.incrementRotation(this.shapeRotation);
      this.shapeCoors = this.shapeConfig[this.shapeRotation];
    };

    /**
     * Renders the shape on the stage.
     */
    this.render = function() {
      this.graphics.clear();
      // Loop through the coordinates of this shape and draw it.
      for (index = 0; index < this.shapeCoors.length; ++index) {
        var cellOrigin = [
          this.shapeCoors[index][0] * cellSide, 
          this.shapeCoors[index][1] * cellSide,
        ];

        this.graphics.beginFill(this.shapeColour);
        // Draw each cell in the shape using real pixel coordinates.
        this.graphics.drawRect(
          stageOrigin[0] + cellOrigin[0] + (this.x * cellSide), 
          stageOrigin[1] + cellOrigin[1] + (this.y * cellSide),
          cellSide, 
          cellSide
        );
      }

      this.graphics.endFill();
      
      stage.addChild(this.graphics);
      
      renderer.render(stage);
    };

    /**
     * Moves the shape down the stage at intervals, updating the grid each time.
     */
    this.fall = function (grid) {
      // Render the shape and update the grid.
      this.move();

      var t = this;
      setTimeout(function () {
        // Check that the shape can 'fall'.
        if (grid.moveAllowed(t.x, t.y + 1, t.shapeCoors)) {
          t.y += 1;
          t.fall(grid);
        }
        else {
          t.fix(grid);
        }
      }, timeOutInterval);
    }

    /**
     * Re-draws the shape at any position and updates the grid accordingly.
     */
    this.move = function () {
      // Render the shape so that it's visible.
      this.render();

      // Update the shape on the grid.
      grid.moveActiveShape(this.x, this.y, this.shapeCoors);
    }

    /**
     * Handles what happens when an active shape can no longer move down.
     */
    this.fix = function(grid) {
      // Fossilise the shape on the grid.
      grid.fossiliseActiveShape(this.x, this.y, this.shapeCoors);
      
      // Check to see if any lines can be removed from the stacked fossilised 
      // shapes.
      grid.collapse();
      
      // Drop a new piece.
      dropPiece();
    };
  };
  
  /**
   * Creates and initialises a new piece in the game.
   */
  function dropPiece() {
    // Create a new tetris piece.
    this.piece = new tetrino();

    // Add the new piece to the grid.
    grid.initialiseActiveShape(piece.shapeCoors);

    // Start its fall from the top of the stage.
    piece.fall(grid);
  }
  
  // Create the grid that will hold the pieces.
  var grid = new gameGrid();
  // Drop a new piece into to the game.
  dropPiece();

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
      case 40: // Down (accelerate).
        if (grid.moveAllowed(piece.x, piece.y + 1, piece.shapeCoors)) {
          piece.y += 1;
        }
        break;
      case 32: // Spacebar
        // Here we work out the hypethetical coors of the shape if it were to 
        // rotate. Then we pass them to the moveAllowed method to see if the
        // shape could move like that.
        shapeRotation = piece.incrementRotation(piece.shapeRotation);
        shapeCoors = piece.shapeConfig[shapeRotation];

        if (grid.moveAllowed(piece.x, piece.y, shapeCoors)) {
          piece.rotate();
        }
        break;
    }

    // Update the rendered shape and the game grid.
    piece.move();
    
  }, false);
}

// Start the game.
var g = new game();
