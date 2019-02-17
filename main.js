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
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  ctx.fillText("Sup Bro!", text.X, text.Y);
  player.draw();
}

var player = {
  color: "#00A",
  X: 220,
  Y: 270,
  width: 32,
  height: 32,
  speed: 200,
  draw: function() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.X, this.Y, this.width, this.height);

    if(this.shoots)
    {
    	ctx.beginPath();
		ctx.moveTo(this.shoots.from.X, this.shoots.from.Y);
		ctx.lineTo(this.shoots.to.X, this.shoots.to.Y);
		ctx.stroke();
    }
  },
  update: function(dt){
  	if(input.isDown('DOWN') || input.isDown('s'))
        this.Y += this.speed * dt;

    if(input.isDown('UP') || input.isDown('w'))
        this.Y -= this.speed * dt;

    if(input.isDown('LEFT') || input.isDown('a'))
        this.X -= this.speed * dt;

    if(input.isDown('RIGHT') || input.isDown('d'))
        this.X += this.speed * dt;

    if (input.isDown("SPACE"))
		this.shoot(dt)

	this.hits(dt);
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
	console.log("Shoot from:", this.X, this.Y)	
	console.log("Shoot to:", MouseController.X, MouseController.Y)	
	this.shoots = {
		from: {X:this.X +this.width/2, Y:this.Y +this.height/2},
		to: {X:MouseController.X, Y:MouseController.Y},
		time: Date.now()
	}
  },
};

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