/**********************************************************************
 *
 * @file labyrinth.echse.js
 *
 * @copyright 2016 Sebastian Schmittner <sebastian@schmittner.pw>
 * 
 * @section DESCRIPTION
 *
 * This is a simple labyrinth game made with phaser (prototype quality).
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

// main namespace
var LABYRINTH =
    {

      // for debugging
      show_fps: false,

      // ground type enum
      NON_BLOCKING: 0,
      GROUND_BLOCKING: 1,
      AIR_BLOCKING: 2,

      // player movement enum
      WALKING: 1,
      FLYING: 2,

      // labyrinth generator enum
      SCATTER_LEVEL: 0,
      DIGGY_LEVEL:1,

      // constants
      FIELD_SIZE: 100,
      SPEED: 150,

      // image consts
      MUD: 1,
      BUSH: 0,
      STONE: 2,

      // a + b
      vector_add: function(a,b)
      {
        if(a == undefined)
          return b;
        if (b == undefined)
          return a;

        var re = {x:0,y:0};
        if(a.x != undefined)
          re.x += a.x;
        if(a.y != undefined)
          re.y += a.y;

        if(b.x != undefined)
          re.x += b.x;
        if(b.y != undefined)
          re.y += b.y;

        return re;
      },

      // some document size gymnastics -.-
      doc_size: function(){
        var body = document.body,
            html = document.documentElement;

        // using: http://stackoverflow.com/questions/1145850/how-to-get-height-of-entire-document-with-javascript#1147768
        // by http://stackoverflow.com/users/27388/borgar
        var re = {};
        re.height = Math.max( body.scrollHeight, body.offsetHeight, 
                                        html.clientHeight, html.scrollHeight,
                                        html.offsetHeight );
        // using http://stackoverflow.com/questions/5484578/how-to-get-document-height-and-width-without-using-jquery#5484623
        // by http://stackoverflow.com/users/322222/dan
        // adapted to above style
        re.width = Math.max(html.clientWidth, body.scrollWidth,
                                      body.scrollWidth, body.offsetWidth,
                                      html.offsetWidth);
        return re;
      },

      // coin phaser game
      run_phaser: function(game, preload_function, create_function, update_function, render_function)
      {
        console.log("Creating phaser game");

        if(game == undefined)
        {
          console.log("WARN: game undefined");
          game={};
        }
        if(preload_function == undefined) preload_function = function(){};
        if(create_function == undefined) create_function = function(){};
        if(update_function == undefined) update_function = function(){};
        if(render_function == undefined) render_function = function(){};

        var phaser_size = LABYRINTH.doc_size();
        game.phaser_game = new Phaser.Game(
          phaser_size.width,
          phaser_size.height,
          Phaser.AUTO,
          'phaser-game-frame',
          {
            preload: preload_function,
            create: create_function,
            update: update_function,
            render: render_function
          });

        return game;
      },

      phaser_preload: function(game){
        console.log("Phaser: Preloading graphics");

        game.phaser_game.load.spritesheet("player1", "img/p1.png",100,100);

        game.phaser_game.load.image("goal", "img/goal.png");

        game.phaser_game.load.image('tileset', 'img/tilemap.png');

        if(LABYRINTH.show_fps)
          game.phaser_game.time.advancedTiming = true;
        
      },

      phaser_create: function(game){
        console.log("Phaser: Create");

        game.phaser_game.physics.startSystem(Phaser.Physics.ARCADE);

        if(game.player == undefined)
          LABYRINTH.coin_player(game);

        //  tilemap 
        game.board.map = game.phaser_game.add.tilemap();
        var map = game.board.map;

        // tileset
        // http://phaser.io/docs/2.6.2/Phaser.Tilemap.html#addTilesetImage
        map.tileWidth = LABYRINTH.FIELD_SIZE;
        map.tileHeight = LABYRINTH.FIELD_SIZE;
        map.addTilesetImage('tileset');

        // ground layer:
        game.board.ground_layer = map.create('ground', game.board.width, game.board.height, LABYRINTH.FIELD_SIZE, LABYRINTH.FIELD_SIZE);
        game.board.ground_layer.resizeWorld();

        // player sprite
        game.player.phaser_sprite = game.phaser_game.add.sprite(0,0,game.player.graphix);

        // start new round (to get startign position and goal)
        LABYRINTH.new_round(game);

        // player
        var player_sprite = game.player.phaser_sprite;
        // slightly smaller to fit through ;)
        player_sprite.width = Math.floor(LABYRINTH.FIELD_SIZE * 0.9);
        player_sprite.height = Math.floor(LABYRINTH.FIELD_SIZE * 0.9);

        player_sprite.x = game.player.start_x * LABYRINTH.FIELD_SIZE;
        player_sprite.y = game.player.start_y * LABYRINTH.FIELD_SIZE;

        game.phaser_game.physics.arcade.enable(player_sprite);

        player_sprite.body.collideWorldBounds = true;

        player_sprite.body.bounce.x = 0.2;
        player_sprite.body.bounce.y = 0.2;

        game.phaser_game.camera.follow(player_sprite);

        // goal
        game.goal.phaser_sprite = game.phaser_game.add.sprite(0,0,game.goal.graphix);
        game.goal.phaser_sprite.width = LABYRINTH.FIELD_SIZE * 2;
        game.goal.phaser_sprite.height = LABYRINTH.FIELD_SIZE * 2;

        game.goal.phaser_sprite.x = game.goal.x * LABYRINTH.FIELD_SIZE;
        game.goal.phaser_sprite.y = game.goal.y * LABYRINTH.FIELD_SIZE;

        game.phaser_game.physics.arcade.enable(game.goal.phaser_sprite);
        game.goal.phaser_sprite.body.immovable=true;

        // cursors
        game.cursors = game.phaser_game.input.keyboard.createCursorKeys();

        console.log("finished phaser_create.");
      },

      phaser_render: function(game){

        if(!LABYRINTH.show_fps)
          return;

        var current_fps = game.phaser_game.time.fps;
        if(game.min_fps == undefined)
          game.min_fps = 1000;
        if(game.av_fps == undefined)
          game.av_fps = current_fps;

        if(current_fps > 0)
          game.min_fps = Math.min(current_fps, game.min_fps);
        
        var moving_frame_size = 10;
        game.av_fps = game.av_fps * (moving_frame_size -1)/moving_frame_size + current_fps / moving_frame_size;

        game.phaser_game.debug.text("FPS: current: " + current_fps + ", min: " + game.min_fps + ", average: " + Math.floor(game.av_fps), 16,16);   
},

      phaser_update: function(game){

        var next_field = {};
        next_field.x = Math.round(game.player.phaser_sprite.x / LABYRINTH.FIELD_SIZE) * LABYRINTH.FIELD_SIZE;
        next_field.y = Math.round(game.player.phaser_sprite.y / LABYRINTH.FIELD_SIZE) * LABYRINTH.FIELD_SIZE;

        var player_sprite = game.player.phaser_sprite;

        var map_collision = game.phaser_game.physics.arcade.collide(player_sprite, game.board.ground_layer);

        game.phaser_game.physics.arcade.collide(player_sprite, game.goal.phaser_sprite, function(){LABYRINTH.win(game);});

        var body = player_sprite.body;

        // 'friction' ;)
        body.velocity.x = body.velocity.x * 0.8;
        body.velocity.y = body.velocity.y * 0.8;

        var active_pointer = game.phaser_game.input.activePointer;


        //debugging:
        // game.phaser_game.debug.pointer(active_pointer);

        //game.phaser_game.debug.spriteBounds(player_sprite);

        // game.phaser_game.debug.cameraInfo(game.phaser_game.camera, 32, 32);
        // game.phaser_game.debug.body(player_sprite);
        // game.phaser_game.debug.bodyInfo(player_sprite, 32, 32);


        // movement:
        // left/right
        if
          (
            (
              game.cursors.left.isDown
            || (active_pointer.isDown && active_pointer.worldX < player_sprite.x + player_sprite.width / 2)
            ) && !body.blocked.left
          )
        {
          body.velocity.x += -1 * LABYRINTH.SPEED;
          player_sprite.frame = 1;
        }
        else if
          (
            (
              game.cursors.right.isDown
            || (active_pointer.isDown && active_pointer.worldX > player_sprite.x + player_sprite.width / 2)
            ) && !body.blocked.right
          )
        {
          body.velocity.x += LABYRINTH.SPEED;
          player_sprite.frame = 0;
        }
        else
        {
          // drift towards grid
          body.velocity.x += (next_field.x + (LABYRINTH.FIELD_SIZE - game.player.phaser_sprite.width) / 2 - game.player.phaser_sprite.x) * 0.2;
        }


        // up/down
        if
          (
            game.cursors.up.isDown
            || (active_pointer.isDown && active_pointer.worldY < player_sprite.y + player_sprite.height / 2)
        )
        {
          body.velocity.y += -1 * LABYRINTH.SPEED;
        }
        else if
          (
            game.cursors.down.isDown
          || (active_pointer.isDown && active_pointer.worldY > player_sprite.y + player_sprite.height / 2)
          )
        {
          body.velocity.y += LABYRINTH.SPEED;
        }
        else
        {
          body.velocity.y += (next_field.y +  (LABYRINTH.FIELD_SIZE - game.player.phaser_sprite.height) / 2 - game.player.phaser_sprite.y) * 0.2;
        }

        body.velocity.x = Math.floor(body.velocity.x);
        body.velocity.y = Math.floor(body.velocity.y);
      },


      coin_board: function(game, width, height)
      {
        console.log("Generating board");

        if(game == undefined) game = {};
        if(width == undefined) width = 64;
        if(height == undefined) height = 64;

        if(game.board == undefined) game.board = {};

        game.board.width = width;
        game.board.height = height;
        game.board.to_index = function(options)
        {
          if(options == undefined) return 0;
          if(options.x == undefined) options.x = 0;
          if(options.y == undefined) options.y = 0;

          if(options.x > game.board.width || options.y > game.board.height)
            throw "Out of board bounds!";

          return options.y * game.board.width + options.x;
        }

        game.board.within_board = function(options)
        {
          if(options == undefined) return false;
          if(options.x == undefined) options.x = 0;
          if(options.y == undefined) options.y = 0;

          if(options.x > game.board.width || options.y > game.board.height
                                          || options.x < 0 || options.y < 0)
            return false;

          return true;
        }

        game.board.field = [];

        console.log(game.board);
        return game;
      },

      coin_player: function(game)
      {
        console.log("Generating Player");

        if(game == undefined) game = {};
        if(game.player == undefined) game.player = {};

        game.player.movement = LABYRINTH.WALKING;
        game.player.graphix = "player1";

        console.log(game.player);

        if(game.goal == undefined) game.goal = {};
        game.goal.graphix = "goal";

        return game;
      },


      // erases labyrinth, if existing, and generates a new one
      generate_labyrinth: function(game, generator_mode)
      {
        console.log("Generating Labyrinth");

        if(game.board == undefined) LABYRINTH.coin_board(game);
        var board = game.board;

        if (generator_mode == undefined) generator_mode = LABYRINTH.SCATTER_LEVEL;

        if(generator_mode == LABYRINTH.SCATTER_LEVEL)
        {
          for(var x = 0; x < game.board.width; x++)
          {
            for(var y = 0; y < game.board.height; y++)
            {
              var i = game.board.to_index({x:x,y:y});
              board.field[i] = {};
              if
                (
                  x==0 || y==0 || x==game.board.width-1 || y == game.board.height-1
                                                        || Math.random() > 0.8
                )
              {
                board.field[i].blocking = LABYRINTH.GROUND_BLOCKING;
                board.field[i].graphix = LABYRINTH.BUSH;
              }
              else
              {
                board.field[i].blocking = LABYRINTH.NON_BLOCKING;
                board.field[i].graphix = LABYRINTH.MUD;
              }
            }
          }

          game.player.start_x = Math.floor(Math.random() * (board.width-2)) + 1;
          game.player.start_y = Math.floor(Math.random() * (board.height-2)) + 1;
          LABYRINTH.board_rectangle(game,game.player.start_x,game.player.start_y,1,1,LABYRINTH.NON_BLOCKING,LABYRINTH.MUD);

          game.goal.x = Math.floor(Math.random() * (board.width-3))+1;
          game.goal.y =  Math.floor(Math.random() * (board.height-3))+1;

          console.log("goal at", game.goal.x, game.goal.y);

        }
        else if(generator_mode == LABYRINTH.DIGGY_LEVEL)
        {
          var PATH = 1;
          var EARTH = 2;
          var NEAR_PATH = 3;
          var WALL = 4;

          // start with sandbox
          for(var x = 0; x < game.board.width; x++)
          {
            for(var y = 0; y < game.board.height; y++)
            {
              var i = game.board.to_index({x:x,y:y});
              board.field[i] = {};
              board.field[i].generating = EARTH;
            }
          }

          // outer walls
          for(var x = 0; x < game.board.width; x++)
          {
            board.field[game.board.to_index({x:x,y:0})].generating = WALL;
            board.field[game.board.to_index({x:x,y:board.height-1})].generating = WALL;
          }
          for(var y = 0; y < game.board.height; y++)
          {
            board.field[game.board.to_index({x:0,y:y})].generating = WALL;
            board.field[game.board.to_index({x:board.width -1,y:y})].generating = WALL;
          }


          // player starts on the left
          game.player.start_x = 0;
          game.player.start_y = Math.floor(Math.random() * (board.height-2)) + 1;
          var current_field ={
            x: game.player.start_x,
            y: game.player.start_y
          };

          var to_index = game.board.to_index;
          var within_board = game.board.within_board;

          var generating=true;
          while(generating)
          {
            var i = to_index({x:current_field.x,y:current_field.y});
            
            // grow path
            board.field[i].generating = PATH;

            // mark neighbours
            var next_field = [];
            var top = LABYRINTH.vector_add(current_field, {x:0,y:-1});
            var bottom = LABYRINTH.vector_add(current_field, {x:0,y:1});
            var left = LABYRINTH.vector_add(current_field, {x:-1,y:0});
            var right = LABYRINTH.vector_add(current_field, {x:1,y:0});

            var neighbours = [top,bottom,left,right];

            for (var neighbour of neighbours){
              if(within_board(neighbour)){
                if(board.field[to_index(neighbour)].generating == EARTH)
                {
                  next_field.push(neighbour);
                  board.field[to_index(neighbour)].generating = NEAR_PATH;
                }
                else if(board.field[to_index(neighbour)].generating == NEAR_PATH)
                  board.field[to_index(neighbour)].generating = WALL;
              }
            }

            // determine next step (random walk)
            if(next_field.length >0)
            {
              current_field = next_field[Math.floor(Math.random() * next_field.length)];
            }
            else
            {
              // dead end -> create crossing at random possition
              while(board.field[to_index(current_field)].generating != NEAR_PATH)
              {
                current_field.x = Math.floor(Math.random() * (board.width - 2)) + 1;
                current_field.y = Math.floor(Math.random() * (board.height - 2)) + 1;
              }
            }

            if(current_field.x == board.width - 2)
            {
              // reached goal zone
              generating = false;

              game.goal.x = current_field.x;
              game.goal.y =  current_field.y;
            }

          }//wend digging path

          for(var x = 0; x < game.board.width; x++)
          {
            for(var y = 0; y < game.board.height; y++)
            {
              var i = game.board.to_index({x:x,y:y});
              if(board.field[i].generating == PATH)
              {
                board.field[i].blocking = LABYRINTH.NON_BLOCKING;
                board.field[i].graphix = LABYRINTH.MUD;
              }
              else
              {
                board.field[i].blocking = LABYRINTH.GROUND_BLOCKING;
                board.field[i].graphix = LABYRINTH.BUSH;
              }
            }
          }
        }//switch generator mode
          
        LABYRINTH.board_rectangle(game,game.goal.x,game.goal.y,2,2,LABYRINTH.NON_BLOCKING,LABYRINTH.MUD);

        console.log(board);
        return game;
      },

      board_rectangle: function(game, from_x, from_y, width, height, blocking, graphix)
      {
        for(var x = from_x; x < from_x + width; x++){
          for(var y = from_y; y < from_y + height; y++){

            game.board.field[x + y * game.board.width].blocking = blocking;
            game.board.field[x + y * game.board.width].graphix = graphix;
          }
        }
        return game;
      },

      // start a new round by (re-)generating the initial
      // game state
      new_round: function(game){
        console.log("Starting new round");

        if(game == undefined || game.phaser_game == undefined)
          throw "Initialise phaser before starting a new round.";
        if(game.board == undefined)
          LABYRINTH.coin_board(game);
        if(game.player == undefined)
          LABYRINTH.coin_player(game);

        LABYRINTH.generate_labyrinth(game, LABYRINTH.DIGGY_LEVEL);

        game.board.map.fill(LABYRINTH.MUD, 0, 0, game.board.width, game.board.height, game.board.ground_layer);


        for(var x = 0; x < game.board.width; x++)
        {
          for(var y = 0; y < game.board.height; y++)
          {
            var field = game.board.field[ y*game.board.width + x];

            if(field.blocking == LABYRINTH.GROUND_BLOCKING)
            {
              game.board.map.putTile(LABYRINTH.BUSH, x, y, game.board.ground_layer);
            }
            else if (field.blocking == LABYRINTH.AIR_BLOCKING)
            {
              game.board.map.putTile(LABYRINTH.STONE, x, y, game.board.ground_layer);
            }
          }
        }

        game.board.map.setCollision(LABYRINTH.STONE, true, game.board.ground_layer);
        if(game.player.movement == LABYRINTH.WALKING)
        {
          console.log ("Bush collisions enabled");
          game.board.map.setCollision(LABYRINTH.BUSH, true, game.board.ground_layer);
        }

        // render player top most
        // TODO: reconsider once using air layer
        game.phaser_game.world.bringToTop(game.player.phaser_sprite);

        console.log("New round started.");

        return game;
      },

      win: function(game){
        console.log("win!");
        var msg = 'You made it!';
        var text = game.phaser_game.add.text(game.goal.phaser_sprite.x + game.goal.phaser_sprite.width / 2, game.goal.phaser_sprite.y + 32, msg,
                                             {
                                               
                                             });
        text.anchor.set(0.5);
        text.align = 'center';

        for(var i = 0; i < msg.length; i++)
        {
          text.addColor('rgba('+ Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ',1)', i);
        }
 
        text.setShadow(5, 5, 'rgba(0,0,0,0.5)', 10);
      },

      // main function, can be viewed as a
      // singleton game object
      run: function(){
        console.log("Running Labyrinth.echse");

        var game = {};

        LABYRINTH.coin_board(game);
        LABYRINTH.coin_player(game);

        LABYRINTH.run_phaser(
          game,
          function(){LABYRINTH.phaser_preload(game);},
          function(){LABYRINTH.phaser_create(game);},
          function(){LABYRINTH.phaser_update(game);},
          function(){LABYRINTH.phaser_render(game);}
        );

      }
    };


document.addEventListener("DOMContentLoaded", function(event) { 
  // run the game after the browser figuered winow sizes...

  LABYRINTH.run();
});
