var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var master = require('./module_master/StackModuleMaster.js')

var ModelMaster = require('./module_master/ModelMaster.js');
var StackMaster = require('./module_master/StackMaster.js');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))





master.start(false, function(){
	return io
})

var _control = master.create('control', [
	master.field('click', {
		sync: true,
		default: false,
		onSetAttempt: function (socket, model)
		{
			WeaponController.shoot(socket.id, model)
			return false
		}
	}),
])

var _players = master.create('players', [
	master.field('id'),
	master.field('X', {
			default: 0,
			sync: true,
			broadcastable: true
		}),
	master.field('Y', {
			default: 0,
			sync: true,
			broadcastable: true
		}),
	master.field('width', {
			default:32
		}),
	master.field('height', {
			default:32
		}),
	master.field('socket', {
			default: 0
		})
])

var checkGrabbedBy = function(socket, model)
{
	ItemsController.grabAttempt.call(ItemsController, socket, model)
}

var _items = master.create('items', [
		master.field('id', {
				sync: true
			}),
		master.field('X', {
				default: 0,
				sync: true
			}),
		master.field('Y', {
				default: 0,
				sync: true
			}),
		master.field('grabbable', {
				default: false,
				sync: true
			}),
		master.field('grabbed_by', {
				sync: true,
				onSetAttempt: checkGrabbedBy,
			}),
		master.field('width', {
				default: 48
			}),
		master.field('height', {
				default: 32
			}),
	])

var _inventory = master.create('inventory', [
		master.field('id', {
				sync: true
			}),
		master.field('items', {
				default: {},
				sync: true
			}),
		// TODO change this current to weapon.currentId
		master.field('current', {
				default: null,
				sync: true
			}),
	])

var _weapon = master.create('weapon', [
		master.field('id', {
				sync: true
			}),
		master.field('current', {
				default: null,
				sync: true
			}),
		master.field('lastSwitchTime', {
				default: 0,
				sync: true
			}),
		master.field('lastWeapon', {
				default: null,
				sync: true
			}),
		master.field('lastTimeFired', {
				default: 0,
				sync: true
			}),
		master.field('lastTimeReloaded', {
				default: 0,
				sync: true
			}),
	])




