var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// var mongoose = require('mongoose');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))

// var Message = mongoose.model('Message',{
//   name : String,
//   message : String
// })

// var dbUrl = 'mongodb://amkurian:amkurian1@ds257981.mlab.com:57981/simple-chat'

function Player (settings)
{
	this.settings = {};
    	
	this.init = function ()
	{
		var defaultSettings = {
			id: null,
			socket: null,
			X: 0,
			Y: 0,
		}

		this.settings = Object.assign(defaultSettings, settings);

		for (id in this.settings)
		{
			if (!this.settings.hasOwnProperty(id))
				continue;

			this[id] = this.settings[id]
		}
	}
	this.init();

	this.io = function ()
	{
		return this.socket
	}

	this.checkSocketConnection = function ()
	{
		if (this.io().connected)
			return true

		this.dead
	}

  	this.getPoint = function ()
  	{
		return {X:this.X, Y:this.Y}
  	}

  	this.move = function (point)
  	{
  		this.X = point.X
  		this.Y = point.Y
  		if (this.checkSocketConnection())
  			this.io().broadcast.emit('enemy', this.id, this.getPoint());
  	}
}

var PlayersController = {

	stack: [],

	newPlayer: function(socket)
	{
		var id = socket.id
		this.stack[id] = new Player({id: id, socket: socket})
		// Send ID to player
		socket.emit('id', id)
		socket.emit('players', this.getPlayersPoints())
		console.log('[PLAYERS][SEND] ALL',Object.keys(this.getStack()).length)
		// Send player to other players
		socket.broadcast.emit('enemy', id, this.get(id).getPoint());
		return id
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
			delete this.stack[id]
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

io.on('connection', (socket) => {
	var id = PlayersController.newPlayer(socket)
	console.log('[PLAYERS][NEW]', id)
	
	socket.on('playerMove', (id, point) => {
		if (PlayersController.get(id))
			PlayersController.get(id).move(point)
	});
});


// mongoose.connect(dbUrl ,{useMongoClient : true} ,(err) => {
//   console.log('mongodb connected',err);
// })

var server = http.listen(3000, () => {
  console.log('server is running on port', server.address().port);
});