/**********************************************************************
 *
 * @file term.echse.js
 *
 * @copyright 2016-2017 Sebastian Schmittner <sebastian@schmittner.pw>
 *
 * @section DESCRIPTION
 *
 * This is a simple terminal-overlay for phaser games.
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

var TERM = TERM || {};


(function()
 {

  //==================================================
  // private:
  //==================================================

   // internal buffers
   var history = [];
   var command_line = "";
   var cursor_pos = 0;

   // phaser
   var game;
   var text_box;

   // style
   var style = {
     font: "15px Arial",
     fill: "#ffdd00",
     backgroundColor: "rgba(0,0,0,0.7)",
     align: "left",
     boundsAlignH: "left", 
     boundsAlignV: "bottom"
   };

   var d_border = 20;

   function render_text()
   {
     if(text_box == undefined)
       return;

     var text = "";

     for(var line of history)
     {
       text += line + "\n";
     }
     
     text += "\n>" + command_line.substring(0, cursor_pos) + "|" + command_line.substring(cursor_pos);

     text_box.text = text;
   }

  //==================================================
  // public:
  //==================================================

  Object.defineProperty(TERM, "border",
                        {
                          get: function () { return d_border; },
                          set: function (p_border) {
                            d_border = p_border;
                            if(game != undefined)
                              this.show(game); //trigger reset
                          }
                        });

  Object.defineProperty(TERM, "enabled",
                        {
                          get: function () { return text_box != undefined; },
                          set: function (p_enebale) {
                            if(p_enebale)
                              this.show();
                            else
                              this.hide();
                          }
                        });


   TERM.show = function(p_game)
   {
//     console.log ("term show");
     if(p_game != undefined)
     {
       game = p_game;
       if(text_box != undefined)
         text_box.kill();
       text_box = undefined;
     }
     if(game == undefined)
       throw "A phaser game reference has to be given at least once!"

     if(text_box == undefined)
     {
//       console.log("generating terminal textbox");
       text_box = game.add.text(0, 0, '',style);
       text_box.fixedToCamera = true;
       text_box.setTextBounds(d_border, d_border, game.width - 2 * d_border, game.height - 2 * d_border);
       game.world.bringToTop(text_box);
       
     }
     
     render_text();
   };


   TERM.hide = function()
   {
     if (text_box != undefined)
       text_box.kill();
     text_box = undefined;
   };


   // insert strg at cursor position (typically a single character)
   // and advance cursor
   TERM.input = function(strg)
   {
     if(strg == undefined)
       return;

     command_line = command_line.substring(0, cursor_pos) + strg + command_line.substring(cursor_pos);
     cursor_pos += strg.length;
     render_text();
   }


   // move cursor left (negative)/right (positive)
   TERM.move_cursor = function(by)
   {
     cursor_pos += by;
     if (cursor_pos < 0)
       cursor_pos = 0;
     if(cursor_pos > command_line.length )
       cursor_pos = command_line.length;

     render_text();
   }


   // delete characters to the left (negative) or right (positive)
   TERM.del = function(amount)
   {
     if(cursor_pos + amount < 0)
       amount = - cursor_pos;
     if(cursor_pos + amount > command_line.length)
       amount = command_line.length - cursor_pos;

     command_line = command_line.substring(0, Math.min(cursor_pos, cursor_pos + amount) ) + command_line.substring(Math.max(cursor_pos, cursor_pos + amount));

     if (amount < 0)
       this.move_cursor(amount);

     render_text();
   }


   // commit command line (to history), i.e.
   // return the current content and clear
   TERM.commit = function()
   {
//     console.log("term commit");
     history.push(">" + command_line);
     var re = command_line;
     command_line = "";
     cursor_pos = 0;
     render_text();
     return re;
   }


   //just push to history
   TERM.log = function(msg)
   {
     history.push(msg)
     render_text();;
   }

 })();

