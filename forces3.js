var REPOSITION_COUNT = 0,
	REPOSITION_TIME = null,
	startDrawTime = null,
	PROXIMITY = 100,
	DRAW_CIRCLES = false,
	GOBBLE_GOBBLE = false,
	DRAW_LINES = true,
	DECELERATION = 0.99999;

var settings = {
		backgroundHue: 120,
		bleed: 0,
		
		warpspeed: 10,
		
		canvas: {
			width: 300,
			height: 200,
			halfWidth: 150,
			halfHeight: 100,
			clearCanvas: true,
			updateRate: 0
		},
		planets: {
			color: '0, 0, 0',	// rgb
			numPlanets: 50,
			minSize: 2,
			maxSize: 30
		}
	},
	
	canvas = null,
	context = null,
	planets = [],
	
	domLogElement = null;
	
	mousePos = {
		x: 0,
		y: 0
	},
	
	isMouseDown = false,
	
	log = function() {
		var i, s = '';
		for(i = 0; i < arguments.length; ++i) {
			s += arguments[i];
			if(s < arguments.length) {
				s += ', ';
			}
		}
		console.log(s);
	},
	domLog = function(s) {
		domLogElement.textContent = s;
	},
	getRandomX = function() {
		return (Math.random() * (settings.canvas.width + settings.bleed)) - settings.bleed/2;
	},
	getRandomY = function() {
		return (Math.random() * (settings.canvas.height + settings.bleed)) - settings.bleed/2;
	},
	getRandomNumber = function(min, max) {
		var r = (Math.random() * max);
		if(r < min) r = min;
		return r;
	},
	getProximity = function(ax, ay, aRadius, bx, by, bRadius) {
		var deltaXSquared = ax - bx;
			deltaXSquared *= deltaXSquared;
		
		var deltaYSquared = ay - by;
			deltaYSquared *= deltaYSquared;
		
		// Calculate the sum of the radii, then square it
		var sumRadiiSquared = aRadius + bRadius; 
			sumRadiiSquared *= sumRadiiSquared;
		
		if(deltaXSquared + deltaYSquared <= sumRadiiSquared) {
			return true;
		}
		
		return false;
	},
	
	getAbsoluteProximity = function(a, b) {
		var x = Math.abs(a.x - b.x),
			y = Math.abs(a.y - b.y);
			
		return {
			x: x,
			y: y,
			xy: (x+y)/2
		}
	}
	
	drawCircle = function(x, y, radius, color, context) {
		if(DRAW_CIRCLES) {
			context.fillStyle = color;
			context.beginPath();
			context.arc(x, y, radius, 0, Math.PI * 2, true);
			context.closePath();
			context.stroke();
		}
	},
	
	preventDrawCollision = function(isAnimating, count) {
		var isColliding = false,
			i, num, currPlanet;
		
		count = count || 0;
		
		// Make sure we're inside the <canvas> boundaries
		if( this.x - this.radius < 0 ) {
			if(isAnimating) {
				this.velX = -this.velX;
				isColliding = true;
			}
			else {
				isColliding = true;
				this.x = this.radius;
			}
		}
		else if( this.x + this.radius > settings.canvas.width ) {
			if(isAnimating) {
				this.velX = -this.velX;
				isColliding = true;
			}
			else {
				isColliding = true;
				this.x = settings.canvas.width - this.radius;
			}
		}
		
		if(this.y - this.radius < 0) {
			if(isAnimating) {
				this.velY = -this.velY;
				isColliding = true;
			}
			else {
				isColliding = true;
				this.y = this.radius;
			}
		}
		else if(this.y + this.radius > settings.canvas.height ) {
			if(isAnimating) {
				this.velY = -this.velY;
				isColliding = true;
			}
			else {
				isColliding = true;
				this.y = settings.canvas.height - this.radius;
			}
		}

		if(isAnimating && isColliding) return;
		
		// Loop through all the planets and see if any are touching.
		// If they are, mark them red and set isColliding flag
		var absProximity;
		
		
		if(planets.length > 1) {
			for(i = 0, num = planets.length; i < num; ++i) {
				currPlanet = planets[i];
				
				if(currPlanet !== this && getProximity(this.x, this.y, this.radius, currPlanet.x, currPlanet.y, currPlanet.radius)) {
					// this.velX = -this.velX;
					// this.velY = -this.velY;
					
					if( GOBBLE_GOBBLE && isAnimating && this.radius > currPlanet.radius ) {
						// currPlanet.velX = -currPlanet.velX;
						// 	currPlanet.velY = -currPlanet.velY;
						// currPlanet.velX = currPlanet.velX > 0 ? currPlanet.velX-0.3 : currPlanet.velX+0.3;
						// currPlanet.velY = currPlanet.velY > 0 ? currPlanet.velY-0.3 : currPlanet.velY+0.3;
						
						if(currPlanet.radius - 0.4 > 1) {
							
							var a = currPlanet.area,
								b = this.area,
								c = a + b;
								d = Math.sqrt(c/Math.PI);
							
							currPlanet.radius = 0;
							this.radius += (d/5);
							// this.velX = this.velX > 0 ? this.velX - 0.01 : this.velX + 0.01;
							// this.velY = this.velY > 0 ? this.velY - 0.01 : this.velY + 0.01;
						}
						else {
							--num;
							planets.splice(i, 1);
						}
					}
					isColliding = true;
					currPlanet.color = '#f00';
				}
				else {
					if(isAnimating && DRAW_LINES) {
						absProximity = getAbsoluteProximity(this, currPlanet);
						if(absProximity.xy < PROXIMITY && absProximity.xy > 0) {
							//domLog(1 - (absProximity.xy/50).toFixed(2));
							context.beginPath();
							context.strokeStyle = 'rgba(255,0,0,' + (1 - (absProximity.xy/PROXIMITY).toFixed(2)) + ')';
							context.lineWidth = 1;
							context.moveTo(this.x, this.y);
							context.lineTo(currPlanet.x, currPlanet.y);
							context.closePath();
							context.stroke();
							
							context.strokeStyle = '#000';
						}
					}
				}
			}
		}
		
		
		if(!isAnimating) {
			if(isColliding && count < 1000) {
				++REPOSITION_COUNT;
				++count;
				this.x = (Math.random() * (settings.canvas.width + settings.bleed)) - settings.bleed/2;
				this.y = (Math.random() * (settings.canvas.height + settings.bleed)) - settings.bleed/2;
				--this.radius;
				if(this.radius < settings.planets.minSize) {
					this.radius = settings.planets.minSize;
				}
				this.color = '#f00';
				// We're colliding, so recursively try this again.
				arguments.callee.call(this, isAnimating, count);
			}
			else if(isColliding && count >= 1000) {
				this.color = '#f00';
				this.isColliding = true;
			}
			else if(!isColliding) {
				this.color = '#000';
			}
		}
		// else if(isAnimating && isColliding){
		// 	if(this.radius - 0.1 > settings.planets.minSize) {
		// 		//this.radius -= 0.1;
		// 	}
		// }
	},
	
	Particle = function(x, y, mass, noCollide, initialVel) {
		this.active = false;		
		this.mass = mass;
		this.radius = mass / 40;
		
		this.area = Math.PI * (this.radius * this.radius);
		
		domLog('r: ' + this.radius + ', ' + 'area: ' + this.area);
		
		this.color = '#000';
		this.x = x || (Math.random() * (settings.canvas.width + settings.bleed)) - settings.bleed/2;
		this.y = y || (Math.random() * (settings.canvas.height + settings.bleed)) - settings.bleed/2;
		
		this.velX = initialVel || ((Math.random() * this.radius) - (this.radius/2))/2;
		this.velY = initialVel || ((Math.random() * this.radius) - (this.radius/2))/2;
		
		if(noCollide) {
			preventDrawCollision.call(this);
		}
	},
	/**
	*	Events object. Holds all events (currently mouse events)
	*/
	events = {
		mousemove: function(e) {
			mousePos = {
				x: e.pageX,
				y: e.pageY
			};
		},
		mousedown: function() {
			isMouseDown = true;
		},
		mouseup: function() {
			isMouseDown = false;
		}
	};


