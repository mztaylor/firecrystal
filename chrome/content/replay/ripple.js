var EXPORTED_SYMBOLS = ['RippleFactory'];
function RippleFactory(window, document) {
var Ripple = {
    COLOR : [255,128,0],    /* color in RGB */
    R : 100,              /* ripple radius */
    T : 50,               /* animation timesteps */
    HALF_OSCIL_NUM : 4,   /* number of half oscillations in T / angular velocity = HALF_OSCIL_NUM*PI/T */
    RESOLUTION : 32,      /* number of ColorStops to form gradient */

    ripplets : [],
    timer : null,
    cache : {},

    getRGBA : function(r,g,b,a){
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a +')';
    },

    /* ripplet generating function : time -> height */
    generator : function(t){
      return Math.pow(Math.sin(t*this.HALF_OSCIL_NUM*Math.PI/this.T),2).toFixed(2);
    },

    /* height of ripplet : (distance, time) -> height */
    dampedHeight : function(r,t){
      var R = this.R, T = this.T;
      if (r > t*R/T) return 0;
      return this.generator(t-T*r/R) * (R-r)/R * (1-t/T);
    },

    /* may be replaced by custom function depending on color scheme of your choice */
    height2color : function(h){
      return this.getRGBA(this.COLOR[0],this.COLOR[1],this.COLOR[2],h);
    },

    /* get height and convert to color : (distance, time) -> color */
    getColorAt : function(r,t){
      return this.height2color(this.dampedHeight(r,t));
    },

    /* set gradients for a state of ripple : (CanvasGradient,time) -> null */
    setGradient : function(grad,t){
      var num = this.RESOLUTION - 1;
      for (var i=0;i<=num;i++) {
        grad.addColorStop( i/num , this.getColorAt(this.R*i/num,t) );
      }
    },

    /* start and/or continue animation */
    animate : function(){
      if (this.timer) {
        var n = this.ripplets.length;
        while (n--) {
          var ripplet = this.ripplets[n];
          ripplet.evolve();
          if (ripplet.t == this.T) {
            ripplet.finalize();
            this.ripplets.splice(n,1);
          }
        }
        if (!this.ripplets.length) {
          window.clearInterval(this.timer);
          this.timer = null;
        }
      } else {
        var self = this;
        this.timer = window.setInterval(function(){self.animate()},50);
      }
    },

    /* add new Ripplet instance to the stack */
    setRipplet : function(x,y){
      this.ripplets.push(new this.Ripplet(x,y));
      this.animate();
    },

    finalize : function(){
      this.ripplets = [];
      this.timer = null;
      for(var x in this.cache) if(this.cache.hasOwnProperty(x)){
        delete x;
      }
      this.cache = {};
    }

  };

  /* Ripplet class */
  Ripple.Ripplet = function(x,y){
    var R = Ripple.R;
    this.x = x;
    this.y = y;
    this.t = 0;
    var canvas = this.canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.style.zIndex = "1410065407";
    canvas.style.position = 'absolute';
    canvas.style.left = x - R + 'px';
    canvas.style.top = y - R + 'px';
    canvas.width = R*2;
    canvas.height = R*2;
    this.ctx = canvas.getContext('2d');
    this.ctx.clearRect(0,0,2*R,2*R);
  };

  Ripple.Ripplet.prototype = {
    evolve : function(){
      var ctx = this.ctx;
      var R = Ripple.R;
      ctx.clearRect(0,0,2*R,2*R);
      if (Ripple.cache[this.t]) {
        ctx.drawImage(Ripple.cache[this.t], 0, 0);
      } else {
        var R = Ripple.R;
        ctx.beginPath();
        var grad = ctx.createRadialGradient(R,R,0,R,R,R);
        Ripple.setGradient(grad,this.t);
        ctx.fillStyle = grad;
        ctx.rect(0,0,2*R,2*R);
        ctx.fill();

        var canvas2 = document.createElement('canvas');
        canvas2.height = this.canvas.height;
        canvas2.width = this.canvas.width;
        var ctx2 = canvas2.getContext('2d');
        ctx2.drawImage(this.canvas,0,0);
        Ripple.cache[this.t] = canvas2;
      }
      this.t++;
    },

    finalize : function(){
      document.body.removeChild(this.canvas);
      delete this.canvas;
      delete this;
    }
  };

  /* mouse object */
  Ripple.mouse = {
    timer : null,
    x : null,
    y : null,
    isDown : false,

    delegate : function(event){
      if (!event) event = window.event;
      Ripple.mouse[event.type](event);
    },
    
    mousedown : function(event){
      if(event.preventDefault){
        event.preventDefault();
      } else {
        event.returnValue = false;
      }
      this.x = event.clientX;
      this.y = event.clientY;
      this.isDown = true;
      Ripple.setRipplet(this.x,this.y);

      /* set timer for mousemove */
      var self = this;
      this.timer = window.setInterval(function(){
        if(self.isDown) Ripple.setRipplet(self.x,self.y);
      },200);
    },

    mouseup : function(){
      this.isDown = false;
      if (this.timer){
        window.clearInterval(this.timer);
        this.timer = null;
      }
    },
    
    mousemove : function(event){
      if(this.isDown) {
        this.x = event.clientX;
        this.y = event.clientY;
      }
    }
  };
  Ripple.makeNewRipple = function(x,y) {
	Ripple.mouse.mousedown({clientX:x, clientY:y});
	Ripple.mouse.mouseup();
  };
  Ripple.setColor = function(color) {
	Ripple.COLOR = color;
	};
  return Ripple;
  }
