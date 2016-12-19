/**********************************************************************
 *
 * @file labyrinth.echse.js
 *
 * @version 1.0.0
 *
 * @copyright 2016 Sebastian Schmittner <sebastian@schmittner.pw>
 *
 *
 * @section DESCRIPTION
 *
 * This is a simple labyrinth game made with phaser (tutorial level
 * complexity).
 *
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

      // coin phaser game
      run_phaser: function(game, preload_function, create_function, update_function)
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

        game.phaser_game = new Phaser.Game(
          "100%",
          "100%",
          Phaser.AUTO,
          'phaser-game-frame',
          {
            preload: preload_function,
            create: create_function,
            update: update_function
          });

        return game;
      },

      phaser_preload: function(game){
        console.log("Phaser: Preloading graphics");

        game.phaser_game.load.spritesheet("player1", "img/p1.png",100,100);

        game.phaser_game.load.image("goal", "img/goal.png");


        game.phaser_game.load.image("mud", "img/mud.png");
        game.phaser_game.load.image("bush", "img/bush.png");
        game.phaser_game.load.image("stone", "img/stone.png");
      },

      phaser_create: function(game){
        console.log("Phaser: Create");

        game.phaser_game.physics.startSystem(Phaser.Physics.ARCADE);

        game.phaser_game.world.setBounds(0,0,game.board.width * LABYRINTH.FIELD_SIZE, game.board.height * LABYRINTH.FIELD_SIZE);

        LABYRINTH.make_phaser_groups(game);
        LABYRINTH.new_round(game);

        if(game.player == undefined)
          LABYRINTH.coin_player(game);

        game.player.phaser_sprite = game.phaser_game.add.sprite(0,0,game.player.graphix);

        var player_sprite = game.player.phaser_sprite;

        // make player slightly smaller to fir through ;)
        player_sprite.width = Math.floor(LABYRINTH.FIELD_SIZE * 0.95);
        player_sprite.height = Math.floor(LABYRINTH.FIELD_SIZE * 0.95);

        player_sprite.x = game.player.start_x * LABYRINTH.FIELD_SIZE;
        player_sprite.y = game.player.start_y * LABYRINTH.FIELD_SIZE;

        game.phaser_game.physics.arcade.enable(player_sprite);
        game.phaser_game.camera.follow(player_sprite);

        player_sprite.body.collideWorldBounds = true;

        player_sprite.body.bounce.x = 0.2;
        player_sprite.body.bounce.y = 0.2;


        game.goal.phaser_sprite = game.phaser_game.add.sprite(0,0,game.goal.graphix);
        game.goal.phaser_sprite.width = LABYRINTH.FIELD_SIZE * 2;
        game.goal.phaser_sprite.height = LABYRINTH.FIELD_SIZE * 2;

        game.goal.phaser_sprite.x = game.goal.x * LABYRINTH.FIELD_SIZE;
        game.goal.phaser_sprite.y = game.goal.y * LABYRINTH.FIELD_SIZE;

        game.cursors = game.phaser_game.input.keyboard.createCursorKeys();

        console.log("finished phaser_create.");
      },

      phaser_update: function(game){

        var next_field = {};
        next_field.x = Math.round(game.player.phaser_sprite.x / LABYRINTH.FIELD_SIZE) * LABYRINTH.FIELD_SIZE;
        next_field.y = Math.round(game.player.phaser_sprite.y / LABYRINTH.FIELD_SIZE) * LABYRINTH.FIELD_SIZE;


        var hit = game.phaser_game.physics.arcade.collide(game.player.phaser_sprite, game.blocking_group);


        var player_sprite = game.player.phaser_sprite;
        var body = player_sprite.body;

        // 'friction' ;)
        body.velocity.x = body.velocity.x * 0.8;
        body.velocity.y = body.velocity.y * 0.8;

        var active_pointer = game.phaser_game.input.activePointer;

        // left/right
        if
          (
            (
              game.cursors.left.isDown
            || (active_pointer.isDown && active_pointer.x < player_sprite.x + player_sprite.width / 2)
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
            || (active_pointer.isDown && active_pointer.x > player_sprite.x + player_sprite.width / 2)
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
          || (active_pointer.isDown && active_pointer.y < player_sprite.y +player_sprite.height/2)
        )
        {
          body.velocity.y += -1 * LABYRINTH.SPEED;
        }
        else if
          (
            game.cursors.down.isDown
          || (active_pointer.isDown && active_pointer.y > player_sprite.y +player_sprite.height/2)
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
                board.field[i].graphix = "bush";
              }
              else
              {
                board.field[i].blocking = LABYRINTH.NON_BLOCKING;
                board.field[i].graphix = "mud";
              }
            }
          }

          game.player.start_x = Math.floor(Math.random() * (board.width-2)) + 1;
          game.player.start_y = Math.floor(Math.random() * (board.height-2)) + 1;
          LABYRINTH.board_rectangle(game,game.player.start_x,game.player.start_y,1,1,LABYRINTH.NON_BLOCKING,"mud");

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
                board.field[i].graphix = "mud";
              }
              else
              {
                board.field[i].blocking = LABYRINTH.GROUND_BLOCKING;
                board.field[i].graphix = "bush";
              }
            }
          }
        }//switch generator mode
          
        LABYRINTH.board_rectangle(game,game.goal.x,game.goal.y,2,2,LABYRINTH.NON_BLOCKING,"mud");

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

      make_phaser_groups: function(game){
        console.log("Creating phaser groups");

        if(game == undefined || game.phaser_game == undefined) throw "Initialise phaser before making groups.";

        game.passable_group = game.phaser_game.add.group();
        game.passable_group.enableBody = true;

        game.blocking_group = game.phaser_game.add.group();
        game.blocking_group.enableBody = true;
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
        if(game.passable_group == undefined || game.blocking_group == undefined)
          LABYRINTH.make_phaser_groups(game);
        if(game.player == undefined)
          LABYRINTH.coin_player(game);

        LABYRINTH.generate_labyrinth(game, LABYRINTH.DIGGY_LEVEL);

        for(var x = 0; x < game.board.width; x++)
        {
          for(var y = 0; y < game.board.height; y++)
          {
            var field = game.board.field[ y*game.board.width + x];
            var x_coord = x * LABYRINTH.FIELD_SIZE;
            var y_coord = y * LABYRINTH.FIELD_SIZE;

            if(field.blocking < game.player.movement)
            {
              field.phaser_sprite = game.passable_group.create(x_coord, y_coord, field.graphix);
            }
            else
            {
              field.phaser_sprite = game.blocking_group.create(x_coord, y_coord, field.graphix);
              field.phaser_sprite.body.immovable = true;
            }
            field.phaser_sprite.width = LABYRINTH.FIELD_SIZE;
            field.phaser_sprite.height = LABYRINTH.FIELD_SIZE;
          }
        }

        console.log("New round started.");

        return game;
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
          function(){LABYRINTH.phaser_update(game);}
        );

      }
    };


// run the game
LABYRINTH.run();
