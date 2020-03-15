// http://jsfiddle.net/fabricjs/S9sLu/

let canvas;

const grid = 30;
const BANANAGRAMS_LETTER_DISTRIBUTION = {
  2: ["J", "K", "Q", "X", "Z"],
  3: ["B", "C", "F", "H", "M", "P", "V", "W", "Y"],
  4: ["G"],
  5: ["L"],
  6: ["D", "S", "U"],
  8: ["N"],
  9: ["T", "R"],
  11: ["O"],
  12: ["I"],
  13: ["A"],
  18: ["E"]
};

const NUM_PLAYERS = 3;
const TILES_IN_GAME = 144;  // this should correspond to BANANAGRAMS_LETTER_DISTRIBUTION
let TILES_REMAINING = TILES_IN_GAME;

let PEEL_BUTTON, DUMP_BUTTON, BANANA_BUTTON;

// These are all fabric.Group objects, not plaintext letters.
let TILESET = [];


let PLAYER_TILES_ON_BOARD = [];
let PLAYER_TILES_IN_HAND = [];

/// Helpers
///////////////////////////////////////////////////////////////////////////////

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const Direction = {
  LEFT: 0,
  UP: 1,
  RIGHT: 2,
  DOWN: 3
};
const STEP = grid;

/// MOVING SHIT VIA WASD!!!!!!
// I stole this guy's implementation because it is good
// https://jsfiddle.net/milanhlinak/4fofjzvm/
// thanks kind sir
function handleKeyboardMotion() {

  fabric.util.addListener(document.body, 'keydown', function(options) {
    if (options.repeat) {
      return;
    }
    var key = options.which || options.keyCode; // key detection
    if (key === 37) { // handle Left key
      moveSelected(Direction.LEFT);
    } else if (key === 38) { // handle Up key
      moveSelected(Direction.UP);
    } else if (key === 39) { // handle Right key
      moveSelected(Direction.RIGHT);
    } else if (key === 40) { // handle Down key
      moveSelected(Direction.DOWN);
    }
  });

}

function moveSelected(direction) {

  var activeObject = canvas.getActiveObject();

  if (activeObject) {
    switch (direction) {
      case Direction.LEFT:
        activeObject.left = (activeObject.left - STEP);
        break;
      case Direction.UP:
        activeObject.top = (activeObject.top - STEP);
        break;
      case Direction.RIGHT:
        activeObject.left = (activeObject.left + STEP);
        break;
      case Direction.DOWN:
        activeObject.top = (activeObject.top + STEP);
        break;
    }
    activeObject.setCoords();
    canvas.renderAll();
    // console.log('selected objects was moved');
  } else {
    console.log('no object selected');
  }

}





// Functions
///////////////////////////////////////////////////////////////////////////////


function drawTile(shouldUpdateCanvas = true) {
  // Pops a tile and adds it to your hand

  const tile = TILESET.pop();
  PLAYER_TILES_IN_HAND.push(tile);

  renderNewTile(tile);

  // if (shouldUpdateCanvas) {
  //   updateCanvas();
  // }

}

function getLetterFromTile(tile) {
  return tile.item(1).text;
}

function generateSet() {
  // yeah I knowww it's not a set ok!
  let letterSet = [];

  // returns the set of tiles
  for (const key in BANANAGRAMS_LETTER_DISTRIBUTION) {
    const letterArray = BANANAGRAMS_LETTER_DISTRIBUTION[key];
    for (const letter of letterArray) {
      for (let i = 0; i < key; i++) { letterSet.push(letter); }
    }
  }

  let _tileSet = [];
  for (let letter of letterSet) { _tileSet.push( createTile(letter) ) };

  TILESET = _tileSet;

  shuffleArray(TILESET);

  // Truncate for testing
  TILESET = TILESET.splice(0, 10);

  console.log("TILESET: ", TILESET);
}

