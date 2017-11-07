/********************************************************
    Thread System
********************************************************/
GAEngine.Thread = new Object();
GAEngine.Thread.Thread = function(cfg){
    this._constructor = function(cfg) {
        this.OnLoop = cfg.OnLoop;
        this.Params = cfg.Params;
        this.Delay = cfg.Delay || 0; 
    }

    this.Start = function(){
        this.IsAlive = true;
        var self = this;

        var _tick = function(){
            if(self.IsAlive){
                self.OnLoop();
                self._interval = setTimeout(_tick, self.Delay);
            }
        }

        self._interval = setTimeout(_tick, 0);
    }

    this.Stop = function(){
        this.IsAlive = false;
    }

    return this._constructor(cfg);
}