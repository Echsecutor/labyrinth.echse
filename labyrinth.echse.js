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
      RANDOM_LEVEL: 0,

      // constants
      FIELD_SIZE: 100,
      SPEED: 150,



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

        game.phaser_game.load.image("player1", "img/p1.png");

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
        game.player.phaser_sprite.width = LABYRINTH.FIELD_SIZE;
        game.player.phaser_sprite.height = LABYRINTH.FIELD_SIZE;

        game.player.phaser_sprite.x = game.player.start_x * LABYRINTH.FIELD_SIZE;
        game.player.phaser_sprite.y = game.player.start_y * LABYRINTH.FIELD_SIZE;

        game.phaser_game.physics.arcade.enable(game.player.phaser_sprite);
        game.phaser_game.camera.follow(game.player.phaser_sprite);

        game.cursors = game.phaser_game.input.keyboard.createCursorKeys();

        console.log("finished phaser_create.");
      },

      phaser_update: function(game){

        var body = game.player.phaser_sprite.body;
        body.velocity.x *= 0.8;
        body.velocity.y *= 0.8;

        if (game.cursors.left.isDown)
        {
          body.velocity.x += -1 * LABYRINTH.SPEED;
        }
        else if (game.cursors.right.isDown)
        {
          body.velocity.x += LABYRINTH.SPEED;
        }

        if (game.cursors.up.isDown)
        {
          body.velocity.y += -1 * LABYRINTH.SPEED;
        }
        else if (game.cursors.down.isDown)
        {
          body.velocity.y += LABYRINTH.SPEED;
        }


        var hit = game.phaser_game.physics.arcade.collide(game.player.phaser_sprite, game.blocking_group);

      },

      // coin game board and generate labyrinth
      coin_board: function(game, width, height)
      {
        console.log("Generating board");

        if(game == undefined) game = {};
        if(width == undefined) width = 64;
        if(height == undefined) height = 64;

        if(game.board == undefined) game.board = {};

        game.board.width = width;
        game.board.height = height;
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
        return game;
      },


      // erases labyrinth, if existing, and generates a new one
      generate_labyrinth: function(game, generator_mode)
      {
        console.log("Generating Labyrinth");

        var board = game.board;
        if(board == undefined) board = {};
        if(board.width == undefined) board.width = 64;
        if(board.height == undefined) board.height = 64;
        if(board.field == undefined) board.field = [];

        if (generator_mode == undefined) generator_mode = LABYRINTH.RANDOM_LEVEL;

        var player_placed =false;

        if(generator_mode == LABYRINTH.RANDOM_LEVEL)
        {
          for(var i = 0; i < board.width * board.height; i++){
            board.field[i] = {};
            if(Math.random() > 0.8)
            {
              board.field[i].blocking = LABYRINTH.GROUND_BLOCKING;
              board.field[i].graphix = "stone";
            }
            else
            {
              board.field[i].blocking = LABYRINTH.NON_BLOCKING;
              board.field[i].graphix = "mud";
              if(!player_placed && Math.random() > 0.9)
              {
                game.player.start_y = Math.floor(i/board.width);
                game.player.start_x = i - game.player.start_y * board.width;
                player_placed = true;
              }
            }
          }
        }

        console.log(board);
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

        LABYRINTH.generate_labyrinth(game);

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