io.on('connection', (socket) => {
	master.sendModulesTo(socket, master.stack)

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









function Weapon (settings) {
	this.settings = {};
    	
	this.init = function ()
	{
		var defaultSettings = {
			id: null,
			
			perdigons: 1,
			damage: 20,
			maxLostDamageRate: .75,
			lostDamageRoundBy: 1,

			length: 300,
			bloom: 40,
			bloomIncrementRate: 1,
			color: [0,0,0],
			
			ammoReloadTime: 1000,
			ammoLoaded: null,
			ammoCharger: 1,

			fireRate: 500,
			lifetime: null,
		}

		this.settings = Object.assign(defaultSettings, settings);
		
		this.settings.lifetime = (this.settings.lifetime)?this.settings.lifetime:this.settings.fireRate
		this.settings.ammoLoaded =  (this.settings.ammoLoaded)?this.settings.ammoLoaded:this.settings.ammoCharger
	}
	this.init();


	this.updateBloom = function(weapon, bloom)
	{
		var playerVelocityAverage = Math.abs(PlayerController.movement.x_speed)+Math.abs(PlayerController.movement.y_speed)
	  	var bloomIncrementRate = 1/PlayerController.movement.max_speed*playerVelocityAverage
	  	return bloom + bloom * bloomIncrementRate *weapon.get('bloomIncrementRate')
	}
	

	this.get = function(key) {
		var value = null;
        if (this.settings.hasOwnProperty(key))
			value = this.settings[key]
    	if (this.getter.hasOwnProperty(key))
    		return this.getter[key](this, value)
    	return value
    }
	
	this.set = function(key, value) {
    	if (this.setter.hasOwnProperty(key))
    		return this.setter[key](this, value)
        if (this.settings.hasOwnProperty(key))
			this.settings[key] = value
    	return value
    }

	this.setter = {}

    this.getter = {
    	// Lifetime equals to fireRate
    	lifetime: function(weapon, value)
    	{
    		return weapon.get('fireRate')
    	},
    	// Return bloom in RADIANS
    	bloom: function (weapon, bloom)
    	{
    		bloom = weapon.updateBloom(weapon, bloom)
    		return bloom * Math.PI / 180
    	},
    }

    this.getRGBColor = function()
    {
    	var c = this.get('color')
    	return 'rgb('+c[0]+','+c[1]+','+c[2]+')'
    }

    this.getRGBAColor = function(alpha)
    {
    	var c = this.get('color')
    	return 'rgba('+c[0]+','+c[1]+','+c[2]+','+alpha+')'
    }

}










var WeaponController = {
	minSwitchTime: 700,
	weapons: [],

	id: null,

	setId: function(socket_id){
		this.id = socket_id
		if (typeof _weapon.get(this.id, 'lastTimeFired') == 'undefined')
		{
			console.log('Creating', this.id, 'weapons')
			_weapon.create(this.id, {})
		}
		return this
	},

	data: function (key, value)
	{
		if (typeof value != 'undefined')
			_weapon.set(key, value)

		console.log(key, _weapon.get(this.id, key))
		return _weapon.get(this.id, key)
	},

	getAmmo: function(weapon_id)
	{
		var ammo = InventoryController.has('ammo', weapon_id)
		return ammo?ammo:0
	},

	isShootAllowed: function()
	{
		if (!this.getCurrentWeapon())
			return false

		allow_fire = Date.now() - this.data('lastTimeFired') >= this.getCurrentWeapon().get('fireRate')
		return allow_fire && this.isTimeToReloadAllowed()
	},

	isTimeToReloadAllowed: function ()
	{
		if (!this.getCurrentWeapon())
			return false

		return Date.now() - this.data('lastTimeReloaded') >= this.getCurrentWeapon().get('ammoReloadTime')
	},

	isReloadAllowed: function()
	{
		return this.isTimeToReloadAllowed() && this.getCurrentWeapon().get('ammoLoaded') < this.getCurrentWeapon().get('ammoCharger')
	},

	shoot: function(id, model)
	{
		// Todo make this values safe
		var clickPoint = model.value

		this.setId(id)

		if (this.isShootAllowed())
			console.log('SHOOT SHIT!')
		return ;

		if (!this.isShootAllowed())
			return false
		
		this.data('lastTimeFired', Date.now())
		
		var ammoLoaded = this.getCurrentWeapon().get('ammoLoaded')
		if (ammoLoaded > 0 || ammoLoaded == -1)
		{

			ShootController.create(id,
				DrawHandler.center(player).X, DrawHandler.center(player).Y,
				clickPoint.X, clickPoint.Y,
				WeaponController.getCurrentWeapon())
			if (ammoLoaded != -1)
				this.getCurrentWeapon().set('ammoLoaded', ammoLoaded -1 )
		} else {
			this.reload()
		}
	},

	reload: function()
	{
		if (!this.isReloadAllowed())
			return false

		this.data('lastTimeReloaded', Date.now())
		var id = this.getCurrentWeaponId()
		var weapon = this.getCurrentWeapon()

		var ammo = InventoryController.has('ammo', id)
		if (ammo)
		{
			var currentLoadedAmmo = weapon.get('ammoLoaded')
			var chargerMaxAmmo = weapon.get('ammoCharger')
			var missingAmmo = chargerMaxAmmo - currentLoadedAmmo
			
			var ammo_after_reload = ammo - missingAmmo
			
			if (ammo_after_reload > 0)
			{
				weapon.set('ammoLoaded', currentLoadedAmmo + missingAmmo)
				InventoryController.attach('ammo', id, -missingAmmo)
			} else {
				weapon.set('ammoLoaded', ammo)
				InventoryController.set('ammo', id, 0)
			}

			Core.sound.weapon.play()
		} else {
			Core.sound.fire.emptyGun.play();
		}
	},

	init: function()
	{
		this.weapons = this.loadWeapons()
	},

	getCurrentWeaponId: function ()
	{
		return _inventory.get(this.id, 'current')
	},

	getCurrentWeapon: function ()
	{
		var weapon = this.getWeapon(this.getCurrentWeaponId())
		
		if (weapon)
			return weapon
		else
			return false
	},

	getWeapon: function(id)
	{
		if (this.weapons.hasOwnProperty(id))
			return this.weapons[id]
		return false
	},

	setWeapon: function(id)
	{
		if (this.weapons.hasOwnProperty(id))
		{
			this.data('lastWeapon', this.getCurrentWeaponId())
			return this.data('current', id)
		}
		else
			return false
	},

	switchWeaponAllowed: function()
	{
		return Date.now() - this.data('lastSwitchTime') >= this.data('minSwitchTime')
			&& Object.keys(InventoryController.getStack('weapons')).length > 1
	},

	switchWeapon: function(next)
	{
		if (!this.switchWeaponAllowed())
			return false;
		this.data(lastSwitchTime, Date.now())
		
		var weapon = next? InventoryController.getNextStackItem('weapons', this.getCurrentWeaponId()) : InventoryController.getPrevStackItem('weapons', this.getCurrentWeaponId())
		this.setWeapon(weapon)

		Core.sound.weapon.play()
	},

	loadWeapons: function()
	{
		var weapons = {
			shotgun: {
				ammoCharger: 5,
				ammoReloadTime: 1500,
				perdigons: 8,
				damage: 9,
				fireRate: 975,
				bloom: 40,
				bloomIncrementRate: 0.5,
				length: 250,
				color: [0,0,255],
				maxLostDamageRate: 0.20,
				lostDamageRoundBy: 4,
			},
			hands: {
				ammoCharger: -1,
				perdigons: 1,
				damage: 10,
				fireRate: 700,
				bloom: 90,
				bloomIncrementRate: 0.5,
				length: 20,
				color: [255,125,125],
				maxLostDamageRate: 0,
			},
			rifle: {
				ammoCharger: 30,
				perdigons: 1,
				damage: 30,
				fireRate: 250,
				bloom: 5,
				bloomIncrementRate: 3,
				length: 400,
				color: [255,0,255],
				maxLostDamageRate: .50,
				lostDamageRoundBy: 6,
			},
			smg: {
				ammoCharger: 30,
				perdigons: 1,
				damage: 16,
				fireRate: 120,
				bloom: 10,
				length: 200,
				color: [255,0,0],
				maxLostDamageRate: .7,
				lostDamageRoundBy: 2,
			},
		};

		// Initialize Weapons
		var weaponObjects = {};
		for (index in weapons)
		{
			if (weapons.hasOwnProperty(index))
			{
				var id = 'weapon.' + index
				weaponObjects[id] = new Weapon(weapons[index])
				weaponObjects[id].id = id
			}
		}
		return weaponObjects;
	}
}
WeaponController.init()













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
			var socket = _players.get(player.id, 'socket')
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
		_inventory.set(player_id, {
			items: playerInventory.items,
		})
	},

	get: function (player_id)
	{
		if (!_inventory.get(player_id, 'items'))
		{
			_inventory.create(player_id, {})
		}
		return _inventory.get(player_id)
	},

	setCurrentWeapon: function (player_id, item_id)
	{
		_inventory.set(player_id, {
			current: item_id,
		})
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