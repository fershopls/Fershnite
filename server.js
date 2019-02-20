var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var oop = require('./OOP.js')

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))






var players = oop.StackModuleMaster.create('players', [
		new oop.Property('X', 0),
		new oop.Property('Y', 0),
		new oop.Property('id', 0),
		new oop.Property('socket', 0),
	])






var PlayersController = {

	stack: [],

	newPlayer: function(socket)
	{
		var id = socket.id
		players.set(id, {
				id: id,
				socket: socket,
				X: 800 * Math.random(),
				Y: 300 * Math.random(),
			})

		console.log('[PLAYERS][NEW]', players.get(id).id)
		// Send ID to player
		socket.emit('id', id, this.getPoint(players.get(id)))
		// socket.emit('players', this.getPlayersPoints())
		// console.log('[PLAYERS][SEND] ALL', Object.keys(this.getStack()).length)
		// console.log('[PLAYERS][SEND] KEY', Object.keys(this.getStack()))
		// Send player to other players
		//socket.broadcast.emit('enemy', id, this.get(id).getPoint());
		return players.get(id)
	},

	getPoint: function (player)
	{
		return {X: player.X, Y: player.Y}
	},

	getPlayersPoints: function()
	{
		var players = {}
		var stack = this.getStack()
		for (id in stack)
		{
			if (!stack.hasOwnProperty(id))
				continue
			
			// TODO delete unconnected players
			if (!stack[id].checkSocketConnection())
				continue

			players[id] = stack[id].getPoint()
		}
		return players
	},

	deleteById: function(id)
	{
		if (this.stack.hasOwnProperty(id))
		{
			delete this.stack[id]
			io.emit('playerLeft', id)
		}
	},

	get: function (id)
	{
		if (this.stack.hasOwnProperty(id))
			return this.stack[id]
		else return false
	},

	getStack: function()
	{
		return this.stack
	},

	generateRandomId: function()
	{
		return Math.ceil(Math.random() * (10000 - 1000)) + 1000
	}

}






var makeRandomId = function () {
	return Math.random()
}


io.on('connection', (socket) => {
	var player = PlayersController.newPlayer(socket)
	
	socket.on('playerMove', (id, point) => {
		if (PlayersController.get(id))
			PlayersController.get(id).move(point)
	});
	
	socket.on('shootClick', (id, x, y, mouse_x, mouse_y, weapon_id) => {
		socket.broadcast.emit('shootDraw', id, x, y, mouse_x, mouse_y, weapon_id)
	});
});



var server = http.listen(3000, () => {
	console.log('server is running on port', server.address().port);
});