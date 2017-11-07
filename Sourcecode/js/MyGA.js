MyGA = new Object();

/********************************************************
    Array Auxiliation
********************************************************/
MyGA.Array = new Object();
MyGA.Array.Clone = function (arr) {
    return arr.slice(0);
}

MyGA.Array.Clear = function (arr) {
    return arr.splice(0);
}

MyGA.Array.Shuffle = function (arr) {
    var newArr = MyGA.Array.Clone(arr);
    for (var i = newArr.length - 1; i > 0; i--) {
        var j = Math.floor(MyGA.Random.Get() * (i + 1));
        var temp = newArr[i];
        newArr[i] = newArr[j];
        newArr[j] = temp;
    }
    return newArr;
}


/********************************************************
    Random System
********************************************************/
MyGA.Random = new Object();
MyGA.Random.SetSeed = function (seed) {
    MyGA.Random.Seed = seed;
    MyGA.Random._seedindex = MyGA.Random.Seed;
}

MyGA.Random.Get = function () {
    if (MyGA.Random._seedindex == undefined)
        throw "Use MyGA.Random.SetSeed to set a seed for the randomyc system";
    MyGA.Random._seedindex = (MyGA.Random._seedindex * 9301 + 49297) % 233280;
    return MyGA.Random._seedindex / 233280;
}

/********************************************************
    Log System
********************************************************/
MyGA.Log = new Object();
MyGA.Log.Info = function(){
    if(MyGA.Log.Debug)
        console.log.apply(console, arguments);
}

MyGA.Log.Debug = false;

