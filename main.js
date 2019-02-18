/* 
 * MATH DESTRUCTION!!
 * */

var Core = {

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

function sound(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function(){
    this.sound.play();
  }
  this.stop = function(){
    this.sound.pause();
  }
}

$(document).ready(function(){
	Core.init(document.getElementById('canshoot'),
		[
			MouseController,
			ShootController,
			
			EnemyController,
			PlayerController,
			
			HitTextController,

			UIController,
			AimController,
		])
});

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
		var weaponType = weapons[PlayerController.fire.weapon]
	    ctx.fillStyle = 'rgb('+weaponType.color[0]+','+weaponType.color[1]+','+weaponType.color[2]+')';
	    ctx.beginPath();
	    ctx.fillRect(MouseController.X-3, MouseController.Y-3, 6, 6);
	    ctx.fillRect(MouseController.X-1, MouseController.Y-3-10, 2, 8);
	    ctx.fillRect(MouseController.X-1, MouseController.Y-3 +8, 2, 8);


		var angle = this.getMouseAngle();
		var bloom = weaponType.bloom * Math.PI / 180
		var length = weaponType.length

		to = this.getToByAngle(this.getPivot().X, this.getPivot().Y, length, angle)
		this.lineTo(ctx, to);
		// min bloom
		to = this.getToByAngle(this.getPivot().X, this.getPivot().Y, length, angle - bloom/2)
		this.lineTo(ctx, to);
		// max bloom
		to = this.getToByAngle(this.getPivot().X, this.getPivot().Y, length, angle + bloom/2)
		this.lineTo(ctx, to);
	},

	lineTo: function (ctx, to)
	{
		ctx.beginPath();
		ctx.strokeStyle = 'gray';
		ctx.moveTo(this.getPivot().X, this.getPivot().Y);
		ctx.lineTo(to.X, to.Y);
		ctx.stroke();
	},
}