function generateHand() {
  // Initially assume 15-tile hand.
  // Might change for testing.

  const NUM_TILES_INITIAL_HAND = 5;
  for (let i = 0; i < NUM_TILES_INITIAL_HAND; i++) { drawTile(false) };
  updateCanvas();

}

function getTileBg() {
  return new fabric.Rect({ 
      width: grid, 
      height: grid, 
      fill: '#fff1cc', 
      originX: 'center', 
      originY: 'center',
      stroke: "#333",
      strokeWidth: 1,
    });
}

function createTile(letter) {
    const tileBg = getTileBg();
    const text = new fabric.Text(letter, {
      fontSize: 20,
      originX: 'center',
      originY: 'center'
    });

    // Positioning is done in addLetter
    return new fabric.Group([ tileBg, text ], {
      top: 0,
      left: 0,

      hasBorders: false,
      hasControls: false,
      hasRotatingPoint: false

    });
}

function updateCanvas(isInitialUpdate = false) {
  // This needs to be forked on PLAYER_TILES_IN_HAND and PLAYER_TILES_ON_BOARD

  renderBoardTiles();
  renderHandTiles(isInitialUpdate);
  renderCount();

}

function maybeRenderButtons() {
  renderPeel();
  renderDump();
  renderBananas();
}

function renderBoardTiles() {
  for (let letter of PLAYER_TILES_ON_BOARD) {
    canvas.add(letter); 
  } 

}

function allTilesOnBoard() {
  const player_tiles = [...new Set([...PLAYER_TILES_IN_HAND, ...PLAYER_TILES_ON_BOARD])]; 
  const X_THRESHOLD = 600;

  for (const tile of player_tiles) {
    if (tile.get('left') > 600) {
      return false;
    }
  }

  return true;

}

function canPeel() {
  // Checks to see if all tiles are left of x=600.

  return allTilesOnBoard() && TILES_IN_GAME > NUM_PLAYERS;
}

function canDump() {
  return !canBananas();
}

function canBananas() {
  return allTilesOnBoard() && TILES_IN_GAME <= NUM_PLAYERS;
}

function initializeButtons() {

  let rect;
  let text;

  // Peel button
  rect = new fabric.Rect({ 
      width: 5.5*grid, 
      height: grid, 
      fill: '#afa', 
      originX: 'center', 
      originY: 'center',
      centeredRotation: true
    });
  text = new fabric.Text("peel", {
      fontSize: 18,
      originX: 'center',
      originY: 'center'
    });

  PEEL_BUTTON = new fabric.Group([ rect, text ], {
      top: 600 - 2*grid,
      left: 600 + grid,
      selectable: false,
    });

  PEEL_BUTTON.on('mousedown', function(options) {
    drawTile();
  });


  // Dump button
  rect = new fabric.Rect({ 
      width: 2*grid, 
      height: grid, 
      fill: '#faa', 
      originX: 'center', 
      originY: 'center',
      centeredRotation: true
    });
  text = new fabric.Text("dump", {
      fontSize: 18,
      originX: 'center',
      originY: 'center'
    });

  DUMP_BUTTON = new fabric.Group([ rect, text ], {
      top: 600 - 2*grid,
      left: 600 + 7*grid,
      selectable: false,
    });

  DUMP_BUTTON.on('mousedown', function(options) {
    dumpTiles();
  });


  // banana button
  rect = new fabric.Rect({ 
      width: 8*grid, 
      height: grid, 
      fill: '#ffa', 
      originX: 'center', 
      originY: 'center',
      centeredRotation: true
    });
  text = new fabric.Text("bananas!!!!!!", {
      fontSize: 18,
      originX: 'center',
      originY: 'center'
    });

  BANANA_BUTTON = new fabric.Group([ rect, text ], {
      top: 600 - 3.5*grid,
      left: 600 + grid,
      selectable: false,
    });

  BANANA_BUTTON.on('mousedown', function(options) {
    callBananas();
  });

}

