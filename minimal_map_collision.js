/**********************************************************************
 *
 * @copyright 2016 Sebastian Schmittner <sebastian@schmittner.pw>
 *
 *
 * @section DESCRIPTION
 *
 * Togehther with someting like
 *   <body>
 *   <script src="phaser.min.js"></script>
 *   <script src="minimal_map_collision.js"></script>
 * </body>
 * this is a minimal working example for tilemap collisions.
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

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update});

function preload() {
  // at least 200 x 100 containing two tiles
  game.load.image('tileset', 'img/tilemap.png');
  // 200 x 100 for right/left facing player img
  game.load.spritesheet("player", "img/p1.png",100,100);

}

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  // empty tilemape
  map = game.add.tilemap();

  // adjust dimensions to tileset image
  map.tileWidth = 100;
  map.tileHeight = 100;
  map.addTilesetImage('tileset');
  ground_layer = map.create('ground', 64, 64, 100, 100);
  ground_layer.resizeWorld();

  // fill with type 0 tiles
  map.fill(0, 0, 0, 64, 64, ground_layer);

  // put one tile of type 1 and enable collisions for this type of tile.
  map.putTile(1, 5, 5, ground_layer);
  map.setCollision(1, true, ground_layer);

  // minimal player + camera follow
  player = game.add.sprite(0,0,"player");
  game.physics.arcade.enable(player);
  cursors = game.input.keyboard.createCursorKeys();

  game.camera.follow(player);

}

function update() {

  // actual collisiosn detection
  collision = game.physics.arcade.collide(player, ground_layer);

  // check the last row for blocking info
  game.debug.bodyInfo(player, 32, 32);

  // minimal movement
  player.body.velocity.set(0);
  if(cursors.left.isDown){
    player.body.velocity.x = -300;
    player.frame = 1;
  }else if(cursors.right.isDown){
    player.body.velocity.x = 300;
    player.frame = 0;
  }else if(cursors.up.isDown){
    player.body.velocity.y = -300;
  }else if(cursors.down.isDown){
    player.body.velocity.y = 300;
  }

}
