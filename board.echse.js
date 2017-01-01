/**********************************************************************
 *
 * @file board.echse.js
 *
 * @copyright 2016 Sebastian Schmittner <sebastian@schmittner.pw>
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

// using utils.echse.js

"use strict";

var BOARD = BOARD || {};


(function(){

  //--------------------------------------------------
  // enums:
  //--------------------------------------------------

  BOARD.labyrinth_generator_mode =
    {
      SCATTER_LEVEL: 0,
      DIGGY_LEVEL:1
    };

  BOARD.blocking_type = {
    NON_BLOCKING: 0,
    GROUND_BLOCKING: 1,
    AIR_BLOCKING: 2
  };

  //--------------------------------------------------
  // private members:
  //--------------------------------------------------

  var d_width = 64;
  var d_height = 64;

  var field = [d_width * d_height];

  var player_start_position = {};
  var goal_position = {};


  BOARD.field = function(which)
  {
    which = which || {};
    var i = which.i;
    if(i == undefined)
      i = BOARD.to_index(which);

    return field[i];
  }

  BOARD.set_dimensions = function(p_width, p_height)
  {
    d_width = p_width || 64;
    d_height = p_height || 64;

    field = [d_width * d_height];

    console.log("Setting board size: " + d_width + " / " + d_height);
  };


  // to set width and height use set_dimensions to safe one array allocation
  Object.defineProperty(BOARD, "width",
                        {
                          get: function () { return d_width; },
                          set: function (p_width) { this.set_dimensions(p_width, this.height);}
                        });

  // to set width and height use set_dimensions to safe one array allocation
  Object.defineProperty(BOARD, "height",
                        {
                          get: function () { return d_height; },
                          set: function (p_height) { this.set_dimensions(this.width, p_height);}
                        });


  BOARD.to_index = function(options)
  {
    if(options == undefined) return 0;
    if(options.x == undefined) options.x = 0;
    if(options.y == undefined) options.y = 0;

    if(! this.within_board(options))
      throw "Out of board!";

    return options.y * d_width + options.x;
  };


  BOARD.within_board = function(options)
  {
    if(options == undefined) return false;
    if(options.x == undefined) options.x = 0;
    if(options.y == undefined) options.y = 0;

    if(options.x > d_width || options.y > d_height
                           || options.x < 0 || options.y < 0)
      return false;

    return true;
  };


  function rectangle(from_x, from_y, p_width, p_height, blocking)
  {
    if(from_x == undefined) from_x = 0;
    if(from_y == undefined) from_y = 0;
    if(p_width == undefined) p_width = d_width;
    if(p_height == undefined) p_height = d_height;

    for(var x = from_x; x < from_x + p_width; x++){
      for(var y = from_y; y < from_y + p_height; y++){
        var i = BOARD.to_index({x: x, y: y});
        field[i].blocking = blocking;
      }
    }
  };


  // most trivial level generator
  function montecarlo(){
    console.log("Using Monte Carlo generator");

    for(var x = 0; x < d_width; x++)
    {
      for(var y = 0; y < d_height; y++)
      {
        var i = BOARD.to_index({x:x,y:y});
        field[i] = {};
        if
          (
            // solid border
            x == 0 || y == 0 || x == d_width - 1 || y == d_height - 1
            // random obstacles
                                                 || Math.random() > 0.85
          )
        {
          field[i].blocking = blocking_type.AIR_BLOCKING;
        }
        else if (Math.random() > 0.9)
        {
          field[i].blocking = blocking_type.GROUND_BLOCKING;
        }
        else
        {
          field[i].blocking = blocking_type.NON_BLOCKING;
        }
      }
    }

    player_start_position.x = Math.floor(Math.random() * (d_width - 2)) + 1;
    player_start_position.y = Math.floor(Math.random() * (d_height - 2)) + 1;

    goal_position.x = Math.floor(Math.random() * (d_width - 3)) + 1;
    goal_position.y = Math.floor(Math.random() * (d_height - 3)) + 1;

    console.log("goal at", goal_position.x, goal_position.y);
  }


  // reasonable labyrinth generator
  function path_digger()
  {
      var PATH = 1;
      var EARTH = 2;
      var NEAR_PATH = 3;
      var WALL = 4;

      // start with sandbox
      for(var x = 0; x < d_width; x++)
      {
        for(var y = 0; y < d_height; y++)
        {
          var i = BOARD.to_index({x:x,y:y});
          field[i] = {};
          field[i].generating = EARTH;
        }
      }

      // outer walls
      for(var x = 0; x < d_width; x++)
      {
        field[BOARD.to_index({x:x, y:0})].generating = WALL;
        field[BOARD.to_index({x:x, y:d_height - 1})].generating = WALL;
      }
      for(var y = 0; y < d_height; y++)
      {
        field[BOARD.to_index({x:0, y:y})].generating = WALL;
        field[BOARD.to_index({x:d_width - 1, y:y})].generating = WALL;
      }

      // player starts on the left
      player_start_position.x = 0;
      player_start_position.y = Math.floor(Math.random() * (d_height - 2)) + 1;

      var current_field ={
        x: player_start_position.x,
        y: player_start_position.y
      };

      var generating = true;
      while(generating)
      {
        var i = BOARD.to_index({x:current_field.x, y:current_field.y});

        // grow path
        field[i].generating = PATH;

        // mark neighbours
        var next_field = [];
        var top = UTILS.vector_add(current_field, {x:0, y:-1});
        var bottom = UTILS.vector_add(current_field, {x:0, y:1});
        var left = UTILS.vector_add(current_field, {x:-1, y:0});
        var right = UTILS.vector_add(current_field, {x:1, y:0});

        var neighbours = [top, bottom, left, right];

        for (var neighbour of neighbours)
        {
          if(BOARD.within_board(neighbour))
          {
            if(field[BOARD.to_index(neighbour)].generating == EARTH)
            {
              next_field.push(neighbour);
              field[BOARD.to_index(neighbour)].generating = NEAR_PATH;
            }
            else if(field[BOARD.to_index(neighbour)].generating == NEAR_PATH)
              field[BOARD.to_index(neighbour)].generating = WALL;
          }
        }

        // determine next step (random walk)
        if(next_field.length > 0)
        {
          current_field = next_field[Math.floor(Math.random() * next_field.length)];
        }
        else
        {
          // dead end -> create crossing at random possition
          while(field[BOARD.to_index(current_field)].generating != NEAR_PATH)
          {
            current_field.x = Math.floor(Math.random() * (d_width - 2)) + 1;
            current_field.y = Math.floor(Math.random() * (d_height - 2)) + 1;
          }
        }

        if(current_field.x == d_width - 2)
        {
          // reached goal zone
          generating = false;

          goal_position.x = current_field.x;
          goal_position.y =  current_field.y;
        }

      }//wend digging path

      for(var x = 0; x < d_width; x++)
      {
        for(var y = 0; y < d_height; y++)
        {
          var i = BOARD.to_index({x:x,y:y});
          if(field[i].generating == PATH)
          {
            field[i].blocking = BOARD.blocking_type.NON_BLOCKING;
          }
          else
          {
            field[i].blocking = BOARD.blocking_type.GROUND_BLOCKING;
          }
        }
      }
  };


  // erases labyrinth, if existing, and generates a new one
  BOARD.generate_labyrinth = function(generator_mode)
  {
    console.log("Generating Labyrinth");

    if (generator_mode == undefined)
      generator_mode = BOARD.labyrinth_generator_mode.SCATTER_LEVEL;

    if(generator_mode == BOARD.labyrinth_generator_mode.SCATTER_LEVEL)
    {
      montecarlo();
    }
    else if(generator_mode == BOARD.labyrinth_generator_mode.DIGGY_LEVEL)
    {
      path_digger();
    }

    rectangle(player_start_position.x, player_start_position.y, 1, 1, BOARD.blocking_type.NON_BLOCKING);

    rectangle(goal_position.x, goal_position.y, 2, 2, BOARD.blocking_type.NON_BLOCKING);


//    console.log(board);
  };


  BOARD.get_start_position = function(){
    var re = {};
    re.player = {};
    re.player.x = player_start_position.x;
    re.player.y = player_start_position.y;
    re.goal = {};
    re.goal.x = goal_position.x;
    re.player.y = player_start_position.y;
    return re;
  }

})();
