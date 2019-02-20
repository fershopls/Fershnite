/* 
 * MATH DESTRUCTION!!
 * */


/*==========================================================================================
=            #CORE CONTROLLER                  =============================================
==========================================================================================*/

var Core = {

	debug: false,
	io_debug: true,
	modules: [],
	settings: {
		autoShoot: false,
	},

	addModule: function (Module)
	{
		this.modules.push(modules)
	},

	data: {
		canvas: null,
		ctx: null,
		lastTime: 0,
		dt: 0,
	},

	sound: {},

	init: function (canvas, modules)
	{
		this.modules = modules
		
		this.sound = this.loadSound()

		this.data.canvas = canvas
		this.data.ctx = this.data.canvas.getContext("2d")
		
		this.initModules()

		this.mainBucle()
	},

	loadSound: function ()
	{
		return {
			fire: {
			'rifle': new sound("/assets/shoot.mp3"),
			'shotgun': new sound("/assets/shotgun.mp3"),
			'smg': new sound("/assets/smg.mp3"),
			'hands': new sound("/assets/hands.mp3"),
			'emptyGun': new sound("/assets/emptyGun.mp3"),
			},
			weapon: new sound("/assets/switch_weapon.mp3"),
		}
	},

	// TODO CHEKC DT UNIT
	mainBucle: function ()
	{
		var now = Date.now();
		Core.data.dt = (now - Core.data.lastTime) / 1000.0;
		Core.update(Core.data.dt);
	  	Core.draw(Core.data.ctx, Core.data.canvas);
		requestAnimationFrame(Core.mainBucle);
		Core.data.lastTime = now;
	},

	initModules: function ()
	{
		for (var id in this.modules) {
			if (this.modules.hasOwnProperty(id)) {
				if (this.modules[id].hasOwnProperty('init'))
				{
					this.modules[id].init(this)
				}
			}
		}
	},

	update: function (dt)
	{
		for (var id in this.modules) {
			if (this.modules.hasOwnProperty(id)) {
				if (this.modules[id].hasOwnProperty('update'))
				{
					this.modules[id].update(dt)
				}
			}
		}
	},

	draw: function (ctx, canvas)
	{
		ctx.clearRect(0, 0, Core.data.canvas.width, Core.data.canvas.height);
		
		ctx.fillStyle = '#a2bf4e'
		ctx.fillRect(0, 0, Core.data.canvas.width, Core.data.canvas.height);
		this.drawGrid(ctx)
		
		for (var id in this.modules) {
			if (this.modules.hasOwnProperty(id)) {
				if (this.modules[id].hasOwnProperty('draw'))
				{
					this.modules[id].draw(ctx, canvas)
				}
			}
		}
	},

	drawGrid: function(ctx)
	{
		ctx.save()
		ctx.translate(-10,-15)
		ctx.strokeStyle = '#b8d763'
		var factor = 48
		factor = Math.sqrt(factor**2 + factor**2)
		for (i = -10; i < 20; i++)
		{
			var X = i*factor
			ctx.moveTo(X, 0)
			var to = AimController.getToByAngle(X,0, this.data.canvas.width, 35*Math.PI/180)
			ctx.lineTo(to.X, to.Y)
			ctx.stroke()
		}
		for (i = 0; i < 30; i++)
		{
			var X = i*factor
			ctx.moveTo(X, 0)
			var to = AimController.getToByAngle(X,0, this.data.canvas.width, 145*Math.PI/180)
			ctx.lineTo(to.X, to.Y)
			ctx.stroke()
		}
		ctx.restore()
	},


}


/*==========================================================================================
=            #SPRITESHEET ClASS                     =============================================
==========================================================================================*/
function SpriteSheet (sprites, prefix)
{
	this.stack = {}
	this.prefix = prefix?prefix: ""
	this.currentId = null;

	this.init = function(sprites, prefix)
	{
		for (id in sprites)
		{
			if (!sprites.hasOwnProperty(id))
				continue

			var full_id = this.getPrefix() + sprites[id]
			var sprite = SpriteController.get(full_id)
			this.stack[sprites[id]] = sprite
		}
	}

	this.getPrefix = function()
	{
		if (this.prefix)
			return prefix + '.'
		return ''
	}

	this.set = function(id)
	{
		if (this.stack.hasOwnProperty(id))
		{
			this.currentId = id;
		}
	}

	this.get = function ()
	{
		var current_id = this.getCurrentId()
		var x = this.stack[current_id]
		if (typeof x == 'undefined')
			console.log('get', current_id)
		return x
	},

	this.getCurrentId = function()
	{
		if (!this.currentId && Object.keys(this.stack).length > 0)
			this.currentId = Object.keys(this.stack)[0]
		
		return this.currentId
		
	}

	this.init(sprites, this.prefix)
}

/*==========================================================================================
=            #SPRITE CONTROLLER                =============================================
==========================================================================================*/

var SpriteController = {

	stack: {},

	init: function()
	{
		this.addMany({
			'weapon.shotgun': new Sprite('assets/gun.png', [64*2, 0], [64*2, 64], 1, [1], 'vertical'),
	  		'weapon.rifle': new Sprite('assets/gun.png', [64*2, 0], [64*2, 64], 1, [0], 'vertical'),
	  		'weapon.smg': new Sprite('assets/gun.png', [64*2, 0], [64*2, 64], 1, [2], 'vertical'),
	  		'weapon.hands': new Sprite('assets/gun.png', [64*2, 0], [64*2, 64], 1, [3], 'vertical'),

		  	'player.stand': new Sprite('assets/player.png', [0, 0], [32, 32], 6, [0]),
		  	'player.walk': new Sprite('assets/player.png', [0, 0], [32, 32], 30, [0, 1, 2, 3, 2, 1]),

	  		'enemy.stand': new Sprite('assets/player.png', [32*0, 32*3], [32, 32], 6, [0]),

	  		'ammo.box': new Sprite('assets/gun.png', [64*2, 0], [64*2, 64], 1, [4], 'vertical'),
		})
	},

	addMany: function(sprites)
	{
		for (id in sprites)
		{
			if (!sprites.hasOwnProperty(id))
				continue
			this.add(id, sprites[id])
		}
	},

	add: function(id, sprite)
	{
		this.stack[id] = sprite
	},

	get: function(id)
	{
		if (this.stack.hasOwnProperty(id))
			return this.stack[id]
		console.log("SPRITE 404",id,'in',Object.keys(this.stack))
		return false
	}

}



