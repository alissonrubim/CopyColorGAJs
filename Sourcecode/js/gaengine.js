/* 
    v1.0.0 
    Created by: Alisson Rubim
*/

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
GAEngine.Generation = function(args){
    var NPrivate = {}, NPublic = this;

    NPrivate.mainThread = null; 
    NPrivate.currentIndex = 0;

    NPublic.Delay = 0;  
    NPublic.Debug = 0;
    NPublic.FitnessTarget = 0;
    NPublic.MaximumIndexToGiveUp = 0;
    NPublic.Events = {
        OnCalculateFitness: false,
        OnGiveUp: false,
        OnComplete: false,
        OnStop: false
    };

    NPublic.Population = {
        SubjectsSize: 0,
        MutationProvability: 0,
        Subject: {
            GenesSize: 0,
            Events: {
                OnCalculateFitness: false
            },
            Gene: {
                Events: {
                    OnCreateRandomGeneValue: false
                }
            }
        }
    }

    NPublic.Constructor = function (args) {
        NPublic.Delay = args.Delay || NPublic.Delay;
        NPublic.Debug = args.Debug || NPublic.Debug;
        NPublic.Events = args.Events || NPublic.Events;
        NPublic.FitnessTarget = args.FitnessTarget || NPublic.FitnessTarget;
        NPublic.MaximumIndexToGiveUp = args.MaximumIndexToGiveUp || NPublic.MaximumIndexToGiveUp;

        NPublic.Population = new GAEngine.Population({
            Generation: NPublic,
            SubjectsSize: args.Population.SubjectsSize,
            MutationProvability: args.Population.MutationProvability,
            Subject: {
                GenesSize: args.Population.Subject.GenesSize,
                Events: {
                    OnCalculateFitness: args.Population.Subject.Events.OnCalculateFitness
                },
                Gene: {
                    Events: {
                        OnCreateRandomGeneValue: args.Population.Subject.Gene.Events.OnCreateRandomGeneValue
                    }
                }
            }
        });

        NPrivate.mainThread = new GAEngine.Thread.Thread({
            OnLoop: NPrivate.threadLoop,
            Delay: NPublic.Delay
        });

        GAEngine.Log.Debug = NPublic.Debug;

        return NPublic;
    }

    NPublic.Start = function(){
        //Step 01 - Inicialization
        NPublic.Population.GenerateRandomSubjects(NPublic.Population.SubjectsSize);
        NPrivate.mainThread.Start();
    }

    NPublic.Stop = function(){
        GAEngine.Log.Info('The program was stoped!');
        NPrivate.mainThread.Stop();
        NPublic.Events.OnStop(NPublic);
    }


    NPublic.GetCurrentIndex = function(){
        return NPrivate.currentIndex;
    }


    NPrivate.threadLoop = function(){
        //Step 02 - Validadte
        var isValid = NPublic.Events.OnCalculateFitness(NPublic) >= NPublic.FitnessTarget;

        var isMaximumIndex = NPrivate.currentIndex == NPublic.MaximumIndexToGiveUp;

        if (NPublic.Population.Subjects.length < NPublic.Population.SubjectsSize)
            throw "The population is smallest than the SubjectsSize configuration";

        if(isMaximumIndex || isValid){
            GAEngine.Log.Info("Used seed: " + GAEngine.Random.Seed);

            NPrivate.mainThread.Stop();

            if (isMaximumIndex){
                GAEngine.Log.Info('The program rechead the MaximumIndexToGiveUp, that is ' + NPublic.MaximumIndexToGiveUp + ' generations');
                NPublic.Events.OnGiveUp(NPublic);
            }
            else {
                GAEngine.Log.Info('The program found the best generation, that is ' + NPrivate.currentIndex + ' generation');
                NPublic.Events.OnComplete(NPublic);
            }
        }else{
            //Start a new generation...
            NPrivate.currentIndex++;
            GAEngine.Log.Info('Generation ' + NPrivate.currentIndex + ' started:');

            //Step 03 - Selection
            GAEngine.Log.Info('    - Selecting subjects...');
            NPublic.Population.DoSelect();

            //Step 04 - CrossOver
            GAEngine.Log.Info('    - Cross-over subjects...');
            NPublic.Population.DoCrossOver();

            //Step 05 - Mutation
            GAEngine.Log.Info('    - Mutating subjects...');
            NPublic.Population.DoMutation();

            GAEngine.Log.Info('    - Generation ' + NPrivate.currentIndex + ' successfully finished.');
        }
    }

    return NPublic.Constructor(args);
};

