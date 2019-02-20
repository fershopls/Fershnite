var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var master = require('./module_master/StackModuleMaster.js')

var Property = require('./module_master/Property.js')
var ModelMaster = require('./module_master/ModelMaster.js');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))






var _players = master.create('players', [
		new Property('X', 0, true, true),
		new Property('Y', 0, true, true),
		new Property('id', 0),
		new Property('socket', 0),
	])

_players.getSocket = function(){
	return io
}




io.on('connection', (socket) => {
	var player = PlayersController.newPlayer(socket)
	
	socket.on('playerMove', (id, point) => {
		PlayersController.move(id, point)
	});
	
	socket.on('shootClick', (id, x, y, mouse_x, mouse_y, weapon_id) => {
		socket.broadcast.emit('shootDraw', id, x, y, mouse_x, mouse_y, weapon_id)
	});
	
	socket.on('sync', (data) => {
		var module = master.get(data.module_id)
		if (module)
		module.syncInput(data)
	});
});










var PlayersController = {

	stack: [],

	newPlayer: function(socket)
	{
		var id = socket.id
		// not sincronizing X Y 
		var player = _players.set(id, {
				id: id,
				socket: socket,
				X: Math.round(800 * Math.random()),
				Y: Math.round(300 * Math.random()),
			})
		var point = this.getPoint(player)
		socket.emit('id', id, point)

		console.log('[+][PLAYER]['+player.X+':'+player.Y+']', id)
		// Send ID to player
		// this.sendPlayersPointsTo(id)
		// console.log('[=][PLAYER]', id, 'Sending player points')
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
		var stack = _players.getData().for(function(id, player){
			if (this.checkSocketConnection(player))
				player_list[id] = this.getPoint(player)
		}, this)
		return player_list
	},

	sendPlayersPointsTo: function(id)
	{
		var list = this.getPlayersPoints()
		var model = ModelMaster.new('updateEveryPlayerPoint', {
			points: list
		})
		var socket = this.getPrivateSocket(id)
		//_players.syncOutput(model, socket)
	},

	getPrivateSocket: function (id)
	{
		_players.getSocketSafe().to(id)
	},

	checkSocketConnection: function(player)
	{
		if (player.socket.connected)
			return true

		var x = _players.remove(player.id)
		console.log('[-][PLAYER]', player.id, x)
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




var server = http.listen(3000, () => {
	console.log('server is running on port', server.address().port);
});