/********************************************************
    Thread System
********************************************************/
MyGA.Thread = new Object();
MyGA.Thread.Thread = function(cfg){
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

/********************************************************
    Controller Classes
********************************************************/
MyGA.Controller = new Object();
MyGA.Controller.Generation = function(cfg){
    this._constructor = function(cfg) {
        this.Configuration = cfg;
        this.CurrentIndex = 0;
        this.MaximumIndex = this.Configuration.GenerationMaximumIndex;
        this.Population = new MyGA.Controller.Population({
            Generation: this,
            GenesSize: this.Configuration.GenesSize,
            MutationProvability: this.Configuration.PopulationMutationProvability,
            Events: {
                OnSort: this.Configuration.Events.OnPopulationSort,
                OnSubjectFitness: this.Configuration.Events.OnSubjectFitness,
                OnDiscart: this.Configuration.Events.OnPopulationDiscart,
                OnGenerateRandomGeneValue: this.Configuration.Events.OnGenerateRandomGeneValue
            }
		});
        this.Thread = new MyGA.Thread.Thread({
            OnLoop: this._threadLoop,
            Delay: this.Configuration.DelayBetweenGenerations,
            Params: {
                Generation: this
            }
        });
        MyGA.Log.Debug = this.Configuration.Debug;
	    return this;
    }

    this.Start = function() {
        //Step 01 - Inicialization
        this.Population.Initialize(this.Configuration.PopulationSize);
        this.Thread.Start();
    }

    this.Stop = function(){
        MyGA.Log.Info('The program was stoped!');
        this.Thread.Stop();
        this.Configuration.Events.OnStop(this);
    }

    //Private
    this._threadLoop = function(){
        var self = this.Params.Generation;

        //Step 02 - Validadte
        var isValid = self.Configuration.Events.OnValidateGeneration(self);

        var isMaximumIndex = self.CurrentIndex == self.MaximumIndex;

        if (self.Population.Subjects.length < self.Configuration.PopulationSize)
            throw "The population is smallest than the PopulationSize configuration";

        if(isMaximumIndex || isValid){
            MyGA.Log.Info("Used seed: " + MyGA.Random.Seed);

            self.Thread.Stop();

            if (isMaximumIndex){
                MyGA.Log.Info('The program rechead the MaximumIndex, that is ' + self.MaximumIndex + ' generations');
                self.Configuration.Events.OnGiveUp(self);
            }
            else {
                MyGA.Log.Info('The program found the best generation, that is ' + self.CurrentIndex + ' generation');
                self.Configuration.Events.OnComplete(self);
            }
        }else{
            //Start a new generation...
            self.CurrentIndex++;
            MyGA.Log.Info('Generation ' + self.CurrentIndex + ' started:');

            //Step 03 - Selection
            MyGA.Log.Info('    - Selecting subjects...');
            self.Population.Select();

            //Step 04 - CrossOver
            MyGA.Log.Info('    - Cross-over subjects...');
            self.Population.CrossOver();

            //Step 05 - Mutation
            MyGA.Log.Info('    - Mutating subjects...');
            self.Population.Mutation();

            MyGA.Log.Info('    - Generation ' + self.CurrentIndex + ' successfully finished.');
        }
    }
	
	return this._constructor(cfg);
}

MyGA.Controller.Population = function(cfg){
    this._constructor = function(cfg) {
        this.Configuration = cfg;
        this.Generation = cfg.Generation;
        this.Subjects = new Array();
		return this;
    }

    this.Initialize = function(numberOfSubjects) {
        MyGA.Array.Clear(this.Subjects);
        for (var i = 0; i < numberOfSubjects; i++) {
            var subject = this._createSubject();
            subject.Initialize(this.Configuration.GenesSize)
            this.Subjects.push(subject);
        }
        MyGA.Log.Info('Population was successfully inicializated with ' + this.Subjects.length + ' subjects.');
    }

    this.Select = function() {
        //Roullete mode to select the subjects
        /*
            Make an roullete with the subjects.
            One subject can appear more than once, depending of yout fitness
        */
        var eligibleSubjects = new Array();
        while (eligibleSubjects.length < this.Subjects.length) {
            var subjectsFitnessSum = this.Subjects.reduce((a, b) => a + b.Fitness() + 1, 0); //Sum all subjects fitness
            var randomRoulleteNumber = MyGA.Random.Get() * subjectsFitnessSum + 1; //Generate a random number for the roullete

            for (var i = 0; i < this.Subjects.length; i++) {
                randomRoulleteNumber -= this.Subjects[i].Fitness();
                if (randomRoulleteNumber < 1) {
                    eligibleSubjects.push(this.Subjects[i]);
                    break;
                }
            }
        }

        this.Subjects = eligibleSubjects;
    }

    this.CrossOver = function() {
        var fatherArray = MyGA.Array.Clone(this.Subjects);
        var motherArray = MyGA.Array.Shuffle(this.Subjects);

        var subjectsSize = this.Subjects.length;
        MyGA.Array.Clear(this.Subjects);

        //Cross-over the subjects
        for (var i = 0; i < subjectsSize; i++) {
            //Randomize an Cut Point
            var cutPoint = parseInt(MyGA.Random.Get() * this.Configuration.GenesSize);

            var newSubject = this._createSubject();
            var firstArray = new Array();
            var secoundArray = new Array();

            //Se the array order
            if (parseInt(MyGA.Random.Get() * 2) == 0) {
                firstArray = fatherArray;
                secoundArray = motherArray;
            } else {
                firstArray = motherArray;
                secoundArray = fatherArray;
            }

            //Create the array parts
            var firstPartArray = firstArray[i].Genes.slice(0, cutPoint);
            var secoundPartArray = new Array().concat(secoundArray[i].Genes.slice(cutPoint));

            function pushGene(currentGene, currentIndex, oppositeArray) {
                var sumFitness = currentGene.Fitness + oppositeArray[i].Genes[currentIndex].Fitness;
                var randomNumber = parseInt(MyGA.Random.Get() * sumFitness);
                if (randomNumber < currentGene.Fitness)
                    newSubject.Genes[currentIndex] = currentGene;
                else
                    newSubject.Genes[currentIndex] = oppositeArray[i].Genes[currentIndex];
            }
  
            firstPartArray.forEach(function (a, b) {
                pushGene(a, b, secoundArray);
            });

            secoundPartArray.forEach(function (a, b) {
                pushGene(a, b + cutPoint, firstArray);
            });

            this.Subjects.push(newSubject);
        }
    }

    this.Mutation = function() { 
        if(this.Configuration.MutationProvability > 0){
            for (var i = 0; i < this.Subjects.length; i++) {
                var rand = parseInt(MyGA.Random.Get() * 100);
                if (rand <= this.Configuration.MutationProvability) {
                    var mutationIntencity = parseInt(MyGA.Random.Get() * this.Configuration.GenesSize);
                    for (var j = 0; j < mutationIntencity; j++) {
                        this.Subjects[i].Genes[parseInt(MyGA.Random.Get() * this.Configuration.GenesSize)] = new MyGA.Controller.Gene({
                            Value: this.Subjects[i].GetRandomGeneValue()
                        });
                    }
                }
            }
        }
    }

    //Private
    this._createSubject = function() {
        return new MyGA.Controller.Subject({
            Population: this,
            Events: {
                OnFitness: this.Configuration.Events.OnSubjectFitness,
                OnGenerateRandomGeneValue: this.Configuration.Events.OnGenerateRandomGeneValue,
            }
        });
    }
	
	return this._constructor(cfg);
}

MyGA.Controller.Subject = function(cfg){
    this._constructor = function(cfg) {
        this.Configuration = cfg;
        this.Genes = new Array();
        this.Population = this.Configuration.Population;
		return this;
    }

    this.Initialize = function(numberOfGenes) {
        MyGA.Array.Clear(this.Genes);
        for (var i = 0; i < numberOfGenes; i++) {
            var gene = new MyGA.Controller.Gene({
                Value: this.GetRandomGeneValue()
            });
            this.Genes.push(gene);
        }
    }

    this.Fitness = function() {
        var fitness = this.Configuration.Events.OnFitness(this);
        if (isNaN(fitness))
            throw "The Fitness is not a valid number";
        return fitness;
    }

    this.GetRandomGeneValue = function() {
        return this.Configuration.Events.OnGenerateRandomGeneValue();
    }
	
	return this._constructor(cfg);
}


MyGA.Controller.Gene = function(cfg){
    this._constructor = function(cfg) {
        this.Value = cfg.Value;
        this.Fitness = 0;
		return this;
    }
	
	return this._constructor(cfg);
}