/*==========================================================================================
=            #SOUND CLASS                      =============================================
==========================================================================================*/

function sound(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function(){
  	this.sound.currentTime = 0
    this.sound.play();
  }
  this.stop = function(){
    this.sound.pause();
  }
}



/*==========================================================================================
=            #AIM CONTROLLER                   =============================================
==========================================================================================*/


var AimController = {
	
	getPivot: function()
	{
		return PlayerController.entity.center()
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
		pivot_x = pivot_x?pivot_x:this.getPivot().X
		pivot_y = pivot_y?pivot_y:this.getPivot().Y
		return this.getAngleFromTo(pivot_x, pivot_y, mouse_x, mouse_y)
	},

	draw: function(ctx)
	{
		var weapon = WeaponController.getCurrentWeapon()
	    
	    var fillStyle = 'black';
		if (weapon)
	    	fillStyle = weapon.getRGBColor();
	    
	    this.drawCursor(ctx, fillStyle)
	    this.drawBloomArea(ctx, weapon)
	},

	lineToAngleWithRelativeBloom: function(pivot, length, angle, abs_bloom, rel_bloom)
	{
		return this.getToByAngle(pivot.X, pivot.Y, length, angle + (abs_bloom/2 * rel_bloom))
	},

	drawBloomArea: function (ctx, weapon)
	{
		if (!weapon)
			return false
		var angle = this.getAngleBetween(MouseController.X, MouseController.Y);
		var bloom = weapon.get('bloom')
		var length = weapon.get('length')
		var pivot = this.getPivot();
		// Bloom Points
		var to = {
			0: this.lineToAngleWithRelativeBloom(this.getPivot(), length, angle, bloom, -1),
			5: this.lineToAngleWithRelativeBloom(this.getPivot(), length, angle, bloom, -.5),
			1: this.lineToAngleWithRelativeBloom(this.getPivot(), length, angle, bloom, 0),
			15: this.lineToAngleWithRelativeBloom(this.getPivot(), length, angle, bloom, .5),
			2: this.lineToAngleWithRelativeBloom(this.getPivot(), length, angle, bloom, 1),	
		}
		
		var hitTests = [
			this.createHitTestLine(to[2], to[1]),
			this.createHitTestLine(to[1], to[0]),
		]
		for (id in to)
		{
			if (to.hasOwnProperty(id))
			{
				var _to = this.createHitTestLine(pivot, to[id])
				hitTests.push(_to)
			}
		}

		// Draw Hit Tests Lines
		ctx.beginPath()
		for (id in hitTests)
		{
			if (hitTests.hasOwnProperty(id))
			{
				var ht = hitTests[id]
				ctx.moveTo(ht.from.X, ht.from.Y);
				ctx.lineTo(ht.to.X, ht.to.Y);
			}
		}
		if (Core.debug)
		{
			ctx.strokeStyle = 'white'
			ctx.stroke()
		}
		
		// Draw area shape
		ctx.beginPath()
		ctx.fillStyle = 'rgba(255,255,255,0.25)'
		ctx.moveTo(this.getPivot().X, this.getPivot().Y);
		ctx.lineTo(to[0].X, to[0].Y);
		ctx.lineTo(to[1].X, to[1].Y);
		ctx.lineTo(to[2].X, to[2].Y);
		ctx.lineTo(this.getPivot().X, this.getPivot().Y);
		if (Core.settings.autoShoot || Core.debug)
		{
			if (HitController.checkLinesEnemiesHit(hitTests))
			{
				if (Core.settings.autoShoot)
					WeaponController.shoot()
				if (Core.debug)
					ctx.fillStyle = 'rgba(255,0,0,0.5)'
			}
		}
		ctx.fill()
	},

	createHitTestLine: function(from, to)
	{
		return {from: from, to: to}
	},

	drawCursor: function (ctx, fillStyle)
	{
		ctx.beginPath();
		ctx.fillStyle = fillStyle
	    ctx.fillRect(MouseController.X-3, MouseController.Y-3, 6, 6);
	    ctx.fillRect(MouseController.X-1, MouseController.Y-3-10, 2, 8);
	    ctx.fillRect(MouseController.X-1, MouseController.Y-3 +8, 2, 8);
	},

}



/*==========================================================================================
=            #SHOOT CONTROLLER                 =============================================
==========================================================================================*/


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

	create: function(shooter_id, x, y, mouse_x, mouse_y, weapon)
	{
		// TODO Sounds if not exists not throw things
		Core.sound.fire[weapon.id].play();
		
		var root_angle = AimController.getAngleBetween(mouse_x, mouse_y, x, y);
		var perdigons = weapon.get('perdigons')
		var bloom = weapon.get('bloom')
		var length = weapon.get('length')

		var bullets = [];
		for (i = 1; i <= perdigons; i++)
		{
			var angle = root_angle
			angle -= bloom /2
			angle += bloom * Math.random()
			
			to = AimController.getToByAngle(x, y, length, angle)
			var bullet = this.createBullet(shooter_id, x, y, to.X, to.Y, weapon)
			bullets.push(bullet)
		}

		HitController.checkBulletsHit(bullets)
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

    	ctx.save()
		ctx.beginPath();
		var max = this.getBulletLifeTime()
		var min = Date.now() - shoot.time
		ctx.lineWidth = (1 / max * min) * 8
		ctx.strokeStyle = 'rgba(255, 235, 59, '+alpha+')'//weapon.getRGBAColor(alpha);
		ctx.moveTo(shoot.from.X, shoot.from.Y);
		ctx.lineTo(shoot.to.X, shoot.to.Y);
		ctx.stroke();
		ctx.restore()

	},

	drawTrigometricThing: function (ctx, shoot)
	{
		ctx.beginPath();
		ctx.strokeStyle = '#ddd';
		ctx.moveTo(shoot.from.X, shoot.from.Y);
		ctx.lineTo(shoot.to.X, shoot.to.Y);

		ctx.moveTo(shoot.from.X, shoot.from.Y);
		ctx.lineTo(shoot.to.X, shoot.from.Y);

		ctx.moveTo(shoot.to.X, shoot.from.Y);
		ctx.lineTo(shoot.to.X, shoot.to.Y);
		ctx.stroke();
	},
}





/*==========================================================================================
=            #UI CONTROLLER                    =============================================
==========================================================================================*/