var ShootController = {
	stack: {},
	lifetime: 800,
	create: function(x, y, mouse_x, mouse_y, weaponType)
	{
		var root_angle = AimController.getMouseAngle();
		var perdigons = weaponType.perdigons
		var bloom = weaponType.bloom * Math.PI / 180
		var length = weaponType.length
		console.log(length)

		var bullets = [];
		for (i = 1; i <= perdigons; i++)
		{
			var angle = root_angle
			angle -= bloom /2
			angle += bloom * Math.random()
			
			to = AimController.getToByAngle(x, y, length, angle)
			var bullet = this.createBullet(x, y, to.X, to.Y, weaponType)
			bullets.push(bullet)
		}
		EnemyController.checkBullets(bullets)
	},

	createBullet: function (x, y, to_x, to_y, weaponType)
	{
		shoot = {
			from: {X:x, Y:y},
			to: {X:to_x, Y:to_y},
			time: Date.now(),
			weaponType: weaponType,
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
		if(shoot.weaponType.lifetime != 0 && shoot.time + shoot.weaponType.lifetime < Date.now())
	    {
			delete this.stack[id];
	    }
	},

	loopDraw: function (ctx, id, shoot)
	{
		//this.drawTrigometricThing(ctx, shoot);
    	var wt = shoot.weaponType;
    	color_percent = 1 - (Date.now() - shoot.time) / wt.lifetime

		ctx.beginPath();
		ctx.strokeStyle = 'rgba('+wt.color[0]+', '+wt.color[1]+', '+wt.color[2]+', ' + color_percent +')';
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




var UIController = {
	health: {
		qty: 100,
		max: 100,
	},

	draw: function (ctx)
	{
  		this.drawItemSolt(ctx);
		this.drawHealth(ctx);
		HitTextController.draw(ctx);
	},

	drawHealth: function (ctx)
	{
		var len = 200
		ctx.beginPath()
		ctx.fillStyle = 'red'
		ctx.fillRect(Core.data.canvas.width/2 - len/2, Core.data.canvas.height - 40, len, 20)
		ctx.fillStyle = 'green'
		ctx.fillRect(Core.data.canvas.width/2 - len/2, Core.data.canvas.height - 40, len/this.health.max*this.health.qty, 20)
	},

	drawItemSolt: function(ctx)
	{
		var text = "=> " + PlayerController.fire.weapon;

		ctx.font = "18px Verdana";
		// Create gradient
		var gradient = ctx.createLinearGradient(0, 0, Core.data.canvas.width, 0);
		gradient.addColorStop("0"," magenta");
		gradient.addColorStop("0.5", "blue");
		gradient.addColorStop("1.0", "red");
		// Fill with gradient
		ctx.fillStyle = gradient;
		ctx.fillText(text, 10, 90);
	},

}

var weapons = {
	shotgun: {
		perdigons: 10,
		damage: 20,
		rate: 975,
		bloom: 10,
		length: 300,
		lifetime: 975,
		color: [0,0,255],
	},
	rifle: {
		perdigons: 1,
		damage: 30,
		rate: 250,
		bloom: 5,
		length: 600,
		lifetime: 250,
		color: [255,0,255],
	},
	smg: {
		perdigons: 1,
		damage: 16,
		rate: 120,
		bloom: 10,
		length: 400,
		lifetime: 100,
		color: [255,0,0],
	},
}

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
  	aceleration: 30, // speed to max_speed in ms 
  },
  fire: {
  	lastTime: 0,
  	lastSwitchTime: 0,
  	lastWeapon: null,
  	minSwitchTime: 1000,
  	weapon: 'smg',
  },
  center: function()
  {
  	return {
  		X: this.X + this.width/2,
  		Y: this.Y + this.height/2,
  	}
  },
  nextWeapon: function()
  {
  	if (Date.now() - this.fire.lastSwitchTime < this.fire.minSwitchTime) return false;
	var keys = Object.keys(weapons);
	var index = keys.indexOf(this.fire.weapon)

	next = index +1
	if (typeof keys[next] == 'undefined')
		next = 0

	
	this.fire.weapon = keys[next]
	this.fire.lastSwitchTime = Date.now()
  },
  getFireRate: function()
  {
  	return weapons[this.fire.weapon].rate
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
    	if (Date.now() - this.fire.lastTime >= this.getFireRate())
    	{
    		Core.sound.fire[this.fire.weapon].sound.currentTime = 0
    		Core.sound.fire[this.fire.weapon].play();
			this.shoot(dt)
	    	this.fire.lastTime = Date.now()
    	}
    }

    // Change weapon
    if (input.isDown("x"))
    {
    	this.nextWeapon();
    	Core.sound.weapon.play()
    }

	this.hits(dt);
  },
  draw: function(ctx) {
    ctx.fillStyle = this.color;
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
	selectedWeapon = weapons[this.fire.weapon];
	ShootController.create(this.center().X, this.center().Y,
							MouseController.X, MouseController.Y,
							selectedWeapon)
  },
};

var HitTextController = {
	stack: [],

	lifetime: 650,
	heightPadding: 30,
	widthPadding: 50,

	angle: 0,
	angleIncrement: 30 * Math.PI / 180,
	angleMax: 3,
	create: function (x, y, text)
	{
		var angle = this.angleIncrement*-2 + this.angleIncrement*this.angle;
		this.angle = (this.angle > this.angleMax)?0:this.angle+1

		this.stack.push({
			X: x,
			Y: y,
			text: text,
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


		ctx.font = "12px Verdana";
		// Fill with gradient
		color_percent = 1 - (Date.now() - hitt.created_at) / this.lifetime
		ctx.fillStyle = 'rgba(41, 189, 255, '+color_percent+')';
		ctx.fillText(text, 0, -45);

		ctx.restore();
	}

}

var EnemyController = {
	X: 320,
	Y: 120,
	width: 50,
	height: 50,
	color: 'red',
	
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
				var hit = this.checkBullet(bullets[id])
				if (hit)
				{
					damage += bullets[id].weaponType.damage
				}
			}
		}
		
		if (damage) this.getHitted(damage)
	},

	checkBullet: function (bullet)
	{
		var vec = this.getRectVectors()
		
		var hit = this.isColliding(bullet.from, bullet.to, vec[0], vec[1])
		hit = hit || this.isColliding(bullet.from, bullet.to, vec[1], vec[2])
		hit = hit || this.isColliding(bullet.from, bullet.to, vec[2], vec[3])
		hit = hit || this.isColliding(bullet.from, bullet.to, vec[3], vec[0])

		return hit
	},

	getHitted: function (damage)
	{
		HitTextController.create(this.X + this.width/2, this.Y + this.height/2, damage)
		UIController.health.qty -= damage;
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