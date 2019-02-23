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
				'weapon.rifle': new sound("/assets/shoot.mp3"),
				'weapon.shotgun': new sound("/assets/shotgun.mp3"),
				'weapon.smg': new sound("/assets/smg.mp3"),
				'weapon.hands': new sound("/assets/hands.mp3"),
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
		DrawHandler.clear()
		DrawHandler.drawGrid()
		DrawHandler.drawBackground();
		
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
=            #SPRITESHEET HANDLER              =============================================
==========================================================================================*/
var SpriteSheet = {
	currentId: null,

	init: function (sprites, prefix) {
		var SpritesheetInstance = Object.assign({}, this)
		SpritesheetInstance.stack = {},
		SpritesheetInstance.getStack = function()
		{
			return this.stack
		}
		SpritesheetInstance.initProperties(sprites, prefix)
		return SpritesheetInstance
	},

	initProperties: function (sprites, prefix)
	{
		for (id in sprites)
		{
			if (!sprites.hasOwnProperty(id))
				continue

			var full_id = this.getPrefix(prefix) + sprites[id]
			var sprite = SpriteHandler.sprite(full_id)
			this.getStack()[full_id] = sprite
		}
	},

	getPrefix: function(prefix)
	{
		if (prefix)
			return prefix + '.'
		return ''
	},

	set: function(id)
	{
		if (this.getStack().hasOwnProperty(id))
		{
			this.currentId = id;
		}
	},

	get: function (id)
	{
		var current_id = this.getCurrentId()
		
		if (typeof id != 'undefined')
			current_id = id
		
		var x = this.getStack()[current_id]
		if (typeof x == 'undefined')
			console.log('get undefined', current_id)
		return x
	},

	getCurrentId: function()
	{
		if (!this.currentId && Object.keys(this.getStack()).length > 0)
			this.currentId = Object.keys(this.getStack())[0]
		
		return this.currentId
		
	}
}





/*==========================================================================================
=            #SPRITE CONTROLLER                =============================================
==========================================================================================*/