var UIController = {
	stats: {
		dead: false,
		health: {
			qty: 100,
			max: 100,
		},
		shield: {
			qty: 100,
			max: 100,
		}
	},

	ui: {
		stats: {
			width: 200,
			height: 18,
			margin: 40,
			padding: 18+8,
		}
	},

	sprite: [],
	init: function ()
	{
		// url, pos, size, speed, frames, dir, once
		this.sprite = new SpriteSheet([
			'shotgun',
			'rifle',
			'smg',
			'hands'
		], 'weapon')
	},

	damage: function (totalDamage)
	{
		var damageToShield = 0
		var damageToHealth = 0
		if (totalDamage <= this.stats.shield.qty)
		{
			damageToShield = totalDamage
			this.stats.shield.qty -= damageToShield
		}
		else
		{
			damageToShield = this.stats.shield.qty
			damageToHealth = totalDamage - damageToShield
			this.stats.shield.qty = 0
			this.stats.health.qty -= damageToHealth
		}

		if (this.stats.health.qty < 0)
			this.stats.health.qty = 0

		return {
			shield: damageToShield,
			health: damageToHealth,
		}
	},

	update: function (dt)
	{
		if (this.stats.health.qty > this.stats.health.max)
			this.stats.health.qty = this.stats.health.max
		if (this.stats.shield.qty > this.stats.shield.max)
			this.stats.shield.qty = this.stats.shield.max
		if (this.stats.health.qty <= 0)
		{
			this.stats.dead = true
			this.stats.health.qty = 0
		}
	},

	draw: function (ctx)
	{
		this.drawHealth(ctx);
		this.drawShield(ctx);
		HitTextController.draw(ctx);
		this.drawGUI(ctx);
  		
  		if (WeaponController.getCurrentWeapon())
  		{
  			this.drawWeaponSolt(ctx);
	  		this.drawLoadedAmmo(ctx)
	  		this.drawLeftAmmo(ctx)
  		}

	},

	drawGUI: function(ctx)
	{
		ctx.drawImage(resources.get('assets/gui.png'), 0, 0);
	},

	drawLoadedAmmo: function(ctx)
	{
		var X = Core.data.canvas.width/2 -15
		var Y = Core.data.canvas.height -82
		
		text = WeaponController.getCurrentWeapon().get('ammoLoaded')
		if (text == -1)
			text = '∞'
		TextController.create({size:20, text: text, X: X, Y: Y, align: 'right'})
	},

	drawLeftAmmo: function(ctx)
	{
		var X = Core.data.canvas.width/2+35
		var Y = Core.data.canvas.height -82
		
		text = WeaponController.getAmmo(WeaponController.getCurrentWeaponId())
		TextController.create({size:20, text: text, X: X, Y: Y, align: 'left'})
	},

	drawWeaponSolt: function(ctx)
	{
		ctx.save()
		ctx.translate(94, Core.data.canvas.height - 76)
		this.sprite.get(WeaponController.getCurrentWeaponId()).render(ctx)
		ctx.restore()

		// prev weapon
		var currentWeapon = WeaponController.getCurrentWeaponId()
		var prevWeaponId = InventoryController.getPrevStackItem('weapons', currentWeapon)
		var nextWeaponId = InventoryController.getNextStackItem('weapons', currentWeapon)
		if (prevWeaponId)
		{
			ctx.save()
			ctx.translate(30, Core.data.canvas.height - 60)
			ctx.scale(.5,.5);
			this.sprite.get(prevWeaponId).render(ctx)
			ctx.restore()
		}

		// next weapon
		if (nextWeaponId)
		{
			ctx.save()
			ctx.translate(220, Core.data.canvas.height - 60)
			ctx.scale(.5,.5);
			this.sprite.get(nextWeaponId).render(ctx)
			ctx.restore()
		}
	},

	drawHealth: function (ctx)
	{
		this.drawStatBar(ctx, 'green', 1/this.stats.health.max*this.stats.health.qty, 0)
	},

	drawShield: function (ctx)
	{
		this.drawStatBar(ctx, 'aqua', 1/this.stats.shield.max*this.stats.shield.qty, this.ui.stats.padding)
	},

	drawStatBar: function (ctx, color, fillRate, padding)
	{
		ctx.beginPath()
		ctx.fillStyle = this.stats.dead? 'red' : color
		ctx.strokeStyle = ctx.fillStyle
		ctx.strokeRect(Core.data.canvas.width/2 - this.ui.stats.width/2, Core.data.canvas.height - (this.ui.stats.margin + padding), this.ui.stats.width, this.ui.stats.height)
		ctx.fillRect(Core.data.canvas.width/2 - this.ui.stats.width/2, Core.data.canvas.height - (this.ui.stats.margin + padding), this.ui.stats.width*fillRate, this.ui.stats.height)
	},

}



