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
		master.field('item_grabbable', {
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

var _shoot = master.create('shoot', [
		master.field('id', {
				sync: true
			}),
		master.field('shoter_id', {
				sync: true
			}),
		master.field('from', {
				default: 0,
				sync: true
			}),
		master.field('to', {
				default: null,
				sync: true
			}),
		master.field('time', {
				default: 0,
				sync: true
			}),
		master.field('death', {
				default: 0,
				sync: true
			}),
		master.field('weapon', {
				default: 0,
				sync: true
			}),
	])

var _hitText = master.create('hitText', [
		master.field('X', {
			sync: true
		}),
		master.field('Y', {
			sync: true
		}),
		master.field('text', {
			sync: true
		}),
		master.field('target_id', {
			sync: true
		}),
		master.field('shield', {
			sync: true,
			default: false,
		}),
		master.field('created_at', {
			sync: true
		}),
		master.field('angle', {
			sync: true,
			default: 0
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



var HitStack = Object.assign({}, StackMaster, {
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


















// #shoot controller
var ShootController = {
	lifetime: 800,
	
	create: function(shooter_id, x, y, click_x, click_y, weapon)
	{	
		var root_angle = HitMathHelper.getAngleBetween(click_x, click_y, x, y);
		var perdigons = weapon.get('perdigons')
		var bloom = weapon.get('bloom')
		var length = weapon.get('length')
		var shootTime = Date.now()

		var bullets = [];
		for (i = 1; i <= perdigons; i++)
		{
			var angle = root_angle
			angle -= bloom /2
			angle += bloom * Math.random()
			
			to = HitMathHelper.getToByAngle(x, y, length, angle)
			var bullet = this.createBullet(shooter_id, x, y, to.X, to.Y, weapon, shootTime)
			bullets.push(bullet)
		}

		HitController.checkBulletsHitBy(shooter_id, bullets)
	},

	createBullet: function (shooter_id, x, y, to_x, to_y, weapon, time)
	{
		shoot = {
			id: this.makeUniqueId(),
			shooter_id: shooter_id,
			from: {X:x, Y:y},
			to: {X:to_x, Y:to_y},
			time: time,
			death: false,
			weapon: weapon,
		}

		_shoot.set(shoot.id, shoot)
		return shoot;
	},

	killBullets: function (bullets)
	{
		StackMaster.loop(bullets, function(id)
		{
			this.killById(id)
		}, this)
	},

	killById: function(id)
	{
		_shoot.set(id, {
			death: Date.now()
		})
	},

	deleteById: function(id)
	{
		_shoot.remove(id)
	},

	makeUniqueId: function()
	{
		return Date.now()+"_"+(Math.floor(Math.random()*10000)+10000)
	},
	
	update: function ()
	{
		_shoot.getData().for(function(id, value){
			this.loopUpdate(id, value);
		}, this)
	},

	loopUpdate: function (id, shoot)
	{
		if(!shoot.death
			&& shoot.time + this.getBulletLifeTime() < Date.now())
	    {
			this.killById(id)
	    }
		if(shoot.death && shoot.death + this.getDeathSafeTime() < Date.now())
	    {
			this.deleteById(id)
	    }
	},

	getDeathSafeTime: function()
	{
		return 1000 // mms
	},

	getBulletLifeTime: function ()
	{
		return 100
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
			// console.log('RELOADING GUN')
		} else {
			// console.log('EMPTY GUN')
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




// #hit controller
var HitController = {

	checkBulletsHitBy: function(player_id, bullets)
	{
		this.checkBulletsEnemiesHit(player_id, bullets)
	},

	checkBulletsEnemiesHit: function(player_id, bullets)
	{
		var enemies = PlayersController.getEnemiesFrom(player_id)
		var enemyTarget = {
			length: 10**9, // help calc shoot len
			damage: 0,
			enemy: null,
		}
		StackMaster.loop(enemies, function(id, enemy){
			var enemy = enemies[id]
			var points = PlayersController.getPoints(enemy)
			var posibleInflictedDamage = this.getInflictedDamageBulletsShapePointsHit(bullets, points, enemy.id)
			
			if (posibleInflictedDamage)
			{
				var shootLength = this.getShootLength(enemy)
				// Shoot damage is only for shorter enemy
				if (shootLength < enemyTarget.length)
				{
					enemyTarget.length = shootLength
					enemyTarget.enemy = enemy
					enemyTarget.damage = posibleInflictedDamage
				}
			}
		}, this)

		// Check if we hit something
		if (enemyTarget.enemy)
		{
			this.hitBullets(player_id, bullets, enemyTarget)
		}
	},

	hitBullets: function(player_id, bullets, target)
	{
		ShootController.killBullets(bullets)
		centeredEnemy = PlayersController.center(target.enemy)
		console.log('HIT',player_id,'by',target.enemy.id,'for',target.damage)
		_hitText.create(player_id + Date.now(), {
			X: centeredEnemy.X,
			Y: centeredEnemy.Y,
			text: target.damage,
			target_id: target.enemy.id,
			shield: true,
			created_at: Date.now(),
		})
		// enemyTarget.enemy.getHitted(enemyTarget.damage, shoot.weapon.id)
	},

	getInflictedDamageBulletsShapePointsHit: function (bullets, shapePoints, shapePoints_id)
	{
		var inflictedDamage = 0
		
		for (id in bullets)
		{
			if (!bullets.hasOwnProperty(id))
			continue;

			var shoot = bullets[id]
			var bulletDamage = shoot.weapon.get('damage')

			// todo change shoot death for ShootController.isalive(shoot)
			if (!shoot.death && this.checkLineShapePointsHit(shoot, shapePoints))
			{
				// Enemy cant hurt himself
				if (shoot.shooter_id == shapePoints_id)
					continue

				// BULLET HITTED ON ONE OR MULTIPLE ENEMIES
				inflictedDamage += bulletDamage
			}
		}
		console.log('INFLICTED DAMAGE', inflictedDamage)
		
		return inflictedDamage
	},

	checkLineShapePointsHit: function (bullet, points)
	{
		var hit = false
		
		for (i = 1; i < points.length; i++)
			hit = hit || this.areLinesColliding(bullet.from, bullet.to, points[i-1], points[i])
		
		return hit
	},

	getShootLength: function(enemy)
	{
		// where dx is the difference between the x-coordinates of the points
		// and  dy is the difference between the y-coordinates of the points
		// sqrt(dx^2 + dy^2)
		// var player = PlayerController.getCurrentPlayer()
		//var dx = player.center().X - enemy.entity.center().X
		//var dy = player.center().Y - enemy.entity.center().Y
		//return Math.sqrt(dx**2 + dy**2)
		return 0
	},

	areLinesColliding: function (a, b, c, d)
	{
		denominator = ((b.X - a.X) * (d.Y - c.Y)) - ((b.Y - a.Y) * (d.X - c.X));
		numerator1 = ((a.Y - c.Y) * (d.X - c.X)) - ((a.X - c.X) * (d.Y - c.Y));
		numerator2 = ((a.Y - c.Y) * (b.X - a.X)) - ((a.X - c.X) * (b.Y - a.Y));


    	// Detect coincident lines (has a problem, read below)
    	if (denominator == 0) return numerator1 == 0 && numerator2 == 0;

    	r = numerator1 / denominator;
    	s = numerator2 / denominator;

    	return (r >= 0 && r <= 1) && (s >= 0 && s <= 1);
	},

}






// #game #update
var GameUpdateController = {
	update: function ()
	{
		ShootController.update()
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
		var resetItemGrabbable = true
		var socket = _players.get(player.id, 'socket')
		_items.getData().for(function(id, item) {
			// var HIT_ID = HitStack.getId(player.id, item.id)
			var HIT_ID = HitStack.getId(player.id, item.id)
			if (HitMathHelper.boxCollides(player, item))
			{
				_inventory.set(player.id, {
					item_grabbable: item.id,
				}, true, socket)
				lastItemId = item.id
				HitStack.set(HIT_ID, true)
				resetItemGrabbable = false
			} else {
				HitStack.set(HIT_ID, false)
			}
		}, this)
		if (resetItemGrabbable)
			_inventory.set(player.id, {
				item_grabbable: null,
			}, true, socket)
	},

	updateItems: function ()
	{

	},
}










var ItemsController = {

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
		var HIT_ID = HitStack.getId(player_id, item_id)
		return HitStack.get(HIT_ID)
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










// #players controller
var PlayersController = {

	width: 32,
	height: 32,

	center: function (shape)
	{
		return {
			X: shape.X + this.width/2,
			Y: shape.Y + this.height/2,
		}
	},

	getPoints: function (shape)
	{
		  return [
			  {X: shape.X, Y: shape.Y},
			  {X: shape.X, Y: shape.Y + this.height},
			  {X: shape.X + this.width, Y: shape.Y +  this.height},
			  {X: shape.X + this.width, Y: shape.Y},
		  ];
	},

	getEnemiesFrom: function (player_id)
	{
		// todo remove player id from list
		var enemies = Object.assign({}, _players.get())
		delete enemies[player_id]
		return enemies
	},
	
	newPlayer: function(socket)
	{
		// Sign In on Client
		socket.emit('id', socket.id)
		
		// Sign In on Server
		var player = _players.create(socket.id, {
				id: socket.id,
				socket: socket,
				width: this.width,
				height: this.height
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

}

setInterval(function(){
	PlayersController.checkAllPlayerSocketConnection.call(PlayersController)
}, 1000)



var server = http.listen(3000, () => {
	console.log('server is running on port', server.address().port);
});