function renderPeel() {
  debugger;
  if (!canPeel() && canvas.getObjects().indexOf(PEEL_BUTTON) != -1) {
    canvas.remove(PEEL_BUTTON);
  }
  else if (canPeel() && canvas.getObjects().indexOf(PEEL_BUTTON) == -1) {
    canvas.add(PEEL_BUTTON);
  }
}

function renderDump() {
  if (!canDump() && canvas.getObjects().indexOf(DUMP_BUTTON) != -1) {
    canvas.remove(DUMP_BUTTON);
  }
  else if (canDump() && canvas.getObjects().indexOf(DUMP_BUTTON) == -1) {
    canvas.add(DUMP_BUTTON);
  }

}


function renderBananas() {
  if (!canBananas() && canvas.getObjects().indexOf(BANANA_BUTTON) != -1) {
    canvas.remove(BANANA_BUTTON);
  }
  else if (canBananas() && canvas.getObjects().indexOf(BANANA_BUTTON) == -1) {
    canvas.add(BANANA_BUTTON);
  }
}



// Checks to make sure there is not a letter in this location.
function noLetterAtLocation(tileCoords) {
  const { top, left } = tileCoords;
  const player_tiles = [...new Set([...PLAYER_TILES_IN_HAND, ...PLAYER_TILES_ON_BOARD])]; 

  for (const tile of player_tiles) {
    if (tile.get('top') == top && tile.get('left') == left) {
      return false;
    }
  }

  return true;
}

function renderCount() {
  // Render a count here maybe
}

function renderNewTile(tile) {
    // Specifically look for a new place to put newTile
    let i = 0;
    let foundLocation = false;
    while (!foundLocation) {
      const tileCoords = {
        top: 120 + grid + (parseInt(i/8))*grid,
        left: 600 + grid + (i%8)*grid,
      };
      if (noLetterAtLocation(tileCoords)) {
          tile.set(tileCoords);  
          canvas.add(tile); 
          foundLocation = true;
      } else {
        i++;
      }
    }

    renderCount();
}

function renderHandTiles(isInitialUpdate = false) {

  for (let i in PLAYER_TILES_IN_HAND) {
    i = parseInt(i);
    const tile = PLAYER_TILES_IN_HAND[i];

    // If it's the first time, lay them out appropriately.
    if (isInitialUpdate) {
      const tileCoords = {
        top: 0 + grid + (parseInt(i/8))*grid,
        left: 600 + grid + (i%8)*grid,
      }
      tile.set(tileCoords);
    }

    canvas.add(tile); 
  } 
}

function initializeCanvas() { 
  canvas = new fabric.Canvas('c', { selection: false });

  // create grid

  for (var i = 0; i < (600 / grid); i++) {
    canvas.add(new fabric.Line([ i * grid, 0, i * grid, 600], { stroke: '#ccc', selectable: false }));
    canvas.add(new fabric.Line([ 0, i * grid, 600, i * grid], { stroke: '#ccc', selectable: false }))
  }

// Initialize 

  // add objects

  canvas.add(new fabric.Rect({
    left: 600,
    top: 0,
    width: 300,
    height: 600,
    fill: "#333",
    originX: "left",
    originY: "top",
    selectable: false 
  }));


  // init steps
  generateSet();
  generateHand();
  initializeButtons();
  maybeRenderButtons();
  updateCanvas(true);

  // canvas.add(new fabric.Circle({ 
  //   left: 300, 
  //   top: 300, 
  //   radius: 50, 
  //   fill: '#9f9', 
  //   originX: 'left', 
  //   originY: 'top',
  //   centeredRotation: true
  // }));

  // snap to grid
  canvas.on('object:moving', function(options) { 
    options.target.set({
      left: Math.round(options.target.left / grid) * grid,
      top: Math.round(options.target.top / grid) * grid
    });

    maybeRenderButtons();

  });

}


function main() {
  initializeCanvas();
  handleKeyboardMotion();
}

// wait n seconds
setTimeout(() => { main() }, 100);