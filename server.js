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
	master.field('reload', {
		sync: true,
		default: false,
		onSetAttempt: function (socket, model)
		{
			WeaponController.reload(socket.id)
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
		master.field('qty', {
				default: 30,
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

	

	getAngleFromTo: function (x, y, to_x, to_y)
	{
		// Determine angle
		var op = y - to_y
		var ad = x - to_x
		angle = Math.atan(op / ad)

		// Determine side of the shoot
		if (x > to_x)
			angle += Math.PI

		return angle // RADIANS
	},

	getToByAngle: function (x, y, len, angle)
	{
		return {X:x + len * Math.cos(angle), Y: y + len * Math.sin(angle)}
	},

	getAngleBetween: function (mouse_x, mouse_y, pivot_x, pivot_y)
	{
		pivot_x = pivot_x
		pivot_y = pivot_y
		return this.getAngleFromTo(pivot_x, pivot_y, mouse_x, mouse_y)
	},

	lineToAngleWithRelativeBloom: function(pivot, length, angle, abs_bloom, rel_bloom)
	{
		return this.getToByAngle(pivot.X, pivot.Y, length, angle + (abs_bloom/2 * rel_bloom))
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
    		// bloom = weapon.updateBloom(weapon, bloom)
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



















var ShootController = {
	stack: {},
	lifetime: 800,
	
	socketShootSend: function(shooter_id, x, y, mouse_x, mouse_y, weapon_id)
	{
		Socket.io.emit('shootClick', shooter_id, x, y, mouse_x, mouse_y, weapon_id)
	},
	
	socketShootDraw: function(shooter_id, x, y, mouse_x, mouse_y, weapon_id)
	{
		ShootController.create(shooter_id, x, y, mouse_x, mouse_y, WeaponController.getWeapon(weapon_id))
	},

	create: function(shooter_id, x, y, click_x, click_y, weapon)
	{	
		var root_angle = HitMathHelper.getAngleBetween(click_x, click_y, x, y);
		var perdigons = weapon.get('perdigons')
		var bloom = weapon.get('bloom')
		var length = weapon.get('length')

		var bullets = [];
		for (i = 1; i <= perdigons; i++)
		{
			var angle = root_angle
			angle -= bloom /2
			angle += bloom * Math.random()
			
			to = HitMathHelper.getToByAngle(x, y, length, angle)
			var bullet = this.createBullet(shooter_id, x, y, to.X, to.Y, weapon)
			bullets.push(bullet)
		}

		// HitController.checkBulletsHit(bullets)
	},

	createBullet: function (shooter_id, x, y, to_x, to_y, weapon)
	{
		shoot = {
			id: this.makeUniqueId(),
			shooter_id: shooter_id,
			from: {X:x, Y:y},
			to: {X:to_x, Y:to_y},
			time: Date.now(),
			alive: true,
			weapon: weapon,
		}

		this.stack[shoot.id] = shoot
		return shoot;
	},

	killBullets: function (bullets)
	{
		for (id in bullets)
		{
			if (!bullets.hasOwnProperty(id))
				continue

			this.killById(id)
		}
	},

	killById: function(id)
	{
		if (this.stack.hasOwnProperty(id))
		{
			this.stack[id].alive = false
		}
	},

	deleteById: function(id)
	{
		if (this.stack.hasOwnProperty(id))
		{
			delete this.stack[id]
		}
	},

	makeUniqueId: function()
	{
		return Date.now()+"_"+(Math.floor(Math.random()*10000)+10000)
	},

	update: function (dt)
	{
		for (var id in this.stack) {
			if (this.stack.hasOwnProperty(id)) {
	        	this.loopUpdate(id, this.stack[id], dt);
			}
		}
	},

	draw: function (ctx)
	{
		for (var id in this.stack) {
			if (this.stack.hasOwnProperty(id)) {
	     	   this.loopDraw(ctx, id, this.stack[id]);
			}
		}
	},

	loopUpdate: function (id, shoot, dt)
	{
		if(this.getBulletLifeTime() != 0 && shoot.time + this.getBulletLifeTime() < Date.now())
	    {
			this.deleteById(id)
	    }
	},

	getBulletLifeTime: function ()
	{
		// shoot.weapon.get('lifetime')
		return Core.debug?1000:50
	},

	loopDraw: function (ctx, id, shoot)
	{
		if (Core.debug)
			this.drawTrigometricThing(ctx, shoot);
		var weapon = shoot.weapon;
		alpha = 1 - (Date.now() - shoot.time) / this.getBulletLifeTime()
		alpha = 1

		DrawHandler.draw(0, 0, function(ctx){
			ctx.beginPath();
			var max = this.getBulletLifeTime()
			var min = Date.now() - shoot.time
			ctx.lineWidth = (1 / max * min) * 8
			ctx.strokeStyle = 'rgba(255, 235, 59, '+alpha+')'//weapon.getRGBAColor(alpha);
			ctx.moveTo(shoot.from.X, shoot.from.Y);
			ctx.lineTo(shoot.to.X, shoot.to.Y);
			ctx.stroke();
		}, this)

	},

	drawTrigometricThing: function (ctx, shoot)
	{
		DrawHandler.draw(0, 0, function(){
			this.beginPath();
			this.strokeStyle = '#ddd';
			this.moveTo(shoot.from.X, shoot.from.Y);
			this.lineTo(shoot.to.X, shoot.to.Y);
	
			this.moveTo(shoot.from.X, shoot.from.Y);
			this.lineTo(shoot.to.X, shoot.from.Y);
	
			this.moveTo(shoot.to.X, shoot.from.Y);
			this.lineTo(shoot.to.X, shoot.to.Y);
			this.stroke();
		})
	},
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
		if (typeof value == 'undefined')
			return _weapon.get(this.id, key)
		
		var keyValue = {}
		keyValue[key] = value
		return _weapon.set(this.id, keyValue)
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
		return this.isTimeToReloadAllowed() && this.getCurrentAmmoInCharger() < this.getCurrentWeapon().get('ammoCharger')
	},

	getPlayerCenter: function (player_id)
	{
		var player = _players.get(player_id)
		return {
			X: player.X + player.width/2,
			Y: player.Y + player.height/2,
		}
	},

	shoot: function(id, model)
	{
		// Todo make this values safe
		var clickPoint = model.value

		this.setId(id)

		if (!this.isShootAllowed())
			return false
		
			// The shoot starts
		this.data('lastTimeFired', Date.now())
		
		if (this.weaponHasAmmo())
		{
			var player_center = this.getPlayerCenter(id)
			ShootController.create(id,
				player_center.X, player_center.Y,
				clickPoint.X, clickPoint.Y,
				WeaponController.getCurrentWeapon())
			this.wasteAmmoCharger()
		}
	},
	getCurrentAmmoInChargerItemId: function()
	{
		return this.getCurrentWeaponId()
	},

	getCurrentAmmoInCharger: function()
	{
		return InventoryController.has(this.id, this.getCurrentAmmoInChargerItemId())
	},

	wasteAmmoCharger: function()
	{
		var totalAmmoAfterWaste = this.getCurrentAmmoInCharger() - 1
		return InventoryController.set(this.id, this.getCurrentAmmoInChargerItemId(), totalAmmoAfterWaste)
	},

	wasteAmmoInventory: function(qty)
	{
		var totalAmmoAfterWaste = this.getCurrentWeaponAmmoInInventory() - qty
		return InventoryController.set(this.id, this.getCurrentAmmoInInventoryItemId(), totalAmmoAfterWaste)
	},

	weaponHasAmmo: function()
	{
		var currentWeaponAmmo = this.getCurrentAmmoInCharger()
		if (currentWeaponAmmo > 0)
			return true

		this.reload(this.id)
		return false
	},
	
	setCurrentAmmoInCharger: function(qty)
	{
		return InventoryController.set(this.id, this.getCurrentAmmoInChargerItemId(), qty)
	},
	
	setCurrentAmmoInInventory: function(qty)
	{
		return InventoryController.set(this.id, this.getCurrentAmmoInInventoryItemId(), qty)
	},

	getCurrentAmmoInInventoryItemId: function()
	{
		return this.getCurrentWeaponId().split('weapon').join('ammo')
	},
	
	getCurrentWeaponAmmoInInventory: function()
	{
		var ammoItemId = this.getCurrentAmmoInInventoryItemId()
		return InventoryController.has(this.id, ammoItemId)
	},

	reload: function(socket_id)
	{
		this.setId(socket_id)
		console.log('reload for', socket_id)

		if (!this.isReloadAllowed())
			return false

		this.data('lastTimeReloaded', Date.now())
		var weapon = this.getCurrentWeapon()

		var ammo = this.getCurrentWeaponAmmoInInventory()
		if (ammo)
		{
			var currentLoadedAmmo = this.getCurrentAmmoInCharger()
			var chargerMaxAmmo = weapon.get('ammoCharger')
			var missingAmmo = chargerMaxAmmo - currentLoadedAmmo
			
			var ammo_after_reload = ammo - missingAmmo
			
			if (ammo_after_reload > 0)
			{
				this.setCurrentAmmoInCharger(currentLoadedAmmo + missingAmmo)
				this.wasteAmmoInventory(missingAmmo)
			} else {
				this.setCurrentAmmoInCharger(ammo)
				this.setCurrentAmmoInInventory(0)
			}
			console.log('RELOADING GUN')
		} else {
			console.log('EMPTY GUN')
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
		var lastItemId = 0
		_items.getData().for(function(id, item) {
			// var HIT_ID = HitController.getId(player.id, item.id)
			var HIT_ID = HitController.getId(player.id, item.id)
			var socket = _players.get(player.id, 'socket')
			if (HitMathHelper.boxCollides(player, item))
			{
				if (ItemsController.checkLastPlayerItemHit(player.id, item.id))
				{
					// Send grabbable property
					_items.set(item.id, {
						grabbable: true,
					}, true, socket)
				}
				lastItemId = item.id
				HitController.set(HIT_ID, true)
			} else {
				HitController.set(HIT_ID, false)
				_items.set(item.id, {
					grabbable: false,
				}, true, socket)
			}
		}, this)
		ItemsController.setLastPlayerItemHit(player.id, lastItemId)
	},

	updateItems: function ()
	{

	},
}










var ItemsController = {

	lastPlayerItemHitList: {},

	setLastPlayerItemHit: function (player_id, item_id)
	{
		this.lastPlayerItemHitList[player_id] = item_id
	},

	checkLastPlayerItemHit: function (player_id, item_id)
	{
		return this.lastPlayerItemHitList.hasOwnProperty(player_id) && this.lastPlayerItemHitList[player_id] == item_id
	},

	new: function(id, item)
	{
		_items.create(id, {
			id: id,
			X: item.X,
			Y: item.Y,
			qty: item.qty
		})
	},

	generate: function()
	{
		this.new('weapon.shotgun', {qty: 3, X: Math.random()*500, Y: 50})
		this.new('weapon.rifle', {qty: 10, X: Math.random()*500, Y: 100})
		this.new('weapon.smg', {qty: 10, X: Math.random()*500, Y: 150})
		this.new('ammo.smg', {qty: 30, X: 500, Y: 200})
		this.new('ammo.shotgun', {qty: 30, X: 500, Y: 200})
		this.new('ammo.rifle', {qty: 30, X: 500, Y: 200})
	},

	isPlayerAbleToGrab: function(player_id, item_id)
	{
		var HIT_ID = HitController.getId(player_id, item_id)
		return HitController.get(HIT_ID) && this.checkLastPlayerItemHit(player_id, item_id)
	},

	grabAttempt: function (socket, model)
	{
		if (this.isPlayerAbleToGrab(socket.id, model.data_id))
		{
			var item = _items.get(model.data_id)

			InventoryController.set(socket.id, model.data_id, item.qty)

			// TODO Fix item type
			if (item.id.split('.')[0] == 'weapon')
			{
				InventoryController.setCurrentWeapon(socket.id, model.data_id)
			}
			_items.remove(model.data_id)
		}
		return false
	}
}

ItemsController.generate()
console.log('Items Generated', Object.keys(_items.get()))


// #Inventory

var InventoryController = {
	
	set: function (player_id, item_id, qty)
	{
		var items = {}
		StackMaster.loop(this.get(player_id).items, function(key, value){
			items[key] = value
		})
		items[item_id] = qty

		_inventory.set(player_id, {
			items: items,
		})
		
	},

	get: function (player_id)
	{
		if (!_inventory.get(player_id, 'items'))
		{
			_inventory.create(player_id, {})
		}
		return Object.assign({}, _inventory.get(player_id))
	},

	has: function (player_id, item)
	{
		playerInventory = this.get(player_id)
		var items = playerInventory.items
		if (!items.hasOwnProperty(item))
			return false
		return items[item]
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