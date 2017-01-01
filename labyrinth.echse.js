/**********************************************************************
 *
 * @file labyrinth.echse.js
 *
 * @copyright 2016 Sebastian Schmittner <sebastian@schmittner.pw>
 *
 * @section DESCRIPTION
 *
 * This is a simple labyrinth game made with phaser.
 *
 * @section LICENSE
 *
 * The is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public
 * License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this. If not, see <http://www.gnu.org/licenses/>.
 *
 ***********************************************************************/

"use strict";

// using utils.echse.js
// using board.echse.js

// main namespace
var LABYRINTH = LABYRINTH || {};

(function(){

  //==================================================
  // private:
  //==================================================

  //--------------------------------------------------
  // constants:
  //--------------------------------------------------

  // for debugging
  var show_fps = false;

  // tile side length in pixels
  var FIELD_SIZE= 100;
  // player speedup
  var SPEED = 150;

  //--------------------------------------------------
  // enums:
  //--------------------------------------------------

  var player_movement = {
    current: 1,
    WALKING: 1,
    FLYING: 2
  };

  var tileset = {
    filename: 'img/tilemap.png',
    BUSH: 0,
    MUD: 1,
    STONE: 2
  };

  var game_state = {
    current: 0,
    CHOOSING_LEVEL: 0,
    RUNNING: 1,
    WIN: 2
  };

  //--------------------------------------------------
  // private members:
  //--------------------------------------------------

  // phaser game object
  var game;

  // phaser tile map and layer
  var map;
  var ground_layer;

  // phaser sprites
  var player;
  var goal;

  // debugging
  var fps = {};

  function run_phaser()
  {
    console.log("Creating phaser game");

    // full "screen"
    var phaser_size = UTILS.doc_size();
    game = new Phaser.Game(
      phaser_size.width,
      phaser_size.height,
      Phaser.AUTO,
      'phaser-game-frame',
      {
        preload: preload,
        create: create,
        update: update,
        render: render
      });
  };


  function preload(){
    console.log("Phaser: Preloading graphics");

    // player graphix
    game.load.spritesheet("rainbow", "img/rainbow.png",100,100);
    game.load.spritesheet("flutter", "img/flutter.png",100,100);

    // goal
    game.load.image("celestia", "img/celestia.png");

    // map tileset
    game.load.image('tileset', tileset.filename);

    // for debugging
    if(show_fps)
      game.time.advancedTiming = true;
  };


  // minimal init.
  // further init happens in show_menu / start_new_round as appropriate.
  function create(){
    console.log("Phaser: Create");

    game.physics.startSystem(Phaser.Physics.ARCADE);

    // tilemap
    map = game.add.tilemap();
    map.tileWidth = FIELD_SIZE;
    map.tileHeight = FIELD_SIZE;
    map.addTilesetImage('tileset');

    game_state.current = game_state.CHOOSING_LEVEL;

    show_menu();

    console.log("finished phaser_create.");
  };



  function show_menu(){
    // todo

    // for now: skip
    game_state.current = game_state.RUNNING;
    start_new_round();

  }



  function start_new_round(game_mode){

    game_mode = game_mode || {};
    game_mode.generator_mode = game_mode.generator_mode || BOARD.labyrinth_generator_mode.DIGGY_LEVEL;
    game_mode.player_graphix = game_mode.player_graphix || "rainbow";
    game_mode.goal_graphix = game_mode.goal_graphix || "celestia";

    BOARD.generate_labyrinth(game_mode.generator_mode);

    var start_postitions = BOARD.get_start_position();

    // ground layer:
    ground_layer = ground_layer || map.create('ground', BOARD.width, BOARD.height, FIELD_SIZE, FIELD_SIZE);
    ground_layer.resizeWorld();


    // generate player:
    // player sprite
    if(player != undefined)
      player.kill();

    player = game.add.sprite(start_postitions.player.x * FIELD_SIZE, start_postitions.player.y * FIELD_SIZE, game_mode.player_graphix);

    // slightly smaller to fit through ;)
    player.width = Math.floor(FIELD_SIZE * 0.9);
    player.height = Math.floor(FIELD_SIZE * 0.9);

    game.physics.arcade.enable(player);

    player.body.collideWorldBounds = true;

    player.body.bounce.x = 0.2;
    player.body.bounce.y = 0.2;

    game.camera.follow(player, Phaser.Camera.FOLLOW_TOPDOWN);
    game.camera.lerp.set(0.5);
    game.renderer.renderSession.roundPixels = true;

    // goal
    if(goal != undefined)
      goal.kill();

    goal = game.add.sprite(start_postitions.goal.x * FIELD_SIZE, start_postitions.goal.y * FIELD_SIZE, game_mode.goal_graphix);

    goal.width = FIELD_SIZE * 2;
    goal.height = FIELD_SIZE * 2;

    game.physics.arcade.enable(goal);
    goal.body.immovable=true;


    board_to_tilemap();

    console.log("New round started.");

  };


  function board_to_tilemap()
  {
    map.fill(tileset.MUD, 0, 0, BOARD.width, BOARD.height, "ground");
    
    for(var x = 0; x < BOARD.width; x++)
    {
      for(var y = 0; y < BOARD.height; y++)
      {
        var field = BOARD.field({y:y, x: x});
        if(field.blocking == BOARD.blocking_type.GROUND_BLOCKING)
        {
          map.putTile(tileset.BUSH, x, y, "ground");
        }
        else if (field.blocking == BOARD.blocking_type.AIR_BLOCKING)
        {
          map.putTile(tileset.STONE, x, y, "ground");
        }
      }
    }

    map.setCollision(tileset.STONE, true, "ground");
    if(player_movement.current == player_movement.WALKING)
    {
      console.log ("Bush collisions enabled");
      map.setCollision(tileset.BUSH, true, "ground");
    }
    
    // render goal/player
    // TODO: reconsider once using air layer
    if(player != undefined)
      game.world.bringToTop(player);
    if(goal != undefined)
      game.world.bringToTop(goal);

  };


  // only used for debugging
  function render(){

    if(!show_fps)
      return;

    var current_fps = game.time.fps;
    if(fps.min == undefined)
      fps.min = 1000;
    if(fps.av == undefined)
      fps.av = current_fps;

    if(current_fps > 0)
      fps.min = Math.min(current_fps, fps.min);

    var moving_frame_size = 10;
    fps.av = fps.av * (moving_frame_size -1)/moving_frame_size + current_fps / moving_frame_size;

    game.debug.text("FPS: current: " + current_fps + ", min: " + fps.min + ", average: " + Math.floor(fps.av), 16,16);
  };


  // switch game_state and call corresponding update function
  function update(){
    if(game_state.current == game_state.RUNNING)
      running_update();
    else if (game_state.current == game_state.CHOOSING_LEVEL)
      menu_update();
    else if (game_state.current == game_state.WIN)
      win_update();
    else
      throw "bad game state";
  };


  // display some debugging infos
  function debugging_text()
  {
    //debugging:
    // game.phaser_game.debug.pointer(active_pointer);

    //game.phaser_game.debug.spriteBounds(player_sprite);

    // game.phaser_game.debug.cameraInfo(game.phaser_game.camera, 32, 32);
    // game.phaser_game.debug.body(player_sprite);
    // game.phaser_game.debug.bodyInfo(player_sprite, 32, 32);

  }


  function menu_update()
  {
    //todo
  }


  function win_update()
  {
    //todo
    player.body.velocity.set(0);
  }


  // actual game controls
  function running_update()
  {
    // collisions:
    var map_collision = game.physics.arcade.collide(player, ground_layer);
    // transition to win state
    game.physics.arcade.collide(player, goal,
                                 function(){win();});

    // next field drag
    var nearest_field = {};
    nearest_field.x = Math.round(player.x / FIELD_SIZE) * FIELD_SIZE;
    nearest_field.y = Math.round(player.y / FIELD_SIZE) * FIELD_SIZE;

    var body = player.body;

    // input
    var cursors = game.input.keyboard.createCursorKeys();
    var active_pointer = game.input.activePointer;

    // 'friction' ;)
    body.velocity.x = body.velocity.x * 0.8;
    body.velocity.y = body.velocity.y * 0.8;

    debugging_text();

    // movement:
    // left/right
    if
      (
        (
          cursors.left.isDown
        || (active_pointer.isDown && active_pointer.worldX < player.x + player.width / 2)
        ) && !body.blocked.left
      )
    {
      body.velocity.x += -1 * SPEED;
      player.frame = 1;
    }
    else if
      (
        (
          cursors.right.isDown
        || (active_pointer.isDown && active_pointer.worldX > player.x + player.width / 2)
        ) && !body.blocked.right
      )
    {
      body.velocity.x += SPEED;
      player.frame = 0;
    }
    else
    {
      // drift towards grid
      body.velocity.x += (nearest_field.x + (FIELD_SIZE - player.width) / 2 - player.x) * 0.2;
    }


    // up/down
    if
      (
        cursors.up.isDown
      || (active_pointer.isDown && active_pointer.worldY < player.y + player.height / 2)
      )
    {
      body.velocity.y += -1 * SPEED;
    }
    else if
      (
        cursors.down.isDown
      || (active_pointer.isDown && active_pointer.worldY > player.y + player.height / 2)
      )
    {
      body.velocity.y += SPEED;
    }
    else
    {
      body.velocity.y += (nearest_field.y +  (FIELD_SIZE - player.height) / 2 - player.y) * 0.2;
    }

    // floor
    body.velocity.x = Math.floor(body.velocity.x);
    body.velocity.y = Math.floor(body.velocity.y);

  };


  function random_color_text(phaser_text)
  {
    for(var i = 0; i < phaser_text.text.length; i++)
    {
      phaser_text.addColor('rgba('+ Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ',1)', i);
    }
  }

  function win(){
    console.log("win!");
    var msg = 'You made it!';
    var text = game.add.text(goal.x + goal.width / 2, goal.y, msg);
    text.anchor.set(0.5);
    text.align = 'center';
    random_color_text(text);
    text.setShadow(5, 5, 'rgba(0,0,0,0.5)', 10);
    game.camera.focusOn(text);
    
    game_state.current = game_state.WIN;

  };

  // main
  LABYRINTH.run = function(){
    console.log("Running Labyrinth.echse");
    game_state.current = game_state.CHOOSING_LEVEL;

    run_phaser();
  }

})();




document.addEventListener("DOMContentLoaded", function(event) {
  // run the game after the browser figuered winow sizes...  
  LABYRINTH.run();
});
