window.GAEngine = new Object();


/********************************************************
    Log System
********************************************************/
GAEngine.Log = new Object();
GAEngine.Log.Info = function(){
    if(GAEngine.Log.Debug)
        console.log.apply(console, arguments);
}

GAEngine.Log.Debug = false;


/********************************************************
    Controller Classes
********************************************************/
GAEngine.Controller = new Object();
GAEngine.Controller.Generation = function(cfg){
    this._constructor = function(cfg) {
        this.Configuration = cfg;
        this.CurrentIndex = 0;
        this.MaximumIndex = this.Configuration.GenerationMaximumIndex;
        this.Population = new GAEngine.Controller.Population({
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
        this.Thread = new GAEngine.Thread.Thread({
            OnLoop: this._threadLoop,
            Delay: this.Configuration.DelayBetweenGenerations,
            Params: {
                Generation: this
            }
        });
        GAEngine.Log.Debug = this.Configuration.Debug;
	    return this;
    }

    this.Start = function() {
        //Step 01 - Inicialization
        this.Population.Initialize(this.Configuration.PopulationSize);
        this.Thread.Start();
    }

    this.Stop = function(){
        GAEngine.Log.Info('The program was stoped!');
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
            GAEngine.Log.Info("Used seed: " + GAEngine.Random.Seed);

            self.Thread.Stop();

            if (isMaximumIndex){
                GAEngine.Log.Info('The program rechead the MaximumIndex, that is ' + self.MaximumIndex + ' generations');
                self.Configuration.Events.OnGiveUp(self);
            }
            else {
                GAEngine.Log.Info('The program found the best generation, that is ' + self.CurrentIndex + ' generation');
                self.Configuration.Events.OnComplete(self);
            }
        }else{
            //Start a new generation...
            self.CurrentIndex++;
            GAEngine.Log.Info('Generation ' + self.CurrentIndex + ' started:');

            //Step 03 - Selection
            GAEngine.Log.Info('    - Selecting subjects...');
            self.Population.Select();

            //Step 04 - CrossOver
            GAEngine.Log.Info('    - Cross-over subjects...');
            self.Population.CrossOver();

            //Step 05 - Mutation
            GAEngine.Log.Info('    - Mutating subjects...');
            self.Population.Mutation();

            GAEngine.Log.Info('    - Generation ' + self.CurrentIndex + ' successfully finished.');
        }
    }
	
	return this._constructor(cfg);
}

GAEngine.Controller.Population = function(cfg){
    this._constructor = function(cfg) {
        this.Configuration = cfg;
        this.Generation = cfg.Generation;
        this.Subjects = new Array();
		return this;
    }

    this.Initialize = function(numberOfSubjects) {
        GAEngine.Array.Clear(this.Subjects);
        for (var i = 0; i < numberOfSubjects; i++) {
            var subject = this._createSubject();
            subject.Initialize(this.Configuration.GenesSize)
            this.Subjects.push(subject);
        }
        GAEngine.Log.Info('Population was successfully inicializated with ' + this.Subjects.length + ' subjects.');
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
            var randomRoulleteNumber = GAEngine.Random.Get() * subjectsFitnessSum + 1; //Generate a random number for the roullete

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
        var fatherArray = GAEngine.Array.Clone(this.Subjects);
        var motherArray = GAEngine.Array.Shuffle(this.Subjects);

        var subjectsSize = this.Subjects.length;
        GAEngine.Array.Clear(this.Subjects);

        //Cross-over the subjects
        for (var i = 0; i < subjectsSize; i++) {
            //Randomize an Cut Point
            var cutPoint = parseInt(GAEngine.Random.Get() * this.Configuration.GenesSize);

            var newSubject = this._createSubject();
            var firstArray = new Array();
            var secoundArray = new Array();

            //Se the array order
            if (parseInt(GAEngine.Random.Get() * 2) == 0) {
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
                var randomNumber = parseInt(GAEngine.Random.Get() * sumFitness);
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
                var rand = parseInt(GAEngine.Random.Get() * 100);
                if (rand <= this.Configuration.MutationProvability) {
                    var mutationIntencity = parseInt(GAEngine.Random.Get() * this.Configuration.GenesSize);
                    for (var j = 0; j < mutationIntencity; j++) {
                        this.Subjects[i].Genes[parseInt(GAEngine.Random.Get() * this.Configuration.GenesSize)] = new GAEngine.Controller.Gene({
                            Value: this.Subjects[i].GetRandomGeneValue()
                        });
                    }
                }
            }
        }
    }

    //Private
    this._createSubject = function() {
        return new GAEngine.Controller.Subject({
            Population: this,
            Events: {
                OnFitness: this.Configuration.Events.OnSubjectFitness,
                OnGenerateRandomGeneValue: this.Configuration.Events.OnGenerateRandomGeneValue,
            }
        });
    }
	
	return this._constructor(cfg);
}

GAEngine.Controller.Subject = function(cfg){
    this._constructor = function(cfg) {
        this.Configuration = cfg;
        this.Genes = new Array();
        this.Population = this.Configuration.Population;
		return this;
    }

    this.Initialize = function(numberOfGenes) {
        GAEngine.Array.Clear(this.Genes);
        for (var i = 0; i < numberOfGenes; i++) {
            var gene = new GAEngine.Controller.Gene({
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


GAEngine.Controller.Gene = function(cfg){
    this._constructor = function(cfg) {
        this.Value = cfg.Value;
        this.Fitness = 0;
		return this;
    }
	
	return this._constructor(cfg);
}

