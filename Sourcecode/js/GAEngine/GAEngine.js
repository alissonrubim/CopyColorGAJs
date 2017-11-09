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
    var private = {}, public = this;

    private.mainThread = null; 
    private.currentIndex = 0;

    public.Delay = 0;  
    public.Debug = 0;
    public.FitnessTarget = 0;
    public.MaximumIndexToGiveUp = 0;
    public.Events = {
        OnCalculateFitness: false,
        OnGiveUp: false,
        OnComplete: false,
        OnStop: false
    };

    public.Population = {
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

    public.Constructor = function (args) {
        public.Delay = args.Delay || public.Delay;
        public.Debug = args.Debug || public.Debug;
        public.Events = args.Events || public.Events;
        public.FitnessTarget = args.FitnessTarget || public.FitnessTarget;
        public.MaximumIndexToGiveUp = args.MaximumIndexToGiveUp || public.MaximumIndexToGiveUp;

        public.Population = new GAEngine.Population({
            Generation: public,
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

        private.mainThread = new GAEngine.Thread.Thread({
            OnLoop: private.threadLoop,
            Delay: public.Delay
        });

        GAEngine.Log.Debug = public.Debug;

        return public;
    }

    public.Start = function(){
        //Step 01 - Inicialization
        public.Population.GenerateRandomSubjects(public.Population.SubjectsSize);
        private.mainThread.Start();
    }

    public.Stop = function(){
        GAEngine.Log.Info('The program was stoped!');
        private.mainThread.Stop();
        public.Events.OnStop(public);
    }

    public.GetCurrentIndex = function(){
        return private.currentIndex;
    }


    private.threadLoop = function(){
        //Step 02 - Validadte
        var isValid = public.Events.OnCalculateFitness(public) >= public.FitnessTarget;

        var isMaximumIndex = private.currentIndex == public.MaximumIndexToGiveUp;

        if (public.Population.Subjects.length < public.Population.SubjectsSize)
            throw "The population is smallest than the SubjectsSize configuration";

        if(isMaximumIndex || isValid){
            GAEngine.Log.Info("Used seed: " + GAEngine.Random.Seed);

            private.mainThread.Stop();

            if (isMaximumIndex){
                GAEngine.Log.Info('The program rechead the MaximumIndexToGiveUp, that is ' + public.MaximumIndexToGiveUp + ' generations');
                public.Events.OnGiveUp(public);
            }
            else {
                GAEngine.Log.Info('The program found the best generation, that is ' + private.currentIndex + ' generation');
                public.Events.OnComplete(public);
            }
        }else{
            //Start a new generation...
            private.currentIndex++;
            GAEngine.Log.Info('Generation ' + private.currentIndex + ' started:');

            //Step 03 - Selection
            GAEngine.Log.Info('    - Selecting subjects...');
            public.Population.DoSelect();

            //Step 04 - CrossOver
            GAEngine.Log.Info('    - Cross-over subjects...');
            public.Population.DoCrossOver();

            //Step 05 - Mutation
            GAEngine.Log.Info('    - Mutating subjects...');
            public.Population.DoMutation();

            GAEngine.Log.Info('    - Generation ' + private.currentIndex + ' successfully finished.');
        }
    }

    return public.Constructor(args);
};

GAEngine.Population = function(args){
    var private = {}, public = this;

    public.Generation = null;
    public.MutationProvability = 0;
    public.Subjects = new Array();
    public.SubjectsSize = 0;
    public.Subject = {
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

    public.Constructor = function (args) {
        public.Generation = args.Generation || public.Generation;
        public.Subject = args.Subject || public.Subject;
        public.Subjects = args.Subjects || public.Subjects;
        public.SubjectsSize = args.SubjectsSize || public.SubjectsSize;
        public.MutationProvability = args.MutationProvability || public.MutationProvability;
        
        if(public.Generation ==  null)
            throw "The generation can't be null";

        return public;
    }

    public.GenerateRandomSubjects = function(numberOfSubjects){
        public.SubjectsSize = numberOfSubjects;
        GAEngine.Array.Clear(public.Subjects);
        for (var i = 0; i < public.SubjectsSize; i++) {
            var subject = private.createSubject();
            subject.GenerateRandomGenes(public.Subject.GenesSize);
            public.Subjects.push(subject);
        }
        GAEngine.Log.Info('Population was successfully inicializated with ' + public.Subjects.length + ' subjects.');
    }

    public.DoSelect = function(){
        var eligibleSubjects = new Array();
        while (eligibleSubjects.length < public.Subjects.length) {
            var subjectsFitnessSum = public.Subjects.reduce((a, b) => a + b.GetFitness() + 1, 0); //Sum all subjects fitness
            var randomRoulleteNumber = GAEngine.Random.Get() * subjectsFitnessSum + 1; //Generate a random number for the roullete

            for (var i = 0; i < public.Subjects.length; i++) {
                randomRoulleteNumber -= public.Subjects[i].GetFitness();
                if (randomRoulleteNumber < 1) {
                    eligibleSubjects.push(public.Subjects[i]);
                    break;
                }
            }
        }

        public.Subjects = eligibleSubjects;
    }

    public.DoCrossOver = function(){
        var fatherArray = GAEngine.Array.Clone(public.Subjects);
        var motherArray = GAEngine.Array.Shuffle(public.Subjects);

        var subjectsSize = public.Subjects.length;
        GAEngine.Array.Clear(public.Subjects);

        //Cross-over the subjects
        for (var i = 0; i < subjectsSize; i++) {
            //Randomize an Cut Point
            var cutPoint = parseInt(GAEngine.Random.Get() * public.Subject.GenesSize);

            var newSubject = private.createSubject();
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

            public.Subjects.push(newSubject);
        }
    }

    public.DoMutation = function(){
        if(public.MutationProvability > 0){
            for (var i = 0; i < public.Subjects.length; i++) {
                var rand = parseInt(GAEngine.Random.Get() * 100);
                if (rand <= public.MutationProvability) {
                    var mutationIntencity = parseInt(GAEngine.Random.Get() * public.Subject.GenesSize);
                    for (var j = 0; j < mutationIntencity; j++) {
                        public.Subjects[i].CreateGene(parseInt(GAEngine.Random.Get() * public.Subject.GenesSize));
                    }
                }
            }
        }
    }

    private.createSubject = function(){
        return new GAEngine.Subject({
            Population: public,
            GenesSize: public.Subject.GenesSize,
            Events: {
                OnCalculateFitness: public.Subject.Events.OnCalculateFitness
            },
            Gene: {
                Events: {
                    OnCreateRandomGeneValue: public.Subject.Gene.Events.OnCreateRandomGeneValue,
                }
            }
        });
    }

    return public.Constructor(args);
};

GAEngine.Subject = function(args){
    var private = {}, public = this;

    public.Genes = new Array();
    public.Population = null;
    public.GenesSize = 0;
    public.Events = {
        OnCalculateFitness: false
    };
    public.Gene = {
        Events: {
            OnCreateRandomGeneValue: false
        }
    }

    private.fitness = null;

    public.Constructor = function (args) {
        public.Genes = args.Genes || public.Genes;
        public.Population = args.Population || public.Population;
        public.GenesSize = args.GenesSize || public.GenesSize;
        public.Events = args.Events || public.Events;
        public.Gene = args.Gene || public.Gene;

        if(public.Population == null)
            throw "The population can't be null";

        return public;
    }

    public.GenerateRandomGenes = function(numberOfGenes){
        public.GenesSize = numberOfGenes;
        GAEngine.Array.Clear(public.Genes);
        for (var i = 0; i < public.GenesSize; i++)
            public.CreateGene(i);
    }

    public.GetFitness = function(){
        if(private.fitness == null)
            private.fitness = public.Events.OnCalculateFitness(public);

        if (isNaN(private.fitness))
            throw "The Fitness is not a valid number";

        return private.fitness;
    }

    public.CreateGene = function(index){
        var gene = new GAEngine.Gene({
            Subject: public,
            Index: index,
            Events: {
                OnCreateRandomGeneValue: public.Gene.Events.OnCreateRandomGeneValue
            }
        });
        gene.CreateRandomValue();
        public.Genes[index] = gene;
        return gene;
    }

    return public.Constructor(args);
}

GAEngine.Gene = function (args) {
    var private = {}, public = this;

    public.Value = null;
    public.Fitness = 0;
    public.Index = 0;
    public.Subject = null;
    public.Events = {
        OnCreateRandomGeneValue: false
    }

    public.Constructor = function (args) {
        public.Value = args.Value || public.Value;
        public.Fitness = args.Fitness || public.Fitness;
        public.Index = args.Index || public.Index;
        public.Events = args.Events || public.Events;
        public.Subject = args.Subject  || public.Subject;

        return public;
    }

    public.CreateRandomValue = function(){
        public.Value = public.Events.OnCreateRandomGeneValue(public);
        return public.Value;
    }

    return public.Constructor(args);
};
