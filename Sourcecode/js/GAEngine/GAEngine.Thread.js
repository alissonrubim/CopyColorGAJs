/********************************************************
    Thread System
********************************************************/
GAEngine.Thread = new Object();
GAEngine.Thread.Thread = function (args) {
    var private = {}, public = this;

    public.OnLoop = null;
    public.Params = null;
    public.Delay = 0;

    private.isAlive = false;
    private.isPaused = false;
    private.interval = null;

    public.Constructor = function (args) {
        public.OnLoop = args.OnLoop;
        public.Params = args.Params;
        public.Delay = args.Delay || public.Delay; 
        return public;
    }

    public.Start = function(){
        private.isAlive = true;
        private.isPaused = false;

        var _tick = function(){
            if(private.isAlive){
                if(private.isPaused){
                    private.interval = setTimeout(_tick, 1);
                }else{
                    public.OnLoop();
                    private.interval = setTimeout(_tick, public.Delay);
                }
            }
        }

        private.interval = setTimeout(_tick, 0);
    }

    public.Stop = function(){
        private.isAlive = false;
    }

    public.Pause = function(){
        private.isPaused = true;
    }

    public.Continue = function(){
        private.isPaused = false;
    }

    return public.Constructor(args);
};