/**
*	Make the <canvas> element.
*/
function makeCanvas() {
	canvas = document.createElement('canvas');
	canvas.width = settings.canvas.width = window.innerWidth;
	canvas.height = settings.canvas.height = window.innerHeight;
	
	settings.canvas.halfWidth = window.innerWidth/2;
	settings.canvas.halfHeight = window.innerHeight/2;
	
	context = canvas.getContext('2d');
	document.body.appendChild(canvas);
}

/**
*	Make the 'planets'
*/
function makePlanets() {
	var i, p = settings.planets,
		num = p.numPlanets,
		planet;
	
	for(i = 0; i < num; ++i) {
		planet = new Particle(false, false, getRandomNumber(p.minSize, p.maxSize) * 40, true);
		if(!planet.isColliding) {
			planets.push(planet);
		}
	}
}

function movePlanets(planet) {
	planet.velX *= DECELERATION;
	planet.velY *= DECELERATION;
	
	planet.x += planet.velX;
	planet.y += planet.velY;
}

function clearCanvas() {
	context.fillStyle = '#fff';
	context.fillRect(0, 0, settings.canvas.width, settings.canvas.height);
}

function drawPlanets() {
	var i, numStars = planets.length,
		currentStar, w = settings.canvas.width, 
		h = settings.canvas.height;
	 
	for(i = 0; i < numStars; ++i) {
		currentStar = planets[i];
		if(currentStar.x > 0 || currentStar.x < w || currentStar.y > 0 || currentStar < h) { 
			drawCircle(currentStar.x, currentStar.y, currentStar.radius, currentStar.color, context);
		}
		
		//if(i === 0) {
			movePlanets(currentStar);
		//}

		preventDrawCollision.call(currentStar, true);
		numStars = planets.length;
	}
	var t = Date.now();
	
	REPOSITION_TIME = (t - startDrawTime);
	
	//log(REPOSITION_COUNT + ' reposition calculations in ' + REPOSITION_TIME + 'ms');
}

function draw() {
	if(settings.canvas.clearCanvas) {
		clearCanvas();
	}
	
	drawPlanets();
	
	setTimeout(arguments.callee, settings.canvas.updateRate);
}
	
var main = function() {
	
	domLogElement = document.createElement('p');
	domLogElement.style.position = 'absolute';
	document.body.appendChild(domLogElement);
	
	document.body.addEventListener('mousedown', events.mousedown, false);
	document.body.addEventListener('mousemove', events.mousemove, false);
	document.body.addEventListener('mouseup', events.mouseup, false);
	makeCanvas();
	
	startDrawTime = Date.now();
	
	makePlanets();
	draw();
};

window.addEventListener('load', main, false);