GAEngine.Population = function(args){
    var NPrivate = {}, NPublic = this;

    NPublic.Generation = null;
    NPublic.MutationProvability = 0;
    NPublic.Subjects = new Array();
    NPublic.SubjectsSize = 0;
    NPublic.Subject = {
        GenesSize: 0,
        Events: {
            OnCalculateFitness: false
        },
        Gene: {
            Events: {
                OnCreateRandomGeneValue: false
            }
        }
    }

    NPublic.Constructor = function (args) {
        NPublic.Generation = args.Generation || NPublic.Generation;
        NPublic.Subject = args.Subject || NPublic.Subject;
        NPublic.Subjects = args.Subjects || NPublic.Subjects;
        NPublic.SubjectsSize = args.SubjectsSize || NPublic.SubjectsSize;
        NPublic.MutationProvability = args.MutationProvability || NPublic.MutationProvability;
        
        if(NPublic.Generation ==  null)
            throw "The generation can't be null";

        return NPublic;
    }

    NPublic.GenerateRandomSubjects = function(numberOfSubjects){
        NPublic.SubjectsSize = numberOfSubjects;
        GAEngine.Array.Clear(NPublic.Subjects);
        for (var i = 0; i < NPublic.SubjectsSize; i++) {
            var subject = NPrivate.createSubject();
            subject.GenerateRandomGenes(NPublic.Subject.GenesSize);
            NPublic.Subjects.push(subject);
        }
        GAEngine.Log.Info('Population was successfully inicializated with ' + NPublic.Subjects.length + ' subjects.');
    }

    NPublic.DoSelect = function(){
        var eligibleSubjects = new Array();
        while (eligibleSubjects.length < NPublic.Subjects.length) {
            var subjectsFitnessSum = NPublic.Subjects.reduce((a, b) => a + b.GetFitness() + 1, 0); //Sum all subjects fitness
            var randomRoulleteNumber = GAEngine.Random.Get() * subjectsFitnessSum + 1; //Generate a random number for the roullete

            for (var i = 0; i < NPublic.Subjects.length; i++) {
                randomRoulleteNumber -= NPublic.Subjects[i].GetFitness();
                if (randomRoulleteNumber < 1) {
                    eligibleSubjects.push(NPublic.Subjects[i]);
                    break;
                }
            }
        }

        NPublic.Subjects = eligibleSubjects;
    }

    NPublic.DoCrossOver = function(){
        var fatherArray = GAEngine.Array.Clone(NPublic.Subjects);
        var motherArray = GAEngine.Array.Shuffle(NPublic.Subjects);

        var subjectsSize = NPublic.Subjects.length;
        GAEngine.Array.Clear(NPublic.Subjects);

        //Cross-over the subjects
        for (var i = 0; i < subjectsSize; i++) {
            //Randomize an Cut Point
            var cutPoint = parseInt(GAEngine.Random.Get() * NPublic.Subject.GenesSize);

            var newSubject = NPrivate.createSubject();
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

            NPublic.Subjects.push(newSubject);
        }
    }

    NPublic.DoMutation = function(){
        if(NPublic.MutationProvability > 0){
            for (var i = 0; i < NPublic.Subjects.length; i++) {
                var rand = parseInt(GAEngine.Random.Get() * 100);
                if (rand <= NPublic.MutationProvability) {
                    var mutationIntencity = parseInt(GAEngine.Random.Get() * NPublic.Subject.GenesSize);
                    for (var j = 0; j < mutationIntencity; j++) {
                        NPublic.Subjects[i].CreateGene(parseInt(GAEngine.Random.Get() * NPublic.Subject.GenesSize));
                    }
                }
            }
        }
    }

    NPrivate.createSubject = function(){
        return new GAEngine.Subject({
            Population: NPublic,
            GenesSize: NPublic.Subject.GenesSize,
            Events: {
                OnCalculateFitness: NPublic.Subject.Events.OnCalculateFitness
            },
            Gene: {
                Events: {
                    OnCreateRandomGeneValue: NPublic.Subject.Gene.Events.OnCreateRandomGeneValue,
                }
            }
        });
    }

    return NPublic.Constructor(args);
};