var SpriteHandler = Object.assign({}, StackMaster, {

	stack: {},
	sprites: {},
	spritesheets: {},

	getStack: function()
	{
		return this.stack
	},

	init: function()
	{
		this.sprites = this.getAvailableSprites()
		this.spritesheets = this.getAvailableSpritesheets()
	},

	getAvailableSpritesheets: function ()
	{
		// TODO FIX SAME SPRITESHEET FOR ALL OBJECTS TYPE
		return {
			'player': SpriteSheet.init([
					'player.stand',
					'player.walk'
				]),
			'item': SpriteSheet.init([
					'weapon.shotgun',
					'weapon.rifle',
					'weapon.smg',
					'weapon.hands',
					'ammo.box',
				]),
		}
	},

	getAvailableSprites: function ()
	{
		return {
			'weapon.shotgun': new Sprite('assets/gun.png', [64*2, 0], [64*2, 64], 1, [1], 'vertical'),
			'weapon.rifle': new Sprite('assets/gun.png', [64*2, 0], [64*2, 64], 1, [0], 'vertical'),
			'weapon.smg': new Sprite('assets/gun.png', [64*2, 0], [64*2, 64], 1, [2], 'vertical'),
			'weapon.hands': new Sprite('assets/gun.png', [64*2, 0], [64*2, 64], 1, [3], 'vertical'),

			'player.stand': new Sprite('assets/player.png', [0, 0], [32, 32], 6, [0]),
			'player.walk': new Sprite('assets/player.png', [0, 0], [32, 32], 30, [0, 1, 2, 3, 2, 1]),

			'ammo.box': new Sprite('assets/gun.png', [64*2, 0], [64*2, 64], 1, [4], 'vertical'),
		}
	},

	sprite: function(id)
	{
		if (this.sprites.hasOwnProperty(id))
			return this.sprites[id]
		console.log("SPRITE missing",id,'in',Object.keys(this.sprites))
		return false
	},

	spritesheet: function(id)
	{
		if (this.spritesheets.hasOwnProperty(id))
			return this.spritesheets[id]
		console.log("SPRITESHEET missing",id,'in',Object.keys(this.spritesheets))
		return false
	},

	getObjectIdSpritesheet: function(object_id, spritesheet_id)
	{
		if (!this.get(object_id))
			this.register(object_id, spritesheet_id)
		
			return this.get(object_id)
	},

	register: function (object_id, spritesheet_id)
	{
		this.set(object_id, this.spritesheet(spritesheet_id))
	},

	setSprite: function (object_id, sprite_spritesheet_id)
	{
		if (this.get(object_id))
			this.get(object_id).set(sprite_spritesheet_id)
	},
	
	updateSprite: function (object_id, dt)
	{
		if (this.get(object_id))
			this.get(object_id).get().update(dt)
	},

	draw: function(object_id, x, y, spritesheet_id)
	{
		var spritesheet = this.getObjectIdSpritesheet(object_id, spritesheet_id)

		spritesheet.get().render(Core.data.ctx)
	},

})



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
		var player = PlayerController.getCurrentPlayer()
		return {
			X: player.X + player.width/2,
			Y: player.Y + player.height/2
		}
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

	lineToAngleWithRelativeBloom: function(pivot, length, angle, abs_bloom, rel_bloom)
	{
		return this.getToByAngle(pivot.X, pivot.Y, length, angle + (abs_bloom/2 * rel_bloom))
	},

	draw: function(ctx)
	{
		var weapon = WeaponController.getCurrentWeapon()
	    
	    var fillStyle = 'black';
		if (weapon)
	    	fillStyle = weapon.getRGBColor();
			
			var cursor_point = CameraHandler.translateToServer(CameraHandler.point(MouseController.X, MouseController.Y))
	    this.drawCursor(ctx, cursor_point, fillStyle)
	    this.drawBloomArea(ctx, cursor_point, weapon)
	},

	drawBloomArea: function (ctx, point, weapon)
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
		DrawHandler.draw(0,0, function(ctx){
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
			// TODO MAKE LOCAL HIT TEST
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
		}, this)
	},

	createHitTestLine: function(from, to)
	{
		return {from: from, to: to}
	},

	drawCursor: function (ctx, point, fillStyle)
	{
		DrawHandler.draw(0,0, function (){
			ctx.beginPath();
			ctx.fillStyle = fillStyle
	    ctx.fillRect(point.X-3, point.Y-3, 6, 6);
	    ctx.fillRect(point.X-1, point.Y-3-10, 2, 8);
	    ctx.fillRect(point.X-1, point.Y-3 +8, 2, 8);
		})
	},

}



/*==========================================================================================
=            #SHOOT CONTROLLER                 =============================================
==========================================================================================*/


