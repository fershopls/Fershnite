/* 
 * MATH DESTRUCTION!!
 * */


/*==========================================================================================
=            #CORE CONTROLLER                  =============================================
==========================================================================================*/

var Core = {

	debug: false,
	modules: [],

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
			'rifle': new sound("assets/shoot.mp3"),
			'shotgun': new sound("assets/shotgun.mp3"),
			'smg': new sound("assets/smg.mp3"),
			},
			weapon: new sound("assets/switch_weapon.mp3"),
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
		for (var id in this.modules) {
			if (this.modules.hasOwnProperty(id)) {
				if (this.modules[id].hasOwnProperty('draw'))
				{
					this.modules[id].draw(ctx, canvas)
				}
			}
		}
	},


}


/*==========================================================================================
=            #SPRITE ClASS                     =============================================
==========================================================================================*/
function SpriteSheet (stack)
{
	for (id in stack)
	{
		if (stack.hasOwnProperty(id))
		{
			// 
		}
	}

	this.stack = stack
	this.currentId = null;

	this.set = function(id)
	{
		if (stack.hasOwnProperty(id))
		{
			this.currentId = id;
		}
	}

	this.get = function (id)
	{
		if (id && stack.hasOwnProperty(id))
			return this.stack[id]
		return this.stack[this.currentId]
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
=            #RESOURCES #INIT                  =============================================
==========================================================================================*/
$(document).ready(function(){
	resources.load([
	    'assets/guns/shotgun.png',
	    'assets/gui.png',
	    'assets/player.png',
	    'assets/gun.png',
	]);
	resources.onReady(function(){
		Core.init(document.getElementById('canshoot'),
			[
				MouseController,
				ShootController,
				WeaponController,
				
				EnemyController,
				PlayerController,
				

				AimController,
				PlayerUIController,
			])
	});
});



/*==========================================================================================
=            #AIM CONTROLLER                   =============================================
==========================================================================================*/


var AimController = {
	
	getPivot: function()
	{
		return PlayerController.center()
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

	getMouseAngle: function ()
	{
		return this.getAngleFromTo(this.getPivot().X, this.getPivot().Y, MouseController.X, MouseController.Y)
	},

	draw: function(ctx)
	{
		var weapon = WeaponController.getCurrentWeapon()
	    
	    var fillStyle = weapon.getRGBColor();
	    
	    this.drawCursor(ctx, fillStyle)
	    this.drawBloomArea(ctx, weapon)
	},

	lineToAngleWithRelativeBloom: function(pivot, length, angle, abs_bloom, rel_bloom)
	{
		return this.getToByAngle(pivot.X, pivot.Y, length, angle + (abs_bloom/2 * rel_bloom))
	},

	drawBloomArea: function (ctx, weapon)
	{
		var angle = this.getMouseAngle();
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
			ctx.stroke()

		// Do hit test lines
		var isCollidingWithEnemy = false;
		for (id in hitTests)
		{
			if (hitTests.hasOwnProperty(id))
			{
				var ht = hitTests[id]
				if (EnemyController.checkBulletCollide(ht))
					isCollidingWithEnemy = true;
			}
		}
		
		// Draw area shape

		ctx.beginPath()
		ctx.moveTo(this.getPivot().X, this.getPivot().Y);
		ctx.lineTo(to[0].X, to[0].Y);
		ctx.lineTo(to[1].X, to[1].Y);
		ctx.lineTo(to[2].X, to[2].Y);
		ctx.lineTo(this.getPivot().X, this.getPivot().Y);

		ctx.fillStyle = 'rgba(255,255,255,0.25)'
		if (isCollidingWithEnemy)
		{
			PlayerController.shoot()
			if (Core.debug)
				ctx.fillStyle = 'rgba(255,0,0,0.5)'
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
	create: function(x, y, mouse_x, mouse_y, weapon)
	{
		var root_angle = AimController.getMouseAngle();
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
			var bullet = this.createBullet(x, y, to.X, to.Y, weapon)
			bullets.push(bullet)
		}
		EnemyController.checkBullets(bullets)
	},

	createBullet: function (x, y, to_x, to_y, weapon)
	{
		shoot = {
			from: {X:x, Y:y},
			to: {X:to_x, Y:to_y},
			time: Date.now(),
			weapon: weapon,
		}

		this.stack[this.makeUniqueId()] = shoot
		return shoot;
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
		if(shoot.weapon.get('lifetime') != 0 && shoot.time + shoot.weapon.get('lifetime') < Date.now())
	    {
			delete this.stack[id];
	    }
	},

	loopDraw: function (ctx, id, shoot)
	{
		if (Core.debug)
			this.drawTrigometricThing(ctx, shoot);
    	var weapon = shoot.weapon;
    	color_percent = 1 - (Date.now() - shoot.time) / weapon.get('lifetime')

		ctx.beginPath();
		ctx.strokeStyle = weapon.getRGBAColor(color_percent);
		ctx.moveTo(shoot.from.X, shoot.from.Y);
		ctx.lineTo(shoot.to.X, shoot.to.Y);
		ctx.stroke();

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
=            #PLAYER UI CONTROLLER             =============================================
==========================================================================================*/


var PlayerUIController = {
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
		this.sprite = new SpriteSheet({
	  		rifle: new Sprite('assets/gun.png', [64*2, 0], [64*2, 64], 1, [0], 'vertical'),
	  		shotgun: new Sprite('assets/gun.png', [64*2, 0], [64*2, 64], 1, [1], 'vertical'),
	  		smg: new Sprite('assets/gun.png', [64*2, 0], [64*2, 64], 1, [2], 'vertical'),
		})
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
  		this.drawItemSolt(ctx);
	},

	drawGUI: function(ctx)
	{
		ctx.drawImage(resources.get('assets/gui.png'), 0, 0);
	},

	drawItemSolt: function(ctx)
	{
		ctx.save()
		ctx.translate(94, Core.data.canvas.height - 76)
		this.sprite.get(WeaponController.getCurrentWeaponId()).render(ctx)
		ctx.restore()
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
			
			damage: 20,
			maxLostDamageRate: .75,
			lostDamageRoundBy: 1,

			color: [0,0,0],
			length: 300,
			perdigons: 1,
			bloom: 40,
			fireRate: 500,

			lifetime: null,
		}
		defaultSettings = Object.assign(defaultSettings, {
			lifetime: defaultSettings.fireRate
		})

		this.settings = Object.assign(defaultSettings, settings);
	}
	this.init();
	

	this.get = function(key) {
		var value = null;
        if (this.settings.hasOwnProperty(key))
			value = this.settings[key]
    	if (this.getter.hasOwnProperty(key))
    		return this.getter[key](this, value)
    	return value

    	console.log('NO PROPERTY',key)
    }

    this.getter = {
    	// Lifetime equals to fireRate
    	lifetime: function(weapon, value)
    	{
    		return weapon.get('fireRate')
    	},
    	// Return bloom in RADIANS
    	bloom: function (weapon, value)
    	{
    		return value * Math.PI / 180
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
=            #WEAPON CONTROLLER                =============================================
==========================================================================================*/


var WeaponController = {
	data: {
		current: 'smg',
		lastSwitchTime: 0,
	  	lastWeapon: null,
	  	minSwitchTime: 700,
	},
	weapons: [],

	init: function()
	{
		this.weapons = this.loadWeapons()
	},

	getCurrentWeaponId: function ()
	{
		return this.data.current
	},

	getCurrentWeapon: function ()
	{
		var weapon = this.getWeapon(this.getCurrentWeaponId())
		if (weapon)
			return weapon
		else
			console.log('Cant get current') // GET FIRST WEAPON AND SET ASS CURRENT
	},

	getWeapon: function(id)
	{
		if (this.weapons.hasOwnProperty(id))
			return this.weapons[id]
		else
			return console.log('Weapon',id,'not found in',this.weapons)
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

	nextWeapon: function()
	{
		if (Date.now() - this.data.lastSwitchTime < this.data.minSwitchTime) return false;
		var keys = Object.keys(this.weapons);
		var index = keys.indexOf(this.getCurrentWeaponId())

		next = index +1
		if (typeof keys[next] == 'undefined')
			next = 0


		this.setWeapon(keys[next])
		this.data.lastSwitchTime = Date.now()
		Core.sound.weapon.play()
	},

	loadWeapons: function()
	{
		var weapons = {
			shotgun: {
				perdigons: 10,
				damage: 20,
				fireRate: 975,
				bloom: 40,
				length: 250,
				color: [0,0,255],
				maxLostDamageRate: 1.5,
				lostDamageRoundBy: 4,
			},
			rifle: {
				perdigons: 1,
				damage: 30,
				fireRate: 250,
				bloom: 5,
				length: 400,
				color: [255,0,255],
				maxLostDamageRate: .50,
				lostDamageRoundBy: 6,
			},
			smg: {
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
		for (id in weapons)
		{
			if (weapons.hasOwnProperty(id))
			{
				weaponObjects[id] = new Weapon(weapons[id])
			}
		}
		return weaponObjects;
	}
}


/*==========================================================================================
=            #PLAYER CONTROLLER                =============================================
==========================================================================================*/


var PlayerController = {
  color: "#00A",
  X: 220,
  Y: 270,
  width: 32,
  height: 32,
  movement: {
  	x_speed: 0, // current speed
  	y_speed: 0, 
  	max_speed: 160, // max px per sec
  	aceleration: 10, // speed to max_speed in ms 
  },
  lastFireTime: 0,
  center: function()
  {
  	return {
  		X: this.X + this.width/2,
  		Y: this.Y + this.height/2,
  	}
  },
  sprite: [],
  init: function ()
  {
  	// url, pos, size, speed, frames, dir, once
  	this.sprite = new SpriteSheet({
	  	stand: new Sprite('assets/player.png', [0, 0], [32, 32], 6, [0]),
	  	walk: new Sprite('assets/player.png', [0, 0], [32, 32], 30, [0, 1, 2, 3, 2, 1]),
  	})
  	this.sprite.set('stand')
  },

  update: function(dt){
  	if(input.isDown('DOWN') || input.isDown('s'))
    {
    	ms = this.movement.max_speed / this.movement.aceleration
    	this.movement.y_speed += ms * dt
    }

    if(input.isDown('UP') || input.isDown('w'))
    {
    	ms = this.movement.max_speed / this.movement.aceleration
    	this.movement.y_speed -= ms * dt
    }

    if ((this.movement.y_speed > 0 && !(input.isDown('DOWN') || input.isDown('s')))
    	|| (this.movement.y_speed < 0 && !(input.isDown('UP') || input.isDown('w'))))
    {
    	this.movement.y_speed = 0
    }

    this.Y += this.movement.y_speed




  	if(input.isDown('RIGHT') || input.isDown('d'))
    {
    	ms = this.movement.max_speed / this.movement.aceleration
    	this.movement.x_speed += ms * dt
    }

    if(input.isDown('LEFT') || input.isDown('a'))
    {
    	ms = this.movement.max_speed / this.movement.aceleration
    	this.movement.x_speed -= ms * dt
    }

    if ((this.movement.x_speed > 0 && !(input.isDown('RIGHT') || input.isDown('d')))
    	|| (this.movement.x_speed < 0 && !(input.isDown('LEFT') || input.isDown('a'))))
    {
    	this.movement.x_speed = 0
    }

    this.X += this.movement.x_speed



    // Shoot thing
    if (input.isDown("SPACE") || MouseController.click)
    {
    	this.shoot(dt)
    }

    // Change weapon
    if (input.isDown("x"))
    {
    	WeaponController.nextWeapon()
    }

    // Toggle debug
    if (input.isDown("z"))
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


	this.hits(dt);
  },

  draw: function(ctx) {
  	ctx.save();
    ctx.translate(this.X, this.Y);
    this.sprite.get().render(ctx);
    ctx.restore();

    ctx.fillStyle = 'rgba(0,0,255,0.4)';
    if (Core.debug)
    	ctx.fillRect(this.X, this.Y, this.width, this.height);
  },
  hits: function(dt) {
	if (this.X > Core.data.canvas.width - this.width)
		this.X = Core.data.canvas.width - this.width
	if (this.Y > Core.data.canvas.height - this.height)
		this.Y = Core.data.canvas.height - this.height
	if (this.X < 0)
		this.X = 0
	if (this.Y < 0)
		this.Y = 0

	// EnemyController hit
	var rect1 = {x: this.X, y: this.Y, width: this.width, height: this.height}
	var rect2 = {x: EnemyController.X, y: EnemyController.Y, width: EnemyController.width, height: EnemyController.height}

	// if (rect1.x < rect2.x + rect2.width &&
	//    rect1.x + rect1.width > rect2.x &&
	//    rect1.y < rect2.y + rect2.height &&
	//    rect1.height + rect1.y > rect2.y) {
	//     console.log('collide')
	// }
  },

  shoot: function() {
  	if (Date.now() - this.lastFireTime >= WeaponController.getCurrentWeapon().get('fireRate'))
	{
		ShootController.create(this.center().X, this.center().Y,
			MouseController.X, MouseController.Y,
			WeaponController.getCurrentWeapon())
    	
    	this.lastFireTime = Date.now()
		Core.sound.fire[WeaponController.getCurrentWeaponId()].play();
	}
  },
};


/*==========================================================================================
=            #HIT TEXT CONTROLLE              ==============================================
==========================================================================================*/


var HitTextController = {
	stack: [],

	lifetime: 650,
	heightPadding: 30,
	widthPadding: 50,

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
		ctx.strokeText(text, 0, -45);
		ctx.fillText(text, 0, -45);


		ctx.restore();
	}

}


/*==========================================================================================
=            #ENEMY CONTROLLER                 =============================================
==========================================================================================*/


var EnemyController = {
	X: 320,
	Y: 120,
	width: 50,
	height: 50,
	color: 'red',
	
	center: function()
	{
		return {
			X: this.X + this.width/2,
			Y: this.Y + this.height/2,
		}
	},

	draw: function (ctx)
	{
	    ctx.fillStyle = this.color;
	    ctx.fillRect(this.X, this.Y, this.width, this.height);
	},

	checkBullets: function (bullets)
	{
		var damage = 0
		for (id in bullets)
		{
			if (bullets.hasOwnProperty(id)) {
				var hit = this.checkBulletCollide(bullets[id])
				if (hit)
				{
					damage += bullets[id].weapon.get('damage')
				}
			}
		}
		
		if (damage) this.getHitted(damage)
	},

	checkBulletCollide: function (bullet)
	{
		var vec = this.getRectVectors()
		
		var hit = this.isColliding(bullet.from, bullet.to, vec[0], vec[1])
		hit = hit || this.isColliding(bullet.from, bullet.to, vec[1], vec[2])
		hit = hit || this.isColliding(bullet.from, bullet.to, vec[2], vec[3])
		hit = hit || this.isColliding(bullet.from, bullet.to, vec[3], vec[0])

		return hit
	},

	getHitted: function (gunDamage)
	{
		var hitLength = this.getLengthShoot()
		var weapon = WeaponController.getCurrentWeapon()

		fixTotalLength = PlayerController.width/2 + this.width/2
		totalLength = weapon.get('length')
		lostDamage = gunDamage /totalLength * (hitLength-fixTotalLength)
		lostDamage = lostDamage * weapon.get('maxLostDamageRate')
		damage = (gunDamage - lostDamage)
		if (damage < 1)
			damage = 1
		damage = Math.ceil(damage/weapon.get('lostDamageRoundBy'))*weapon.get('lostDamageRoundBy'); // round every 5
		
		if (damage > gunDamage)
			damage = gunDamage

		var totalDamage = PlayerUIController.damage(damage);
		if (totalDamage.shield > 0)
			itHadShield = true
		else
			itHadShield = false
		HitTextController.create(this.X + this.width/2, this.Y + this.height/2, damage, itHadShield)
	},

	getLengthShoot: function()
	{
		// where dx is the difference between the x-coordinates of the points
		// and  dy is the difference between the y-coordinates of the points
		// sqrt(dx^2 + dy^2)
		var dx = PlayerController.center().X - this.center().X
		var dy = PlayerController.center().Y - this.center().Y
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

	getRectVectors: function ()
	{
		return [
			{X:this.X,Y:this.Y},
			{X:this.X,Y:this.Y + this.height},
			{X:this.X + this.width,Y:this.Y + this.height},
			{X:this.X + this.width,Y:this.Y},
		];
	}
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