GAEngine.Subject = function(args){
    var NPrivate = {}, NPublic = this;

    NPublic.Genes = new Array();
    NPublic.Population = null;
    NPublic.GenesSize = 0;
    NPublic.Events = {
        OnCalculateFitness: false
    };
    NPublic.Gene = {
        Events: {
            OnCreateRandomGeneValue: false
        }
    }

    NPrivate.fitness = null;

    NPublic.Constructor = function (args) {
        NPublic.Genes = args.Genes || NPublic.Genes;
        NPublic.Population = args.Population || NPublic.Population;
        NPublic.GenesSize = args.GenesSize || NPublic.GenesSize;
        NPublic.Events = args.Events || NPublic.Events;
        NPublic.Gene = args.Gene || NPublic.Gene;

        if(NPublic.Population == null)
            throw "The population can't be null";

        return NPublic;
    }

    NPublic.GenerateRandomGenes = function(numberOfGenes){
        NPublic.GenesSize = numberOfGenes;
        GAEngine.Array.Clear(NPublic.Genes);
        for (var i = 0; i < NPublic.GenesSize; i++)
            NPublic.CreateGene(i);
    }

    NPublic.GetFitness = function(){
        if(NPrivate.fitness == null)
            NPrivate.fitness = NPublic.Events.OnCalculateFitness(NPublic);

        if (isNaN(NPrivate.fitness))
            throw "The Fitness is not a valid number";

        if (NPrivate.fitness < 0)
            throw "The Fitness can't be a negative number!";

        return NPrivate.fitness;
    }

    NPublic.CreateGene = function(index){
        var gene = new GAEngine.Gene({
            Subject: NPublic,
            Index: index,
            Events: {
                OnCreateRandomGeneValue: NPublic.Gene.Events.OnCreateRandomGeneValue
            }
        });
        gene.CreateRandomValue();
        NPublic.Genes[index] = gene;
        return gene;
    }

    return NPublic.Constructor(args);
}

GAEngine.Gene = function (args) {
    var NPrivate = {}, NPublic = this;

    NPublic.Value = null;
    NPublic.Fitness = 0;
    NPublic.Index = 0;
    NPublic.Subject = null;
    NPublic.Events = {
        OnCreateRandomGeneValue: false
    }

    NPublic.Constructor = function (args) {
        NPublic.Value = args.Value || NPublic.Value;
        NPublic.Fitness = args.Fitness || NPublic.Fitness;
        NPublic.Index = args.Index || NPublic.Index;
        NPublic.Events = args.Events || NPublic.Events;
        NPublic.Subject = args.Subject  || NPublic.Subject;

        return NPublic;
    }

    NPublic.CreateRandomValue = function(){
        NPublic.Value = NPublic.Events.OnCreateRandomGeneValue(NPublic);
        return NPublic.Value;
    }

    return NPublic.Constructor(args);
};

/********************************************************
    Array Auxiliation
********************************************************/
GAEngine.Array = new Object();
GAEngine.Array.Clone = function (arr) {
    return arr.slice(0);
}

GAEngine.Array.Clear = function (arr) {
    return arr.splice(0);
}

GAEngine.Array.Shuffle = function (arr) {
    var newArr = GAEngine.Array.Clone(arr);
    for (var i = newArr.length - 1; i > 0; i--) {
        var j = Math.floor(GAEngine.Random.Get() * (i + 1));
        var temp = newArr[i];
        newArr[i] = newArr[j];
        newArr[j] = temp;
    }
    return newArr;
}
/********************************************************
    Random System
********************************************************/
GAEngine.Random = new Object();
GAEngine.Random.SetSeed = function (seed) {
    GAEngine.Random.Seed = seed;
    GAEngine.Random._seedindex = GAEngine.Random.Seed;
}

GAEngine.Random.Get = function () {
    if (GAEngine.Random._seedindex == undefined)
        throw "Use GAEngine.Random.SetSeed to set a seed for the randomyc system";
    GAEngine.Random._seedindex = (GAEngine.Random._seedindex * 9301 + 49297) % 233280;
    return GAEngine.Random._seedindex / 233280;
}

GAEngine.Random.GetBetween =  function(min, max){
	return parseInt(GAEngine.Random.Get() * max) + min
}
/********************************************************
    Thread System
********************************************************/
GAEngine.Thread = new Object();
GAEngine.Thread.Thread = function (args) {
    var NPrivate = {}, NPublic = this;

    NPublic.OnLoop = null;
    NPublic.Params = null;
    NPublic.Delay = 0;

    NPrivate.isAlive = false;
    NPrivate.isPaused = false;
    NPrivate.interval = null;

    NPublic.Constructor = function (args) {
        NPublic.OnLoop = args.OnLoop;
        NPublic.Params = args.Params;
        NPublic.Delay = args.Delay || NPublic.Delay; 
        return NPublic;
    }

    NPublic.Start = function(){
        NPrivate.isAlive = true;
        NPrivate.isPaused = false;

        var _tick = function(){
            if(NPrivate.isAlive){
                if(NPrivate.isPaused){
                    NPrivate.interval = setTimeout(_tick, 1);
                }else{
                    NPublic.OnLoop();
                    NPrivate.interval = setTimeout(_tick, NPublic.Delay);
                }
            }
        }

        NPrivate.interval = setTimeout(_tick, 0);
    }

    NPublic.Stop = function(){
        NPrivate.isAlive = false;
    }

    NPublic.Pause = function(){
        NPrivate.isPaused = true;
    }

    NPublic.Continue = function(){
        NPrivate.isPaused = false;
    }

    return NPublic.Constructor(args);
};