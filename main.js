var ctx
var canvas
var lastTime


function main () {
	var now = Date.now();
	var dt = (now - lastTime) / 1000.0;
	if (!dt) dt = 0
  	update(dt);
  	draw();
	requestAnimationFrame(main);
	lastTime = now;
}

$(document).ready(function(){
	canvas = document.getElementById('canshoot');
	ctx = canvas.getContext("2d");
	main();
	MouseController.registerEvents()
});

var text = {X: 50, Y: 50}

function update(dt) {
	text.X += 25*dt
	text.Y += 25*dt

	player.update(dt);
	ShootController.update(dt);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  ctx.fillText("Sup Bro!", text.X, text.Y);
  ShootController.draw();
  player.draw();
}

var player = {
  color: "#00A",
  X: 220,
  Y: 270,
  width: 32,
  height: 32,
  speed: 200,
  movement: {
  	x_speed: 0, // current speed
  	y_speed: 0, 
  	max_speed: 160, // max px per sec
  	aceleration: 30, // speed to max_speed in ms 
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



    if (input.isDown("SPACE"))
		this.shoot(dt)

	this.hits(dt);
  },
  draw: function() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.X, this.Y, this.width, this.height);
    
    // Draw AIM
    ctx.fillStyle = "red";
    ctx.fillRect(MouseController.X-3, MouseController.Y-3, 6, 6);
  },
  hits: function(dt) {
	if (this.X > canvas.width - this.width)
		this.X = canvas.width - this.width
	if (this.Y > canvas.height - this.height)
		this.Y = canvas.height - this.height
	if (this.X < 0)
		this.X = 0
	if (this.Y < 0)
		this.Y = 0
  },
  shoots: false,
  shoot: function() {
	this.shoots = {
		from: {X:this.X +this.width/2, Y:this.Y +this.height/2},
		to: {X:MouseController.X, Y:MouseController.Y},
		time: Date.now()
	}
	ShootController.create(this.X +this.width/2, this.Y +this.height/2,
							MouseController.X, MouseController.Y)
  },
};

var ShootController = {
	stack: {},
	lifetime: 800,
	create: function(x, y, mouse_x, mouse_y)
	{
		var root_angle = this.createAngle(x, y, mouse_x, mouse_y);
		var perdigons = 8
		var bloom = 30 * Math.PI / 180
		var angle = root_angle;

		for (i = 0; i < perdigons; i++)
		{
			angle -= bloom /2
			angle += bloom * Math.random()
			
			to = this.getShootLineToRadian(x, y, 200, angle)
			this.createBullet(x, y, to.X, to.Y)
		}
	},

	createBullet: function (x, y, to_x, to_y)
	{
		shoot = {
			from: {X:x, Y:y},
			to: {X:to_x, Y:to_y},
			time: Date.now()
		}

		this.stack[this.makeUniqueId()] = shoot
	},

	createAngle: function (x, y, to_x, to_y)
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

	draw: function ()
	{
		for (var id in this.stack) {
			if (this.stack.hasOwnProperty(id)) {
	     	   this.loopDraw(id, this.stack[id]);
			}
		}
	},

	loopUpdate: function (id, shoot, dt)
	{
		if(this.lifetime != 0 && shoot.time + this.lifetime < Date.now())
	    {
			delete this.stack[id];
	    }
	},

	loopDraw: function (id, shoot)
	{
		//this.drawTrigometricThing(shoot);
    	
    	color_percent = 1 - (Date.now() - shoot.time) / this.lifetime

		ctx.beginPath();
		ctx.strokeStyle = 'rgba(255, 0, 0, ' + color_percent +')';
		ctx.moveTo(shoot.from.X, shoot.from.Y);
		ctx.lineTo(shoot.to.X, shoot.to.Y);
		ctx.stroke();

	},

	drawTrigometricThing: function (shoot)
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

	getShootLineToRadian: function (x, y, len, angle)
	{
		return {X:x + len * Math.cos(angle), Y: y + len * Math.sin(angle)}
	},
}

var MouseController = {
	X: 0,
	Y: 0,
	click: false,

	registerEvents: function() {
		$(canvas).mousedown(function (e) {
		    MouseController.click = true
		    player.shoot()
		});

		$(canvas).mousemove(function (e) {
		    MouseController.X = e.pageX - $(this).offset().left
		    MouseController.Y = e.pageY - $(this).offset().top
		});

		$(canvas).mouseup(function (e) {
		    MouseController.click = false
		});
	    
	    $(canvas).mouseleave(function (e) {
		    MouseController.click = false
		});
	}

}