var ShootController = {
	lifetime: 800,
	
	socketShootDraw: function(shooter_id, x, y, mouse_x, mouse_y, weapon_id)
	{
		ShootController.create(shooter_id, x, y, mouse_x, mouse_y, WeaponController.getWeapon(weapon_id))
	},

	_playShoot: [],
	playShoot: function (shoot_time, weapon_id)
	{
		shoot_id = shoot_time+weapon_id
		if (this._playShoot.indexOf(shoot_id) != -1)
			return true
		Core.sound.fire[weapon_id].play();
		this._playShoot.push(shoot_id)
	},

	draw: function (ctx)
	{
		_shoot.getData().for(function(id, value){
			this.loopDraw(ctx, id, value);
			if (value.weapon && value.weapon.id)
				this.playShoot(value.time, value.weapon.id)
		}, this)
	},

	getBulletLifeTime: function ()
	{
		return 100
	},

	isDeath: function(shoot)
	{
		return shoot.death || shoot.time + this.getBulletLifeTime() < Date.now()
	},

	loopDraw: function (ctx, id, shoot)
	{	
		if (this.isDeath(shoot))
			return false

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
		this.sprite = SpriteSheet.init([
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
		DrawHandler.draw(0, 0, function()
		{
			this.drawImage(resources.get('assets/gui.png'), 0, 0);
		}, false, true)
	},

	drawLoadedAmmo: function(ctx)
	{
		var X = Core.data.canvas.width/2 -15
		var Y = Core.data.canvas.height -82
		
		text = WeaponController.getAmmoInCharger()
		if (text == -1)
			text = '∞'
		TextController.create({size:20, text: text, X: X, Y: Y, align: 'right', absoluteDraw:true})
	},

	drawLeftAmmo: function(ctx)
	{
		var X = Core.data.canvas.width/2+35
		var Y = Core.data.canvas.height -82
		
		text = WeaponController.getAmmoInInventory()
		TextController.create({size:20, text: text, X: X, Y: Y, align: 'left', absoluteDraw:true})
	},

	drawWeaponSolt: function(ctx)
	{
		DrawHandler.draw(94, Core.data.canvas.height - 76, function(ctx){
			var sprite = this.sprite.get(WeaponController.getCurrentWeaponId())
			sprite.render(ctx)
		}, this, true)

		// prev weapon
		var currentWeapon = WeaponController.getCurrentWeaponId()
		var prevWeaponId = InventoryController.getPrevStackItem('weapons', currentWeapon)
		var nextWeaponId = InventoryController.getNextStackItem('weapons', currentWeapon)
		if (prevWeaponId)
		{
			DrawHandler.draw(30, Core.data.canvas.height - 60, function(ctx) {
				ctx.scale(.5,.5);
				this.sprite.get(prevWeaponId).render(ctx)
			}, this)
		}

		// next weapon
		if (nextWeaponId)
		{
			DrawHandler.draw(220, Core.data.canvas.height - 60, function(ctx) {
				ctx.scale(.5,.5);
				this.sprite.get(nextWeaponId).render(ctx)
			}, this)
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
		DrawHandler.draw(0, 0, function(ctx) {
			ctx.beginPath()
			ctx.fillStyle = this.stats.dead? 'red' : color
			ctx.strokeStyle = ctx.fillStyle
			ctx.strokeRect(Core.data.canvas.width/2 - this.ui.stats.width/2, Core.data.canvas.height - (this.ui.stats.margin + padding), this.ui.stats.width, this.ui.stats.height)
			ctx.fillRect(Core.data.canvas.width/2 - this.ui.stats.width/2, Core.data.canvas.height - (this.ui.stats.margin + padding), this.ui.stats.width*fillRate, this.ui.stats.height)
		}, this, true)
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

// #camera handler

var CameraHandler = {

	point: function(x,y)
	{
		return {
			X: x,
			Y: y
		}
	},

	translateToServer: function(point_client)
	{
		var center = this.getCanvasCenter()
		var player = this.getCurrentPlayerPoint()

		if (!this.isCameraInsideCornerX())
			point_client.X += this.getCameraPaddingX()
			
			if (!this.isCameraInsideCornerY())
				point_client.Y += this.getCameraPaddingY()

		return point_client
	},

	translateToClient: function(point_server)
	{
		point_server.X -= this.getCameraPaddingX()
		point_server.Y -= this.getCameraPaddingY()

		return point_server
	},

	getCurrentPlayerPoint: function()
	{
		currentPlayer = PlayerController.getCurrentPlayer()
		if (currentPlayer)
			return this.point(currentPlayer.X, currentPlayer.Y)
		return this.point(0,0)
	},

	getCanvasCenter: function(){
		return this.point(
			(Core.data.canvas.width/2 -PlayerController.width/2),
			(Core.data.canvas.height/2 -PlayerController.height/2),
		)
	},

	getMapSizes: function()
	{
		return this.point(
			resources.get('assets/background.png').width,
			resources.get('assets/background.png').height,
		)
	},

	getCameraPaddingX: function()
	{
		var centerX = this.getCanvasCenter().X
		var playerX = this.getCurrentPlayerPoint().X
		
		if (playerX <= centerX)
			return 0

		if (this.isCameraOutsideCornerX())
			return this.getMapSizes().X - centerX*2 - PlayerController.width

		return playerX - centerX
	},

	getCameraPaddingY: function()
	{
		var centerY = this.getCanvasCenter().Y
		var playerY = this.getCurrentPlayerPoint().Y
		
		if (playerY <= centerY)
			return 0

		if (this.isCameraOutsideCornerY())
			return this.getMapSizes().Y - centerY*2 - PlayerController.height

		return playerY - centerY
	},

	isCameraOutsideCornerX: function()
	{
		var centerX = this.getCanvasCenter().X
		var playerX = this.getCurrentPlayerPoint().X
		var mapX = this.getMapSizes().X
		return playerX >= mapX -centerX - PlayerController.width
	},
	
	isCameraOutsideCornerY: function()
	{
		var centerY = this.getCanvasCenter().Y
		var playerY = this.getCurrentPlayerPoint().Y
		var mapY = this.getMapSizes().Y
		return playerY >= mapY -centerY - PlayerController.height
	},

	isCameraInsideCornerX: function()
	{
		return !this.getCameraPaddingX() > 0
	},

	isCameraInsideCornerY: function()
	{
		return !this.getCameraPaddingY() > 0
	}

}


// #svg
var SvgController = {

	svg: null,

	init: function(){
		this.loadRectsFromSvg()
	},

	onGetSvgString: function(callback)
	{
		$.get('/assets/map.txt', function(data) {
				callback.call(this, data)
		});
	},

	loadRectsFromSvg: function()
	{
		var draw = SVG('drawing')
		this.svg = draw
		this.onGetSvgString(function(svg_string){
			window.svg = (svg_string)
			SvgController.svg.svg(svg_string)
		})
	},

	entitize: function(svgRect)
	{
		return {
			X: svgRect.x(),
			Y: svgRect.y(),
			width: svgRect.width(),
			height: svgRect.height(),
		}
	},

	update: function()
	{
		var player = PlayerController.getCurrentPlayer()
		if (!player)
			return 0
		
		playerEntity = {
			X: player.X,
			Y: player.Y,
			width: PlayerController.width,
			height: PlayerController.height,
		}
		SvgController.boxes = []
		this.svg.each(function(i, children) {
			var boxEntity = SvgController.entitize(this)
			var collision = HitController.boxCollides(playerEntity, boxEntity)
			if (collision)
			{
				SvgController.boxes = [playerEntity, boxEntity]
			}
		}, true)
	},

	boxes: [],

	draw: function()
	{
		if (!Core.debug) return false
		this.svg.each(function(i, children) {
			this.fill({ color: '#f06' })
			this.width()
			DrawHandler.draw(this.x(), this.y(), function(ctx){
				ctx.fillStyle = 'rgba(0,0,0,0.8)'
				ctx.fillRect(0,0, this.width(), this.height())
			}, this)
		}, true)
		StackMaster.loop(this.boxes, function(id, b){
			DrawHandler.draw(b.X, b.Y, function(ctx){
				ctx.fillStyle = '#f06'
				ctx.fillRect(0,0, this.width, this.height)
			}, b)
		})
	}

}




/*=========================================
=            #DRAW #HANDLER               =
===========================================*/
var DrawHandler = {

	center: function (baseSprite)
	{
		return {
			X: baseSprite.X + baseSprite.width/2,
			Y: baseSprite.Y + baseSprite.height/2,
		}
	},

	getBaseSprite: function()
	{
		baseSprite = {
			alias: null,
			X: 0,
			Y: 0,
			paddingX: 0,
			paddingY: 0,
			scaleX: 1,
			scaleY: 1,
			width: 32,
			height: 32,
			color: "#00A",
			sprite: null,
		}
		return baseSprite
	},

	drawSprite: function(id, spriteSettings, absoluteDraw) {
		var draw = Object.assign({}, this.getBaseSprite(), spriteSettings)
			
		if (draw.sprite)
		{
			// Draw sprite
			DrawHandler.draw(draw.X + draw.paddingX, draw.Y + draw.paddingY, function(){
				this.scale(draw.scaleX, draw.scaleY)
				SpriteHandler.draw(id, 0, 0, draw.sprite, absoluteDraw)
			}, false, absoluteDraw)
		} else {
			// TODO ABSOLUTE DRAW!!!
			// Draw default rect
			DrawHandler.draw(draw.X, draw.Y, function(){
				this.fillStyle = draw.color;
				this.fillRect(0, 0, draw.width, draw.height);
			}, false, absoluteDraw)
			var center = this.center(draw)
			TextController.create({X: center.X, Y: center.Y, text: draw.alias, align:'center', absoluteDraw:absoluteDraw})
		}
		
		if (Core.debug)
		{
			// Draw debug info
			DrawHandler.draw(draw.X, draw.Y, function(){
				this.strokeStyle = draw.color;
				this.strokeRect(0, 0, draw.width, draw.height);
			}, false, absoluteDraw)
			var text = id?id:draw.alias
			var center = this.center(draw)
			TextController.create({size:11, font:'Arial', X: center.X, Y: draw.Y + draw.height, text: text, align:'center', absoluteDraw:absoluteDraw})
		}
	},
	
	getCanvasContext: function() {
		return Core.data.ctx
	},

	clear: function()
	{
		this.draw(0,0, function(){
			this.clearRect(0, 0, Core.data.canvas.width, Core.data.canvas.height);
			this.fillStyle = '#a2bf4e'
			this.fillRect(0, 0, Core.data.canvas.width, Core.data.canvas.height);
		})
	},

	drawBackground: function()
	{
		this.draw(0,0, function(){
			this.drawImage(resources.get('assets/background.png'), 0, 0);
		})
	},

	drawGrid: function()
	{
		this.draw(-10,-15, function(){
			this.strokeStyle = '#b8d763'
			var factor = 48
			factor = Math.sqrt(factor**2 + factor**2)
			for (i = -10; i < 20; i++)
			{
				var X = i*factor
				this.moveTo(X, 0)
				var degs = 90 -60
				var to = AimController.getToByAngle(X,0, Core.data.canvas.width, degs*Math.PI/180)
				this.lineTo(to.X, to.Y)
				this.stroke()
			}
			for (i = 0; i < 30; i++)
			{
				var X = i*factor
				this.moveTo(X, 0)
				var degs = 90 +60
				var to = AimController.getToByAngle(X,0, Core.data.canvas.width, degs*Math.PI/180)
				this.lineTo(to.X, to.Y)
				this.stroke()
			}
		})
	},

	callDrawCallback: function(callback, object_ctx, draw_ctx)
	{
		if (object_ctx)
			callback.call(object_ctx, draw_ctx)
		else callback.call(draw_ctx)
	},

	draw: function(x, y, callback, object_ctx, absoluteDraw) {
		var ctx = this.getCanvasContext()
		if (!absoluteDraw) {
			var point = CameraHandler.translateToClient(CameraHandler.point(x, y))
			x = point.X
			y = point.Y
		}
		ctx.save()
		ctx.translate(x, y)
		this.callDrawCallback(callback, object_ctx, ctx)
		ctx.restore()
	},

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
			
				if (_inventory.get(PlayerController.id, 'item_grabbable') == item.id)
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
		return false
	},

	getDrawModel: function(item) {
			var drawModel = {
				X: item.X,
				Y: item.Y,

				alias: item.id,
				width:48,
				height:32,
				paddingX: -8,
				scaleX: 0.49,
				scaleY: 0.49,
				color: 'blue',

				sprite: 'item',
	  	}
				
	  	return drawModel
	},

	getSpriteIdFor: function (id)
	{
		if (id.split('.')[0] == 'ammo')
			return 'ammo.box'
		return id
	},

	isItemGrabbable: function(id)
	{
		return _inventory.get(PlayerController.id, 'item_grabbable')  == id
	},

	draw: function(ctx) {
		var items = _items.get()
		
		StackMaster.loop(items, function(id, item){
			var sprite_id = this.getSpriteIdFor(id)
			SpriteHandler.setSprite(id, sprite_id)
			DrawHandler.drawSprite(id, this.getDrawModel(item))
			
			if (this.isItemGrabbable(id))
				this.drawGrabbableText(ctx, item)

		}, this)
	},

	drawGrabbableText: function (ctx, item)
	{
		var item = this.getDrawModel(item);
		var Y = item.Y + item.height
		var X = item.X + item.width/2

		var text = this.getItemAlias(item)
		TextController.create({size:18, text: text, X: X, Y: Y+15, align: 'center'})
		TextController.create({size: 12, text: 'PRESS E TO GRAB', X: X, Y: Y+35, align: 'center'})
		this.grabbable = false
	},

	getItemAlias: function (item)
	{
		var alias = item.alias.split('.')[1]
		if (item.alias.split('.')[0].toLowerCase() == 'ammo')
			alias = [alias, 'ammo'].join(' ')
		return alias.toUpperCase()
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

	getAmmoInCharger: function()
	{
		return PlayerController.getInventoryItem(WeaponController.getCurrentWeaponId())
	},
	
	getAmmoInInventoryItemId: function ()
	{
		return WeaponController.getCurrentWeaponId().split('weapon').join('ammo')
	},

	getAmmoInInventory: function()
	{
		return PlayerController.getInventoryItem(this.getAmmoInInventoryItemId())
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
		return this.isTimeToReloadAllowed() && this.getAmmoInCharger() < this.getCurrentWeapon().get('ammoCharger')
	},

	shoot: function(dt)
	{
		if (!this.isShootAllowed())
			return false
		
		this.data.lastTimeFired = Date.now()
		
		if (this.getAmmoInCharger() == 0)
		{
			this.reload()
		}
	},

	reload: function()
	{
		if (!this.isReloadAllowed())
			return false

		this.data.lastTimeReloaded = Date.now()
		var weapon = this.getCurrentWeapon()

		if (this.getAmmoInInventory())
		{
			var currentLoadedAmmo = this.getAmmoInCharger()
			var chargerMaxAmmo = weapon.get('ammoCharger')
			var missingAmmo = chargerMaxAmmo - currentLoadedAmmo
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
		return _inventory.get(PlayerController.id, 'current')
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
				weaponObjects[id] = new Weapon(weapons[index])
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
	width:32,
	height:32,
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

  getEnemiesFrom: function (player_id)
  {
  	// todo remove player id from list
  	var enemies = Object.assign({}, _players.get())
  	delete enemies[player_id]
  	return enemies
  },
  
  getInventoryItem: function (item_id)
  {
		var inventory = _inventory.get(this.id, 'items')
		if (inventory.hasOwnProperty(item_id))
			return inventory[item_id]
		return 0
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

    // Shoot send
    if (MouseController.click)
    {
			var click_point = CameraHandler.translateToServer({
				X: MouseController.X,
				Y: MouseController.Y,
			})
			_control.set(PlayerController.id, {
				click: click_point
			})
			WeaponController.shoot(dt);
    }
    // Reload send
    if (input.isDown("r") && WeaponController.isReloadAllowed())
    {
			_control.set(PlayerController.id, {
				reload: Date.now()
			})
    	WeaponController.reload()
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
    	SpriteHandler.setSprite (this.id, 'walk')
    else
			SpriteHandler.setSprite (this.id, 'stand')
	
    SpriteHandler.updateSprite (this.id, dt);


		this.dontFallOut(dt);
  	
  	this.updateAllowItemGrabbable()
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
  
  getCurrentPlayer: function()
  {
		return _players.get(this.id)
  },
  
  center: function(item) {
		return {
			X: item.X + this.width/2,
			Y: item.Y + this.height/2,
		}
  },

  getDrawModel: function(id, player) {
  		var drawModel = {
				X: player.X,
				Y: player.Y,

				width: this.width,
				height: this.height,
				color: id == this.id?'#00A':'red',
				sprite: 'player',
				positionIsAbsolute: false,
	  	}
	  	return drawModel
	},

  draw: function(ctx) {
  	// this.entity.draw(ctx)
  	var players = _players.get()
  	
  	StackMaster.loop(players, function(id, player){
			var drawModel = this.getDrawModel(id, player)
			if (id == this.id)
				drawModel = this.drawCurrentPlayer(drawModel)
			
			DrawHandler.drawSprite(id, drawModel, drawModel.positionIsAbsolute)
  	}, this)
	},
	
	drawCurrentPlayer: function(drawModel)
	{
		var absoluteX = absoluteY = false
		
		if (!CameraHandler.isCameraInsideCornerX() && !CameraHandler.isCameraOutsideCornerX())
		{
			drawModel.X = Core.data.canvas.width/2 -drawModel.width/2
			absoluteX = true
		}
		
		if (!CameraHandler.isCameraInsideCornerY() && !CameraHandler.isCameraOutsideCornerY())
		{
			drawModel.Y = Core.data.canvas.height/2 -drawModel.height/2
			absoluteY = true
		}
		
		var point = CameraHandler.translateToClient(CameraHandler.point(drawModel.X, drawModel.Y))
		if (!absoluteX)
			drawModel.X = point.X
		
		if (!absoluteY)
			drawModel.Y = point.Y


		drawModel.positionIsAbsolute = true
		return drawModel
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
		// TODO PERFORM THIS IN SERVER
		return;
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
		return 0;
		var enemies = PlayerController.getEnemies()
		var hit = false
		// todo replace for loop
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
		var shapePoints = PlayerController.getPoints(enemy)
		
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
	},

	checkBulletsEnemiesHit: function(bullets)
	{
		var enemies = PlayerController.getEnemies()
		var enemyTarget = {
			length: 10**9, // help calc shoot len
			damage: 0,
			enemy: null,
		}
		// Todo replace for loop
		for (id in enemies)
		{
			if (!enemies.hasOwnProperty(id))
				continue

			var enemy = enemies[id]
			var points = PlayerController.getPoints(enemy)
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
		}
		// Check if we hit something
		if (enemyTarget.enemy)
		{
			// TODO this should not work but it works wtf
			ShootController.killBullets(bullets)
			// var enemy = PlayerController.getDrawEntityModel(enemyTarget.enemy)
			var enemy = PlayerController.center(enemyTarget.enemy)
			HitTextController.create(enemy.X, enemy.Y, enemyTarget.damage, true)
			// enemyTarget.enemy.getHitted(enemyTarget.damage, shoot.weapon.id)
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
		var player = PlayerController.getCurrentPlayer()
		//var dx = player.center().X - enemy.entity.center().X
		//var dy = player.center().Y - enemy.entity.center().Y
		//return Math.sqrt(dx**2 + dy**2)
		return 0
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
				absoluteDraw: false,
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
		DrawHandler.draw(t.X, t.Y, function(){
			this.font = t.size+'px '+t.font
			this.textBaseline = t.baseline
			this.textAlign = t.align
			this.fillStyle = t.fill
			this.strokeStyle = t.stroke
			this.lineWidth = t.lineWidth
			if (t.fill)
				this.fillText(t.text, 0, 0)
			if (t.stroke)
				this.strokeText(t.text, 0, 0)
		}, false, t.absoluteDraw)
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

	enemyAngle: {},
	angleCreated: {},
	createAngleFor: function(hitText)
	{
		var hitTextId = hitText.target_id + hitText.created_at
		if (this.angleCreated.hasOwnProperty(hitTextId))
			return this.angleCreated[hitTextId]

		// Create and set angle
		var enemyAngleIncrement = this.enemyAngle.hasOwnProperty(hitText.target_id)?this.enemyAngle[hitText.target_id]:0
		enemyAngleIncrement = (enemyAngleIncrement >= this.angleMax)?0:enemyAngleIncrement+1
		var realAngle = this.angleIncrement*-2 + this.angleIncrement*enemyAngleIncrement;
		this.enemyAngle[hitText.target_id] = enemyAngleIncrement
		this.angleCreated[hitTextId] = realAngle
		return realAngle
	},

	draw: function (ctx)
	{
		_hitText.getData().for(function(id, hitText){
			if (Date.now() - hitText.created_at > this.lifetime)
			{
				// should be removal
			}
			else
			{
				hitText.angle = this.createAngleFor(hitText)
				this.loopDraw(ctx, id, hitText)
			}
		}, this)

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
		
		DrawHandler.draw(hitt.X, hitt.Y, function (ctx){
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
		}, this)
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
	resources.load([
	    'assets/gui.png',
	    'assets/player.png',
	    'assets/gun.png',
	    'assets/background.png',
	]);
	resources.onReady(function(){
		Controllers = [
				MouseController,
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
				SvgController,
			]
		
		SpriteHandler.init()
		Socket.init()
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

		this.io.on('modules', function(modules){			
			startSyncRegisterModules(modules)
			Core.init(document.getElementById('canshoot'), Controllers)
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

var startSyncRegisterModules = (function(modules){
	StackModuleMaster.start(true, function(){
		return Socket.io
	})

	StackModuleMaster.loadModules(modules)

	_control = StackModuleMaster.get('control')
	_players = StackModuleMaster.get('players')
	_items = StackModuleMaster.get('items')
	_inventory = StackModuleMaster.get('inventory')
	_shoot = StackModuleMaster.get('shoot')
	_hitText = StackModuleMaster.get('hitText')
})

