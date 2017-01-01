/**********************************************************************
 *
 * @file utility.echse.js
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

"use strict";

var UTILS = UTILS || {};

// a + b
UTILS.vector_add = function(a,b)
{
  if(a == undefined)
    return b;
  if (b == undefined)
    return a;

  var re = {x:0,y:0,z:0};
  if(a.x != undefined)
    re.x += a.x;
  if(a.y != undefined)
    re.y += a.y;
  if(a.z != undefined)
    re.z += a.z;

  if(b.x != undefined)
    re.x += b.x;
  if(b.y != undefined)
    re.y += b.y;
  if(b.z != undefined)
    re.z += b.z;

  return re;
};


// some document size gymnastics -.-
UTILS.doc_size= function(){
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
};
