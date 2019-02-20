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
		// Sign In on Client
		socket.emit('id', socket.id)
		
		// Sign In on Server
		var player = _players.set(socket.id, {
				id: socket.id,
				socket: socket
			})

		// Set Initial Position
		_players.set(player.id, {
				X: Math.round(800 * Math.random()),
				Y: Math.round(300 * Math.random()),
			})
		console.log('[+][PLAYER]['+player.X+':'+player.Y+']', player.id)
		
		// Send current online players
		this.sendPlayersPointsTo(socket)
		console.log('[=][PLAYER] Online players sended ->', player.id)
		
		console.log('[i][PLAYER][LEN]', Object.keys(_players.get()).length)
		console.log('[i][PLAYER][KEY]', Object.keys(_players.get()))

		return player
	},

	getPoint: function (player)
	{
		return {X: player.X, Y: player.Y}
	},

	sendPlayersPointsTo: function(socket)
	{
		_players.getData().for(function(id, player){
			if (this.checkSocketConnection(player))
			{
				var model = ModelMaster.new('updateDataIdProperties', {
					'module_id': 'players',
					'data_id': id,
					'data': this.getPoint(player),
				})
				_players.syncOutput(model, socket)
			}
		}, this)
	},

	checkAllPlayerSocketConnection: function ()
	{
		_players.getData().for(function(id, player){
			this.checkSocketConnection(player)
		}, this)
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

setInterval(function(){
	PlayersController.checkAllPlayerSocketConnection.call(PlayersController)
}, 1000)



var server = http.listen(3000, () => {
	console.log('server is running on port', server.address().port);
});