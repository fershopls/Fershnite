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
		new Property('id', null),
		new Property('X', 0, true, true),
		new Property('Y', 0, true, true),
		new Property('width', 32),
		new Property('height', 32),
		new Property('socket', 0),
	])

var _items = master.create('items', [
		new Property('id', 0),
		new Property('X', 0, true),
		new Property('Y', 0, true),
		new Property('width', 48),
		new Property('height', 32),
	])

// todo fix this
_players.getSocket = _items.getSocket = function(){
	return io
}




io.on('connection', (socket) => {
	var player = PlayersController.newPlayer(socket)
	
	socket.on('sync', (data) => {
		var module = master.get(data.module_id)
		if (module)
		{
			module.syncInput(data)
			module.requestGameUpdate()
		}

		GameUpdateController.update()
	});
});









var HitController = {

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

var GameUpdateController = {
	update: function ()
	{
		_players.getData().for(function(id, player){
			this.updatePlayer(player)
		}, this)
	},

	updatePlayer: function (player)
	{
		this.checkItemsWithPlayerHit(player)
	},

	checkItemsWithPlayerHit: function (player)
	{
		_items.getData().for(function(id, item){
			if (HitController.boxCollides(player, item))
			{
				console.log('yes')
			}
		}, this)
	},

}










var ItemsController = {
	new: function(id, point)
	{
		_items.create(id, point)
	},

	generate: function()
	{
		this.new('weapon.shotgun', {X: Math.random()*500, Y: 100})
		this.new('weapon.rifle', {X: Math.random()*500, Y: 200})
		this.new('weapon.smg', {X: Math.random()*500, Y: 300})
	},
}

ItemsController.generate()
console.log('Items Generated', Object.keys(_items.get()))







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