/*==========================================================================================
=            #WEAPON CLASS                     =============================================
==========================================================================================*/


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

    	console.log('NO PROPERTY',key)
    }
	
	this.set = function(key, value) {
    	if (this.setter.hasOwnProperty(key))
    		return this.setter[key](this, value)
        if (this.settings.hasOwnProperty(key))
			this.settings[key] = value
    	return value

    	console.log('NO PROPERTY',key)
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


/*==========================================================================================
=            #ENTITY CLASS                     =============================================
==========================================================================================*/
function Entity (settings)
{
	this.settings = {};
    	
	this.init = function ()
	{
		var defaultSettings = {
			X: 220,
			Y: 270,
			scaleX: 1,
			scaleY: 1,
			width: 32,
			height: 32,
			drawX: 0,
			drawY: 0,
			color: "#00A",
			alias: null,
			sprite: new SpriteSheet()
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

	
	this.center = function()
	{
	  	return {
	  		X: this.X + this.width/2,
	  		Y: this.Y + this.height/2,
	  	}
  	}

  	this.getPoint = function ()
  	{
		return {X:this.X, Y:this.Y}
  	}

  	this.getPoints = function ()
  	{
		return [
			{X:this.X, Y:this.Y},
			{X:this.X, Y:this.Y + this.height},
			{X:this.X + this.width, Y:this.Y + this.height},
			{X:this.X + this.width, Y:this.Y},
		];
  	}

  	this.draw = function (ctx)
  	{
  		if (this.sprite.get())
  		{
	  		ctx.save();
		    ctx.translate(this.X + this.drawX, this.Y + this.drawY);
		    ctx.scale(this.scaleX, this.scaleY)
		    this.sprite.get().render(ctx)
		    ctx.restore()
  		} else {
	  		ctx.fillStyle = this.color;
		    ctx.fillRect(this.X, this.Y, this.width, this.height);
		    TextController.create({X: this.center().X, Y: this.center().Y, text: this.alias, align:'center'})
  		}

	    if (Core.debug)
	    {
	    	ctx.strokeStyle = this.color;
	    	ctx.strokeRect(this.X, this.Y, this.width, this.height);
	    	var text = this.id?this.id:this.alias
		    TextController.create({size:11, font:'Arial', X: this.center().X, Y: this.Y + this.height, text: text, align:'center'})
	    	
	    	// Debug velocity DEBUG TEXT JSON 
	  //   	var text = JSON.stringify(this.movement)
	  //   	text = text.split(',').join("\n")
			// ctx.save();
			// ctx.translate(10, 10);
			// ctx.font = "13px Arial";
			// ctx.fillStyle = 'white'

			// var lineheight = 15;
			// var lines = text.split('\n');
			// for (var i = 0; i<lines.length; i++)
			//     ctx.fillText(lines[i], 0, 0 + (i*lineheight) );
			// ctx.restore();
	    }
  	}
}


/*=========================================
=            #DRAW ENTITY                 =
===========================================*/
var DrawEntity = {
	defaultSettings: {
			id: null,
			alias: null,
			X: 220,
			Y: 270,
			scaleX: 1,
			scaleY: 1,
			width: 32,
			height: 32,
			drawX: 0,
			drawY: 0,
			color: "#00A",
			sprite: new SpriteSheet(),

			center: function(){
				return {
			  		X: this.X + this.width/2,
			  		Y: this.Y + this.height/2,
			  	}
			  },
		},
  	
  	draw: function (id, ctx, settings)
  	{
  		var draw = Object.assign({}, this.defaultSettings, settings)
  		
  		if (draw.sprite.get())
  		{
  			// console.log(this)
  			// return	0
  		}
  		if (draw.sprite.get())
  		{
	  		ctx.save();
		    ctx.translate(draw.X + draw.drawX, draw.Y + draw.drawY);
		    ctx.scale(draw.scaleX, draw.scaleY)
		    draw.sprite.get().render(ctx)
		    ctx.restore()
  		} else {
	  		ctx.fillStyle = draw.color;
		    ctx.fillRect(draw.X, draw.Y, draw.width, draw.height);
		    TextController.create({X: draw.center().X, Y: draw.center().Y, text: draw.alias, align:'center'})
  		}

	    if (Core.debug)
	    {
	    	ctx.strokeStyle = draw.color;
	    	ctx.strokeRect(draw.X, draw.Y, draw.width, draw.height);
	    	var text = draw.id?draw.id:draw.alias
		    TextController.create({size:11, font:'Arial', X: draw.center().X, Y: draw.Y + draw.height, text: text, align:'center'})
	    }
  	}
}



/*==========================================================================================
=            #ITEM CLASS                       =============================================
==========================================================================================*/
function Item (stack_id, item_id, entity, qty)
{
	this.stack_id = stack_id
	this.item_id = item_id
	this.entity = entity
	this.qty = qty?qty:1

	this.grabbable = false

	this.grab = function()
	{
		console.log(this.stack_id, this.item_id, this.qty)
		InventoryController.attach(this.stack_id, this.item_id, this.qty)
	}

	this.update = function(dt, id)
	{
		// TODO Key E must be pressed each time and not just key down
		if (ItemController.isAllowedToGrab()
			&& this.playerHit
			&& ItemController.isGrabbingItem())
		{	
			this.grab()
			ItemController.removeItemById(id)
			ItemController.startTimeGrabWait()
		}
		this.playerHit = false
	}

	this.draw = function(ctx)
	{
		this.entity.draw(ctx)
		if (this.grabbable)
			this.drawGrabbable(ctx)
	}

	this.allowGrabbable = function ()
	{
		this.grabbable = ItemController.isAllowedToBeGrabbable()
	}

	this.playerHit = false
	this.hit = function (by)
	{
		if (by == PlayerController)
		{
			this.playerHit = true
		}
	}

	this.drawGrabbable = function (ctx)
	{
		var Y = this.entity.Y + this.entity.height
		var X = this.entity.center().X
		var text = this.getItemAlias()
		TextController.create({size:18, text: text, X: X, Y: Y+15, align: 'center'})
		TextController.create({size: 12, text: 'PRESS E TO GRAB', X: X, Y: Y+35, align: 'center'})
		this.grabbable = false
	}

	this.getItemAlias = function ()
	{
		var alias
		
		if (this.entity.alias)
			alias = this.entity.alias
		else alias = this.item_id

		return alias.toUpperCase()
	}
}



/*==========================================================================================
=            #ITEM      CONTROLLER             =============================================
==========================================================================================*/

var ItemController = {

	grab: {
		lastTime: 0,
		minGrabTime: 500,
		minGrabbableTime: 450,
		lastKeyWasDown: false,
	},
	
	isAllowedToGrab: function()
	{
		return Date.now() - this.grab.lastTime >= this.grab.minGrabTime
	},

	isAllowedToBeGrabbable: function()
	{
		return Date.now() - this.grab.lastTime >= this.grab.minGrabbableTime
	},

	isGrabbingItem: function()
	{
		if (input.isDown('e') && !this.grab.lastKeyWasDown)
		{
			this.grab.lastKeyWasDown = true
			return true
		}
	},

	startTimeGrabWait: function()
	{
		this.grab.lastTime = Date.now()
	},

	update: function(dt)
	{
		var items = _items.get()
		
		if (!input.isDown('e'))
		{
			this.grab.lastKeyWasDown = false
		}
		
		if (this.isGrabbingItem())
			StackMaster.loop(items, function(id, item){
				// TODO fix invisible sprite
				// this.getSpritesheet(id).get().update()
			
				if (item.grabbable)
				{
					_items.set(item.id, {
						grabbed_by: true
					})
				}
			}, this)

	},

	spritesheets: {},
	getSpritesheet: function (id)
	{
		if (!this.spritesheets.hasOwnProperty(id))
			this.spritesheets[id] = new SpriteSheet([id])
		
		return this.spritesheets[id]
	},

	getDrawEntityModel: function(item) {
			var drawEntityModel = {
			X: item.X,
			Y: item.Y,

			alias: item.id,
			width:48,
			height:32,
			drawX: -8,
			drawY: 0,
			scaleX: 0.49,
			scaleY: 0.49,
			color: 'red',
			// TODO fix creating a spritesheet everytime
			sprite: this.getSpritesheet(id),
	  	}
	  	if (id != this.id)
	  		drawEntityModel.color = 'red'
	  	return drawEntityModel
	},

	draw: function(ctx) {
		var items = _items.get()
		
		StackMaster.loop(items, function(id, item){
			DrawEntity.draw('items', ctx, this.getDrawEntityModel(item))
			
			if (item.grabbable)
				this.drawGrabbableText(ctx, item)

		}, this)
	},

	drawGrabbableText: function (ctx, item)
	{
		var item = this.getDrawEntityModel(item);
		var Y = item.Y + item.height
		var X = item.X + item.width/2

		var text = this.getItemAlias(item)
		TextController.create({size:18, text: text, X: X, Y: Y+15, align: 'center'})
		TextController.create({size: 12, text: 'PRESS E TO GRAB', X: X, Y: Y+35, align: 'center'})
		this.grabbable = false
	},

	getItemAlias: function (item)
	{
		return item.alias.toUpperCase()
	},
}


/*==========================================================================================
=            #INVENTORY CONTROLLER             =============================================
==========================================================================================*/

var InventoryController = {
	stack: [],

	init: function ()
	{
		// this.attachMany('weapons', {
		// 	'shotgun': 1,
		// 	'smg': 1
		// })
		// this.attachMany('ammo', {
		// 	'shotgun': 999,
		// 	'smg': 999,
		// })
	},

	update: function(dt)
	{
		var weapons = this.getStack('weapons')
		if (!WeaponController.getCurrentWeapon() && Object.keys(weapons).length >= 1)
			WeaponController.setWeapon(Object.keys(weapons)[0])
	},

	getStack: function (stack_id)
	{
		if (!this.stack.hasOwnProperty(stack_id))
			this.stack[stack_id] = {}

		return this.stack[stack_id]
	},

	set: function (stack_id, item, qty)
	{
		qty = qty?qty:0

		this.getStack(stack_id)
		this.stack[stack_id][item] = qty
	},

	attach: function (stack_id, item, qty)
	{
		qty = qty?qty:1

		if (!this.getStack(stack_id).hasOwnProperty(item))
			this.stack[stack_id][item] = qty
		else
			this.stack[stack_id][item] += qty

	},

	attachMany: function (stack_id, items)
	{
		for (id in items)
		{
			if (!items.hasOwnProperty(id))
				continue;
			
			var qty = items[id]
			if (!this.getStack(stack_id).hasOwnProperty(id))
				this.stack[stack_id][id] = qty
			else
				this.stack[stack_id][id] += qty
		}

	},

	has: function (stack_id, item)
	{
		if (!this.getStack(stack_id).hasOwnProperty(item))
			return false
		return this.stack[stack_id][item]
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



/*==========================================================================================
=            #WEAPON CONTROLLER                =============================================
==========================================================================================*/


var WeaponController = {
	data: {
		current: null,
		lastSwitchTime: 0,
	  	lastWeapon: null,
	  	minSwitchTime: 700,
	  	lastTimeFired: 0,
	  	lastTimeReloaded: 0,
	},
	weapons: [],

	getAmmo: function(weapon_id)
	{
		var ammo = InventoryController.has('ammo', weapon_id)
		return ammo?ammo:0
	},

	setAmmo: function (weapon_id, ammo)
	{
		if (this.ammo.hasOwnProperty(weapon_id))
			this.ammo[weapon_id] += ammo
		else 
			this.ammo[weapon_id] = ammo

		return this.ammo[weapon_id]
	},

	isShootAllowed: function()
	{
		if (!this.getCurrentWeapon())
			return false

		allow_fire = Date.now() - this.data.lastTimeFired >= this.getCurrentWeapon().get('fireRate')
		return allow_fire && this.isTimeToReloadAllowed()
	},

	isTimeToReloadAllowed: function ()
	{
		if (!this.getCurrentWeapon())
			return false

		return Date.now() - this.data.lastTimeReloaded >= this.getCurrentWeapon().get('ammoReloadTime')
	},

	isReloadAllowed: function()
	{
		return this.isTimeToReloadAllowed() && this.getCurrentWeapon().get('ammoLoaded') < this.getCurrentWeapon().get('ammoCharger')
	},

	shoot: function(dt)
	{
	  	if (!this.isShootAllowed())
			return false
		
		this.data.lastTimeFired = Date.now()
		
		var ammoLoaded = this.getCurrentWeapon().get('ammoLoaded')
		if (ammoLoaded > 0 || ammoLoaded == -1)
		{
			// Send shoot
			ShootController.socketShootSend(PlayerController.entity.id,
				PlayerController.entity.center().X, PlayerController.entity.center().Y,
				MouseController.X, MouseController.Y,
				WeaponController.getCurrentWeaponId())

			ShootController.create(PlayerController.entity.id,
				PlayerController.entity.center().X, PlayerController.entity.center().Y,
				MouseController.X, MouseController.Y,
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
		this.data.lastTimeReloaded = Date.now()
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
		return _inventory.get('current', false, PlayerController.id)
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
			this.data.lastWeapon = this.getCurrentWeaponId()
			return this.data.current = id
		}
		else
			return false
	},

	switchWeaponAllowed: function()
	{
		return Date.now() - this.data.lastSwitchTime >= this.data.minSwitchTime
			&& Object.keys(InventoryController.getStack('weapons')).length > 1
	},

	switchWeapon: function(next)
	{
		if (!this.switchWeaponAllowed())
			return false;
		this.data.lastSwitchTime = Date.now()
		
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
				weaponObjects[id] = new Weapon(weapons[id])
				weaponObjects[id].id = id
			}
		}
		return weaponObjects;
	}
}


/*==========================================================================================
=            #PLAYER CONTROLLER                =============================================
==========================================================================================*/


var PlayerController = {
  id: null,
  sprite: null,
  movement: {
  	x_speed: 0, // current speed
  	y_speed: 0,
  	x_aceleration: 0,
  	y_aceleration: 0,
  	max_speed: 10, // max px per sec
  	aceleration: 500, // 0 speed to max_speed in ms 
  },
  
  setId: function(id)
  {
  	this.id = id

  	if (Core.io_debug)
  		console.log('[X] PLAYER', id)
  },

  loadOtherPlayers: function(players)
  {
	if (Core.io_debug)
		console.log('Player.LoadOtherPlayers', Object.keys(players).length)
	
	for (id in players)
	{
		if (!players.hasOwnProperty(id))
			continue

		if (id == this.entity.id)
			continue

		EnemyController.set(id, players[id], 'black')
	}
  },
  
  init: function ()
  {
  	// url, pos, size, speed, frames, dir, once
  	this.sprite = new SpriteSheet(['stand', 'walk'], 'player')
  	this.entity = new Entity({
		X: 220,
		Y: 270,
		alias: 'player',
		width: 32,
		height: 32,
		color: '#00A',
		sprite: this.sprite
  	})
  },

  update: function(dt){
  	this.captureCurrentPoint()

  	if(input.isDown('DOWN') || input.isDown('s'))
    {
    	ms = this.movement.max_speed / this.movement.aceleration
    	this.movement.y_aceleration += ms
    }

    if(input.isDown('UP') || input.isDown('w'))
    {
    	ms = this.movement.max_speed / this.movement.aceleration
    	this.movement.y_aceleration -= ms
    }

    if ((this.movement.y_speed > 0 && !(input.isDown('DOWN') || input.isDown('s')))
    	|| (this.movement.y_speed < 0 && !(input.isDown('UP') || input.isDown('w'))))
    {
    	this.movement.y_speed = 0
    	this.movement.y_aceleration = 0
    }

	this.movement.y_speed = this.movement.y_aceleration * dt * 1000
    if (Math.abs(this.movement.y_speed) > this.movement.max_speed)
    	this.movement.y_speed = this.movement.max_speed * this.movement.y_speed/Math.abs(this.movement.y_speed)




  	if(input.isDown('RIGHT') || input.isDown('d'))
    {
    	ms = this.movement.max_speed / this.movement.aceleration
    	this.movement.x_aceleration += ms
    }

    if(input.isDown('LEFT') || input.isDown('a'))
    {
    	ms = this.movement.max_speed / this.movement.aceleration
    	this.movement.x_aceleration -= ms
    }

    if ((this.movement.x_speed > 0 && !(input.isDown('RIGHT') || input.isDown('d')))
    	|| (this.movement.x_speed < 0 && !(input.isDown('LEFT') || input.isDown('a'))))
    {
    	this.movement.x_speed = 0
    	this.movement.x_aceleration = 0
    }

	this.movement.x_speed = this.movement.x_aceleration * dt * 1000
	if (Math.abs(this.movement.x_speed) > this.movement.max_speed)
    	this.movement.x_speed = this.movement.max_speed * this.movement.x_speed/Math.abs(this.movement.x_speed)
    
    var player = _players.get(this.id)
    if (player)
    {
    	var point = {
	    	X: player.X+this.movement.x_speed,
	    	Y: player.Y+this.movement.y_speed,
	    }
	    var theresDiff = this.thereIsPointsDifference(point)
	    _players.set(this.id, point, theresDiff)
    }

    // Shoot thing
    if (input.isDown("SPACE") || MouseController.click)
    {
		WeaponController.shoot(dt);
    }

    // Change weapon
    if (input.isDown("x"))
    {
    	WeaponController.switchWeapon(true)
    }
    if (input.isDown("z"))
    {
    	WeaponController.switchWeapon(false)
    }
    // Reload weapon
    if (input.isDown("r"))
    {
    	WeaponController.reload()
    }

    // Toggle debug
    if (input.isDown("q"))
    {
    	if (typeof Core.debugChange == 'undefined'
    		|| Date.now() - Core.debugChange >= 350)
    	{
    		Core.debug = !Core.debug
    		Core.debugChange = Date.now()
    	}
    }

    if (this.movement.x_speed != 0 || this.movement.y_speed != 0)
    	this.sprite.set('walk')
    else
    	this.sprite.set('stand')
	
    this.sprite.get().update(dt);


	this.dontFallOut(dt);
  	
  	this.updateAllowItemGrabbable()
  },

  getPoint: function(data)
  {
  	// TODO FIX controllers init before Modules ready
  	if (data)
  		return {X: data.X, Y: data.Y}
  	else return {X: 0, Y: 0}
  },

  capturedPoint: {},
  captureCurrentPoint: function ()
  {
	this.capturedPoint = this.getPoint(_players.get(this.id))
  },

  thereIsPointsDifference: function(point)
  {
  	return this.capturedPoint.X != point.X
		|| this.capturedPoint.Y != point.Y
  },
  

  getDrawEntityModel: function(id, player) {
  		var drawEntityModel = {
			X: player.X,
			Y: player.Y,
			alias: id,
			width: 32,
			height: 32,
			color: '#00A',
			sprite: this.sprite
	  	}
	  	if (id != this.id)
	  		drawEntityModel.color = 'red'
	  	return drawEntityModel
	},

  draw: function(ctx) {
  	// this.entity.draw(ctx)
  	var players = _players.get()
  	
  	StackMaster.loop(players, function(id, player){
		DrawEntity.draw('players', ctx, this.getDrawEntityModel(id, player))
  	}, this)
  },

  updateAllowItemGrabbable: function()
  {
	if(this.hitItemId && ItemController.getItem(this.hitItemId))
	{
		ItemController.getItem(this.hitItemId).allowGrabbable()
		ItemController.getItem(this.hitItemId).hit(PlayerController)
		this.hitItemId = null
	}
  },

  dontFallOut: function(dt) {
	if (this.entity.X > Core.data.canvas.width - this.entity.width)
		this.entity.X = Core.data.canvas.width - this.entity.width
	if (this.entity.Y > Core.data.canvas.height - this.entity.height)
		this.entity.Y = Core.data.canvas.height - this.entity.height
	if (this.entity.X < 0)
		this.entity.X = 0
	if (this.entity.Y < 0)
		this.entity.Y = 0
  },

  hitItemId: null,
  hit: function (by, id)
  {
  	if (by == Item)
  	{
    	this.hitItemId = id
  	}
  },
};


/*==========================================================================================
=            #HIT      CONTROLLER            ==============================================
==========================================================================================*/

var HitController = {
	collides: function (x, y, r, b, x2, y2, r2, b2) {
    	return !(r <= x2 || x > r2 || b <= y2 || y > b2);
	},

	boxCollides: function (entity1, entity2) {
    	return this.collides(entity1.X, entity1.Y,
            entity1.X + entity1.width, entity1.Y + entity1.height,
            entity2.X, entity2.Y,
            entity2.X + entity2.width, entity2.Y + entity2.height);
	},

	update: function (dt)
	{
		this.checkItemsPlayerHit(dt)
	},

	checkItemsPlayerHit: function ()
	{
		return 0;
		var items = ItemController.getStack()

		for (id in items)
		{
			if (!items.hasOwnProperty(id))
				continue;
			var item = items[id]
			if (this.boxCollides(PlayerController.entity, item.entity))
			{
				PlayerController.hit(Item, id)
			}
		}
	},

	checkLinesEnemiesHit: function(lines)
	{
		var enemies = EnemyController.getStack()
		var hit = false
		for (id in enemies)
		{
			if (!enemies.hasOwnProperty(id))
				continue
			hit = hit || this.checkLinesEnemyHit(lines, enemies[id])
		}
		return hit
	},

	checkLinesEnemyHit: function (lines, enemy)
	{
		var shapePoints = enemy.entity.getPoints()
		
		for (id in lines)
		{
			if (!lines.hasOwnProperty(id))
				continue;
			var line = lines[id]

			if (this.checkLineShapePointsHit(line, shapePoints))
			{
				return true
			}
		}
		
		return false
	},

	checkBulletsHit: function(bullets)
	{
		this.checkBulletsEnemiesHit(bullets)
		this.checkBulletsPlayerHit(bullets)
	},

	checkBulletsPlayerHit: function (bullets)
	{
		var id = PlayerController.entity.id
		var shapePoints = PlayerController.entity.getPoints()
		var inflictedDamage = this.getInflictedDamageBulletsShapePointsHit(bullets, shapePoints, id)
		
		if (inflictedDamage)
		{
			var first_bullet = Object.keys(bullets)[0]
			var shooter_id = bullets[first_bullet].shooter_id
			var shootLength = this.getShootLength(EnemyController.get(shooter_id))
			
			ShootController.killBullets(bullets)
			var player = PlayerController

			// Take Damage
			var totalDamage = UIController.damage(inflictedDamage);
			if (totalDamage.shield > 0)
				itHadShield = true
			else
				itHadShield = false
			HitTextController.create(player.entity.center().X, player.entity.center().Y, inflictedDamage, true)
		}
	},

	checkBulletsEnemiesHit: function(bullets)
	{
		var enemies = EnemyController.getStack()
		var enemyTarget = {
			length: 10**9,
			enemy: null,
			damage: 0,
		}
		for (id in enemies)
		{
			if (!enemies.hasOwnProperty(id))
				continue
			var enemy = enemies[id]
			var posibleInflictedDamage = this.getInflictedDamageBulletsShapePointsHit(bullets, enemy.entity.getPoints(), enemy.entity.id)

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
		}
		// Check if we hit something
		if (enemyTarget.enemy)
		{
			// TODO this should not work but it works wtf
			ShootController.killBullets(bullets)
			enemyTarget.enemy.getHitted(enemyTarget.damage, shoot.weapon.id)
		}
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

			if (shoot.alive && this.checkLineShapePointsHit(shoot, shapePoints))
			{
				// Enemy cant hurt himself
				if (shoot.shooter_id == shapePoints_id)
					continue

				// BULLET HITTED ON ONE OR MULTIPLE ENEMIES
				inflictedDamage += bulletDamage
			}
		}
		
		return inflictedDamage
	},

	checkLineShapePointsHit: function (bullet, points)
	{
		var hit = false
		
		for (i = 1; i < points.length; i++)
			hit = hit || this.isColliding(bullet.from, bullet.to, points[i-1], points[i])
		
		return hit
	},

	getShootLength: function(enemy)
	{
		// where dx is the difference between the x-coordinates of the points
		// and  dy is the difference between the y-coordinates of the points
		// sqrt(dx^2 + dy^2)
		var dx = PlayerController.entity.center().X - enemy.entity.center().X
		var dy = PlayerController.entity.center().Y - enemy.entity.center().Y
		return Math.sqrt(dx**2 + dy**2)
	},

	isColliding: function (a, b, c, d)
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

/*==========================================================================================
=            #TEXT CONTROLLER                 ==============================================
==========================================================================================*/

var TextController = {
	
	getDefaultSettings: function(){
		return {
				X:0,
				Y:25,
				font: 'Russo One',
				size: 12,
				baseline:'middle',
		  		align: 'left',
				fill: 'white',
				stroke: null,
				lineWidth: 2,
				text: 'hello',
			}
	},
	stack: [],

	create: function(settings)
	{
		this.stack.push(Object.assign(this.getDefaultSettings(), settings))
	},

	draw: function(ctx)
	{
		for (id in this.stack)
		{
			if (!this.stack.hasOwnProperty(id))
				continue
			this.drawLoop(ctx, this.stack[id])
		}
		this.stack = []
	},

	drawLoop: function(ctx, t)
	{
		ctx.save()
		ctx.translate(t.X, t.Y)
		ctx.font = t.size+'px '+t.font
		ctx.textBaseline = t.baseline
		ctx.textAlign = t.align
		ctx.fillStyle = t.fill
		ctx.strokeStyle = t.stroke
		ctx.lineWidth = t.lineWidth
		if (t.fill)
			ctx.fillText(t.text, 0, 0)
		if (t.stroke)
			ctx.strokeText(t.text, 0, 0)
		ctx.restore()
	}
}


/*==========================================================================================
=            #HIT TEXT CONTROLLER             ==============================================
==========================================================================================*/


var HitTextController = {
	stack: [],

	lifetime: 650,

	angle: 0,
	angleIncrement: 30 * Math.PI / 180,
	angleMax: 3,
	create: function (x, y, text, shield)
	{
		var angle = this.angleIncrement*-2 + this.angleIncrement*this.angle;
		this.angle = (this.angle > this.angleMax)?0:this.angle+1

		this.stack.push({
			X: x,
			Y: y,
			text: text,
			shield: shield,
			created_at: Date.now(),
			angle: angle
		})
	},

	draw: function (ctx)
	{
		for (var id in this.stack) {
			if (this.stack.hasOwnProperty(id)) {
				if (Date.now() - this.stack[id].created_at > this.lifetime)
					this.stack.splice(id, 1)
				else
					this.loopDraw(ctx, id, this.stack[id])
			}
		}
	},
	
	loopDraw: function (ctx, id, hitt)
	{
		var text = hitt.text;
		ctx.save();
		ctx.translate(hitt.X, hitt.Y);
		ctx.rotate(hitt.angle);


		alpha = 1 - (Date.now() - hitt.created_at) / this.lifetime
		
		ctx.font = "13px Russo One";
		
		if (hitt.shield)
		{
			ctx.strokeStyle = 'rgba(15, 126, 175, '+alpha+')'
			ctx.fillStyle = 'rgba(0, 255, 255, '+alpha+')'
		} else {
			ctx.strokeStyle = 'rgba(80, 80, 80, '+alpha+')'
			ctx.fillStyle = 'rgba(255, 255, 225, '+alpha+')'
		}
		
		ctx.lineWidth = 2;
		ctx.strokeText(text, 0, -20);
		ctx.fillText(text, 0, -20);


		ctx.restore();
	}

}


/*==========================================================================================
=            #ENEMY CLASS                      =============================================
==========================================================================================*/

function Enemy (entity)
{
	this.entity = entity

	this.getHitted = function (gunDamage, weapon_id)
	{
		var hitLength = HitController.getShootLength(this)
		var weapon = WeaponController.getWeapon(weapon_id)

		fixTotalLength = PlayerController.entity.width/2 + this.entity.width/2
		totalLength = weapon.get('length')
		lostDamage = gunDamage /totalLength * (hitLength-fixTotalLength)
		lostDamage = lostDamage * weapon.get('maxLostDamageRate')
		damage = (gunDamage - lostDamage)
		if (damage < 1)
			damage = 1
		damage = Math.ceil(damage/weapon.get('lostDamageRoundBy'))*weapon.get('lostDamageRoundBy'); // round every 5
		
		if (damage > gunDamage)
			damage = gunDamage

		HitTextController.create(this.entity.center().X, this.entity.center().Y, damage, true)
	}
}


/*==========================================================================================
=            #ENEMY CONTROLLER                 =============================================
==========================================================================================*/


var EnemyController = {
	
	stack: {},

	get: function(id)
	{
		if (this.stack.hasOwnProperty(id))
			return this.stack[id]
		return false
	},

	deleteById: function(id)
	{
		if (this.stack.hasOwnProperty(id))
		{
			delete this.stack[id]
		}
	},

	set: function (id, point, color)
	{
		// if (Core.io_debug)
		// 	console.log('ENEMY', id, point)

		if (this.stack.hasOwnProperty(id))
		{
			// Update POS
			this.stack[id].entity.X = point.X
			this.stack[id].entity.Y = point.Y
		} else {
			// Create POS
			this.stack[id] = new Enemy(new Entity({
				id: id,
				X: point.X,
				Y: point.Y,
				color: color,
				sprite: new SpriteSheet(['enemy.stand'])
			}))
		}
	},

	draw: function(ctx)
	{
		for (id in this.stack)
		{
			if (!this.stack.hasOwnProperty(id))
				continue;
			this.drawLoop(ctx, id, this.stack[id])
		}
	},

	getStack: function()
	{
		return this.stack
	},

	drawLoop: function (ctx, id, enemy)
	{
		enemy.entity.draw(ctx)
	},
}



/*==========================================================================================
=            #MOUSE CONTROLLER                 =============================================
==========================================================================================*/


var MouseController = {
	X: 0,
	Y: 0,
	click: false,

	init: function() {
		$(Core.data.canvas).mousedown(function (e) {
		    MouseController.click = true
		});

		$(Core.data.canvas).mousemove(function (e) {
		    MouseController.X = e.pageX - $(this).offset().left
		    MouseController.Y = e.pageY - $(this).offset().top
		});

		$(Core.data.canvas).mouseup(function (e) {
		    MouseController.click = false
		});
	    
	    $(Core.data.canvas).mouseleave(function (e) {
		    MouseController.click = false
		});
	}

}


/*==========================================================================================
=            #RESOURCES #INIT                  =============================================
==========================================================================================*/
$(document).ready(function(){
	registerModules()
	resources.load([
	    'assets/gui.png',
	    'assets/player.png',
	    'assets/gun.png',
	]);
	resources.onReady(function(){
		var Controllers = [
				Socket,
				MouseController,
				SpriteController,
				HitController,
				InventoryController,

				WeaponController,
				
				ItemController,

				ShootController,
				EnemyController,
				PlayerController,
				

				AimController,
				TextController,
				UIController,
			]
		Core.init(document.getElementById('canshoot'), Controllers)
	});
});

/*=============================================
=            #SOCKET #IO                      =
=============================================*/
var Socket = {

	io: null,
	init: function()
	{
		this.io = io()

		this.io.on('id', function(id){
			PlayerController.setId(id)
		})

		this.io.on('sync', function(data) {
			var module = StackModuleMaster.get(data.module_id)

			// syncInput sometimes is undefined
			if (module)
				module.syncInput(data)
			// console.log('PULL', module_id, value_id, id, value)
		})
	}
}

var registerModules = (function(){
	StackModuleMaster.clientSide = true;

	// TODO CLEAR PROPERTIES GET FROM SERVER
	_players = StackModuleMaster.create('players', [
			new Property('id', 0),
			new Property('X', 0, true),
			new Property('Y', 0, true)
		])

	_items = StackModuleMaster.create('items', [
			new Property('id', 0),
			new Property('X', 0, true),
			new Property('Y', 0, true),
			new Property('grabbable', false, true),
			new Property('grabbed_by', null, true),
		])

	_inventory = StackModuleMaster.create('inventory', [
			new Property('id', null),
			new Property('items', {}, true),
			new Property('current', null, true),
		])

	_players.getSocket = _items.getSocket = function(id){
		return Socket.io
	}
})



/*
#CLIENT
	-> Input
		-> Route to ModuleMaster.Input
	-> Output
		-> ModuleMaster.sync (module_id, value_id, id)
#SERVER
	-> Input
		-> socket.on('sync')
			-> master.sync(module_id, value_id, id, value)
	-> Output
		-> ModuleMaster.sync (module_id, value_id, id)

#################
###### NOW ######
#################

#CLIENT
	-> Input
		-> this.io.on('sync')
	-> Output
		-> ModuleMaster.sync (module_id, value_id, id)
#SERVER
	-> Input
		-> socket.on('sync')
			-> master.sync(module_id, value_id, id, value)
	-> Output
		-> ModuleMaster.sync (module_id, value_id, id)


*/