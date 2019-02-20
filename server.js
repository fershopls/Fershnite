var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var master = require('./module_master/StackModuleMaster.js')
var Property = require('./module_master/Property.js')

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))






var _players = master.create('players', [
		new Property('X', 0, true),
		new Property('Y', 0, true),
		new Property('id', 0),
		new Property('socket', 0),
	])

var sync = function (module_id, value_id, id)
{
	var player = _players.get(value_id)
	player.socket.broadcast.emit('sync', module_id, value_id, id, player[id]);
	
	console.log(module_id, value_id, id, player[id])
}
_players.sync = sync





var PlayersController = {

	stack: [],

	newPlayer: function(socket)
	{
		var id = socket.id
		var player = _players.set(id, {
				id: id,
				socket: socket,
				X: Math.round(800 * Math.random()),
				Y: Math.round(300 * Math.random()),
			})
		var point = this.getPoint(player)

		console.log('[+][PLAYER]['+player.X+':'+player.Y+']', id)
		// Send ID to player
		socket.emit('id', id, point)
		socket.emit('players', this.getPlayersPoints())
		// Send player to other players
		socket.broadcast.emit('enemy', id, point);
		console.log('[PLAYER][LEN]', Object.keys(_players.get()).length)
		console.log('[PLAYER][KEY]', Object.keys(_players.get()))

		return player
	},

	getPoint: function (player)
	{
		return {X: player.X, Y: player.Y}
	},

	getPlayersPoints: function()
	{
		var player_list = {}
		var stack = _players.getValues().for(function(id, player){
			if (this.checkSocketConnection(player))
				player_list[id] = this.getPoint(player)
		}, this)
		return player_list
	},

	checkSocketConnection: function(player)
	{
		if (player.socket.connected)
			return true

		var x = _players.remove(player.id)
		console.log('[PLAYER][DELETE]', player.id, x)
		return false
	},

	move: function (id, point)
	{
		_players.set(id, {
			X: point.X,
			Y: point.Y
		})
	},

}







io.on('connection', (socket) => {
	var player = PlayersController.newPlayer(socket)
	
	socket.on('playerMove', (id, point) => {
		PlayersController.move(id, point)
	});
	
	socket.on('shootClick', (id, x, y, mouse_x, mouse_y, weapon_id) => {
		socket.broadcast.emit('shootDraw', id, x, y, mouse_x, mouse_y, weapon_id)
	});
});



var server = http.listen(3000, () => {
	console.log('server is running on port', server.address().port);
});