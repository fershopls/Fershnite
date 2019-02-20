var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var master = require('./module_master/StackModuleMaster.js')

var Property = require('./module_master/Property.js')
var ModelMaster = require('./module_master/ModelMaster.js');
var StackMaster = require('./module_master/StackMaster.js');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))






var _players = master.create('players', [
		new Property('id', null),
		new Property('X', 0, true, true),
		new Property('Y', 0, true, true),
		new Property('width', 32),
		new Property('height', 32),
		new Property('socket', 0)
	])

var checkGrabbedBy = function(socket, model)
{
	ItemsController.grabAttempt.call(ItemsController, socket, model)
}

var _items = master.create('items', [
		new Property('id', null),
		new Property('X', 0, true),
		new Property('Y', 0, true),
		new Property('grabbable', false, true),
		new Property('grabbed_by', null, true, false, checkGrabbedBy),
		new Property('width', 48),
		new Property('height', 32),
	])

var _inventory = master.create('inventory', [
		new Property('id', null),
		new Property('items', {}, true),
		new Property('current', null, true),
	])

// todo fix this
_players.getSocket = _inventory.getSocket = _items.getSocket = function(){
	return io
}




io.on('connection', (socket) => {
	var player = PlayersController.newPlayer(socket)
	
	socket.on('sync', (data) => {
		var module = master.get(data.module_id)
		if (module)
		{
			module.syncInput(data, socket)
			module.requestGameUpdate()
		}

		GameUpdateController.update()
	});
});









var HitMathHelper = {

	collides: function (x, y, r, b, x2, y2, r2, b2) {
    	return !(r <= x2 || x > r2 || b <= y2 || y > b2);
	},

	boxCollides: function (point_a, point_b) {
    	return this.collides(point_a.X, point_a.Y,
            point_a.X + point_a.width, point_a.Y + point_a.height,
            point_b.X, point_b.Y,
            point_b.X + point_b.width, point_b.Y + point_b.height);
	},

}



var HitController = Object.assign({}, StackMaster, {
	stack: [],

	getStack: function()
	{
		return this.stack
	},

	getId: function (id1, id2)
	{
		return id1+'.'+id2
	}

})










var GameUpdateController = {
	update: function ()
	{
		_players.getData().for(function(id, player){
			this.updatePlayer(player)
		}, this)
		this.updateItems()
	},

	updatePlayer: function (player)
	{
		this.checkItemsWithPlayerHit(player)
	},

	checkItemsWithPlayerHit: function (player)
	{
		_items.getData().for(function(id, item) {
			var HIT_ID = HitController.getId(player.id, item.id)
			var socket = _players.get('socket', null, player.id)
			if (HitMathHelper.boxCollides(player, item))
			{
				HitController.set(HIT_ID, true)
				_items.set(item.id, {
					grabbable: true,
				}, true, socket)
			} else {
				HitController.set(HIT_ID, false)
				_items.set(item.id, {
					grabbable: false,
				}, true, socket)
			}
		}, this)
	},

	updateItems: function ()
	{

	},
}










var ItemsController = {
	new: function(id, point)
	{
		_items.create(id, {
			id: id,
			X: point.X,
			Y: point.Y,
		})
	},

	generate: function()
	{
		this.new('weapon.shotgun', {X: Math.random()*500, Y: 100})
		this.new('weapon.rifle', {X: Math.random()*500, Y: 200})
		this.new('weapon.smg', {X: Math.random()*500, Y: 300})
	},

	grabAttempt: function (socket, model)
	{
		var HIT_ID = HitController.getId(socket.id, model.data_id)
		if (HitController.get(HIT_ID))
		{
			console.log(socket.id,'grab', model.data_id)
			InventoryController.set(socket.id, model.data_id, 1)
			InventoryController.setCurrentWeapon(socket.id, model.data_id)
			_items.remove(model.data_id)
		}
		return false
	}
}

ItemsController.generate()
console.log('Items Generated', Object.keys(_items.get()))




var InventoryController = {
	
	set: function (player_id, item_id, qty)
	{
		playerInventory = this.get(player_id)
		playerInventory.items[item_id] = qty
		_inventory.set(player_id, playerInventory)
	},

	get: function (player_id)
	{
		if (!_inventory.get(player_id, false))
			_inventory.create(player_id, {})
		return _inventory.get(player_id)
	},

	setCurrentWeapon: function (player_id, item_id)
	{
		playerInventory = this.get(player_id)
		playerInventory.current = item_id
		_inventory.set(player_id, playerInventory)
	},

	getNextStackItem: function(stack_id, item_id)
	{
		var keys = Object.keys(this.getStack(stack_id));
		var index = keys.indexOf(item_id)

		next = index +1
		if (typeof keys[next] == 'undefined')
			next = 0

		return keys[next]
	},
	
	getPrevStackItem: function(stack_id, item_id)
	{
		var keys = Object.keys(this.getStack(stack_id));
		var index = keys.indexOf(item_id)

		next = index -1
		if (typeof keys[next] == 'undefined')
			next = keys.length -1

		return keys[next]
	},


}











var PlayersController = {

	newPlayer: function(socket)
	{
		// Sign In on Client
		socket.emit('id', socket.id)
		
		// Sign In on Server
		var player = _players.create(socket.id, {
				id: socket.id,
				socket: socket
			})
		// TODO integrate to create
		// Set Initial Position
		_players.set(socket.id, {
				X: Math.round(800 * Math.random()),
				Y: Math.round(300 * Math.random()),
			})

		console.log('[+][PLAYER]['+player.X+':'+player.Y+']', player.id)
		
		// Send current online players
		_players.syncBulkDataToSocket(player.socket, function (data){
			return {X: data.X, Y: data.Y}
		})
		_items.syncBulkDataToSocket(player.socket)
		console.log('[=][PLAYER] Online players sended ->', player.id)
		
		console.log('[i][PLAYER][LEN]', Object.keys(_players.get()).length)
		console.log('[i][PLAYER][KEY]', Object.keys(_players.get()))

		return player
	},

	getPoint: function (player)
	{
		return {X: player.X, Y: player.Y}
	},

	getPlayerSocket: function (player_id)
	{
		// return _players.get(player_id).socket
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