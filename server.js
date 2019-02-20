var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))

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

		console.log('[PLAYER][DELETE]', this.id)
		PlayersController.deleteById(this.id)
		return false
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
		this.stack[id] = new Player({
			id: id,
			socket: socket,
			X: Math.round(Math.random() * 800),
			Y: Math.round(Math.random() * 300),
		})
		// Send ID to player
		socket.emit('id', id, this.get(id).getPoint())
		socket.emit('players', this.getPlayersPoints())
		console.log('[PLAYERS][SEND] ALL', Object.keys(this.getStack()).length)
		console.log('[PLAYERS][SEND] KEY', Object.keys(this.getStack()))
		// Send player to other players
		socket.broadcast.emit('enemy', id, this.get(id).getPoint());
		return this.stack[id]
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

setInterval(function(){
	PlayersController.getPlayersPoints.call(PlayersController)
}, 1000)

io.on('connection', (socket) => {
	var player = PlayersController.newPlayer(socket)
	console.log('[PLAYERS][NEW]', player.id)
	
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



var StackMaster = {
	stack: [],
	current_dimension: null,
	name: 'none',

	dimension: function(id, callback)
	{
		if (typeof id == 'undefined')
		{
			this.current_dimension = null
		}
		else if (typeof callback == 'undefined')
		{
			this.current_dimension = id
		}
		else
		{
			callback.call(this, this.name)
			this.dimension()
		}
	},

	getDimension: function()
	{
		if (!this.current_dimension)
			return this.stack
		
		if (!this.stack.hasOwnProperty(this.current_dimension))
			this.stack[this.current_dimension] = {}

		return this.stack[this.current_dimension]
	},

	get: function(id, dimension)
	{
		if (typeof id == 'undefined')
			return this.getDimension()
		
		if (typeof dimension == 'undefined')
		{
			if (this.getDimension().hasOwnProperty(id))
				return this.getDimension()[id]
		} else {
			this.dimension(dimension)
			var value = this.get(id)
			this.dimension()
			return value
		}
		return null
	},

	has: function(id)
	{
		return this.get().hasOwnProperty(id)
	},

	removeById: function (id)
	{
		if (this.has(id))
			delete this.get()[id]
	},

	removeByIndex: function (id)
	{
		if (this.has(id))
			this.get().splice(id, 1)
	},

	push: function(item)
	{
		this.get().push(item)
	},

	add: function(id, item)
	{
		this.get()[id] = item
	},

	set: function(id, value)
	{
		console.log('STACK SET',id,value)
		this.get()[id] = value
	},

	addMany: function(items)
	{
		for (id in items)
		{
			var item = items[id]
			this.set(id, item)
		}
	},

	for: function(callback)
	{
		var items = this.get()
		this.loop(items, callback)
	},

	loop: function(items, callback, context)
	{
		context = context?context:callback
		for (id in items)
		{
			if (!items.hasOwnProperty(id))
				continue

			callback.call(context, id, items[id], items)
		}
	}
}

/*
player.stack.get()
player.stack.removeById()
*/
// Controladores
//	-> acceso y edición a modulo
// Stack
//	-> 
// Modulos
//	-> propiedades
//	-> propiedades sincronizables
//		-> detectar cambios
//		-> un sentido / ambos sentidos
//			-> allow_server_update / allow_client_update

def = (function(v, d) { return typeof v=='undefined'?d:v })
function Property (id, default_value, allow_sync, allow_sync_client_update)
{

	this.id = id
	this.default_value = def(default_value, null)
	this.allow_sync = def(allow_sync, true)
	this.allow_sync_client_update = def(allow_sync_client_update, false)
}

var ModuleMaster = {
	properties: {},
	values: [],

	init: function(propertiesList){
		this.values = Object.create(StackMaster)
		this.values.name = 'Module Master Values Stack'

		StackMaster.loop(propertiesList, function(i, property){
			this.registerProperty(property)
		}, this)
		return this
	},

	registerProperty: function(property)
	{
		if (property.hasOwnProperty('id')
			&& property instanceof Property)
			this.properties[property.id] = property
	},

	getProperty: function(id)
	{
		if (!id)
			return this.properties
		if (this.properties.hasOwnProperty(id))
			return this.properties[id]
		return null
	},

	getKeysWithValues: function()
	{
		var keys = this.getProperty()
		var dic = {}

		StackMaster.loop(keys, function(id, property){
			dic[id] = this.get(id, property.default_value)
		}, this)
		
		return dic
	},

	hasProperty: function(id)
	{
		return this.properties.indexOf(id) != -1
	},

	get: function(value_id, id, default_value)
	{
		if (typeof value_id == 'undefined')
		{
			return this.values.get()
		}
		
		if (this.values.has(value_id))
		{
			if (typeof id == 'undefined')
			{
				return this.values.get(value_id)
			} else {
				return def(this.values.get(id, value_id), def(default_value, null))
			}
		}
		return null
	},

	setSingleProperty: function (value_id, key, value)
	{
		var property = this.getProperty(key)
		if (property)
		{
			this.values.dimension(value_id, function (){
				this.set(key, value)
			})
			if (property.allow_sync)
				this.syncProperty(property.id)
		}
	},

	set: function(value_id, dicKeyValue)
	{
		console.log('MODULE attempt to set', 'hello')
		this.values.dimension(value_id, function(a){
			this.set('hello', 1)
		})
	},

	syncProperty: function (id)
	{
		console.log('property',id,'change',this.get(id))
	},
}

var StackModuleMaster = Object.create(StackMaster)
StackModuleMaster = Object.assign(StackModuleMaster, {
	name: 'Stack Module Master',

	create: function(id, properties) {
		this.add(id, this.initModule(properties))
	},

	initModule: function (properties)
	{
		var module = Object.assign({}, ModuleMaster)
		return module.init(properties)
	}
})

StackModuleMaster.create('players_module', [
		new Property('X', 0),
		new Property('Y', 0),
		new Property('Z', 0),
	])
var players = StackModuleMaster.get('players_module')

/*
StackModuleMaster [stack]
	-> PlayersModule [module]
		-> values_ids [stack]
			-> properties
*/

players.set('X0001', {
	X: 998,
	Y: 666,
	Z: 0,
})

console.log('MODULES:', Object.keys(StackModuleMaster.get()))