Site = new Object();

Site.Generation = false;
Site.ImageColor = {
    R: 0,
    G: 0,
    B: 0
};
Site.Config = {};

/* - Execute on page is Ready - */
Site.OnReady = function(){
    $('#color-picker').colorpicker();
    $('#btnExecute').click(function(){
        Site.Start();
    });
    $('#process-card #show-history').click(function(){
        $('#process-card #history').show();
        $('#process-card #hide-history').show();
        $('#process-card #show-history').hide();
    });

    $('#process-card #hide-history').click(function(){
        $('#process-card #history').hide();
        $('#process-card #hide-history').hide();
        $('#process-card #show-history').show();
    });
}

/* - Start the executation - */
Site.Start = function(){
    $('#btnExecute').attr('disabled', 'disable');
    Site.Clear();

    //Load the selected color 
    var rgbaColor = $('#config-card #color-picker').data('colorpicker').color.toRGB();

    Site.ImageColor = {
        R: rgbaColor.r,
        G: rgbaColor.g,
        B: rgbaColor.b
    }

    var populationSize = parseInt($('#config-card #populationSize').val(),10);
    if(isNaN(populationSize) || populationSize <= 0){
        alert("Population size must to be mora than 0.");
        return;
    }

    var mutationProbability = parseFloat($('#config-card #mutationProbability').val());
    if(isNaN(mutationProbability) || mutationProbability <= 0){
        alert("Mutation probability must to be mora than 0.");
        return;
    }

    var maximumGeneration = parseInt($('#config-card #maximumGeneration').val(), 10);
    if(isNaN(maximumGeneration) || maximumGeneration <= 100){
        alert("Mutation probability must to be mora than 100.");
        return;
    }

    var errorMargin =  parseFloat($('#config-card #errorMargin').val());
    if(isNaN(errorMargin) || errorMargin <= 0 || errorMargin >= 100){
        alert("Error margin must to be mora than 0 and less than 100.");
        return;
    }

    var delay =  parseInt($('#config-card #delay').val(), 10);
    if(isNaN(delay) || delay < 0 ){
        alert("Delay must to be mora than 0.");
        return;
    }

    var seed = parseInt($('#config-card #seed').val(), 10);
    if(!isNaN(seed) && seed > 0)
        MyGA.Random.SetSeed(seed);

	if (MyGA.Random.Seed == undefined)
        MyGA.Random.SetSeed(parseInt(Math.random() * 100000))

    $("#process-card #seed").val(MyGA.Random.Seed);

    Site.Config = {
        GenerationBetterFitness: 100 - errorMargin,
        PopulationSize: populationSize, //Tamanho da população (no caso, em pixels)
        PopulationMutationProvability: mutationProbability, //Provabilidade de mutação da população
        GenesSize: 3, //Tamanho dos genes, no caso, 3(RGB)
        GenerationMaximumIndex: maximumGeneration, //Numero máximos de interações até desistir
        DelayBetweenGenerations: delay,
        Events : {
            OnSubjectFitness: Site.OnSubjectFitness,
            OnValidateGeneration: Site.OnValidateGeneration,
            OnGenerateRandomGeneValue: Site.OnGenerateRandomGeneValue,
            OnFinish: Site.OnFinish
        }
    }

	Site.Generation = new MyGA.Controller.Generation(Site.Config);
	Site.Generation.Start();
}








/* - Restart the page - */
Site.Clear = function(){
    
}


Site.OnGenerateRandomGeneValue = function() {
	/*
        A cada Gene novo gerado, ele precisa pegar seu valor randômico.
        Esta função entrega o valor de acordo com as caracteristicas do software
    */
    return parseInt(MyGA.Random.Get() * 256);
}

Site.BetterGenerationIndex = 0;
Site.BetterGenerationFitness = 0;
Site.OnValidateGeneration = function(generation){
	/*
	    A cada ciclo completado, a população é validade para saber se 
	    é uma população boa ou não.
	    Retorne True para a população que satisfaz os requisitos de qualidade.
	*/
    var fitnessPercentage = 0;
    var sumSubjectFitness = 0;
    var population = generation.Population;
    var arrImage = new Array();
	var count = 0;
	for(var i = 0; i < population.Subjects.length; i++){
        var subjectFitness = population.Subjects[i].Fitness();
		//if(subjectFitness > Site.Config.GenerationBetterFitness) //porcentagem de precisão da cor
		//	count++; //conta quantos são meias aptos nesta geração

        sumSubjectFitness += subjectFitness;

        arrImage.push([
            population.Subjects[i].Genes[0].Value,
            population.Subjects[i].Genes[1].Value,
            population.Subjects[i].Genes[2].Value,
        ]);
	}

    var fitnessPercentage = sumSubjectFitness / population.Subjects.length;
    
    //Deseha os itens
    var histId = "hist"+generation.CurrentIndex;
    $('#process-card #history').append('<tr><td>'+generation.CurrentIndex+'</td><td><div id="'+histId+'" class="pixelWrap"></div></td><td>'+fitnessPercentage+'%</td></tr>');
    Site.DrawArrayToImage($("#"+histId), arrImage);
    Site.DrawCurrentGeneratioColor(generation);

    $('#process-card #generation-number').val(generation.CurrentIndex);

    
    if(sumSubjectFitness >=  Site.BetterGenerationFitness){
        Site.BetterGenerationFitness = sumSubjectFitness;
        Site.BetterGenerationIndex = generation.CurrentIndex;
        $('#process-card #better-generation-number').val(Site.BetterGenerationIndex);
        $('#process-card #better-generation-fitness').val(fitnessPercentage);
    }
    $('#process-card #fitness-bar').css('width', fitnessPercentage + '%');
    $('#process-card #fitness-value').html(fitnessPercentage);

    return fitnessPercentage > Site.Config.GenerationBetterFitness;
	//return count >= population.Subjects.length - parseInt(population.Subjects.length * Site.Config.PopulationMutationProvability/100); //se o totão de aptos for maior que tolerância de mutação
}

Site.OnSubjectFitness = function(subject) {
	/* 
		Subject Fitness é a aptidão de um indivíduo dentro da população.

		O individuos recebem uma nota, quando maior sua nota, maior será sua chance de ser selecionado
		Metodo de Roleta:
		   Cada individuo recebe 1 ticket + sua nota para entrar na roleta.

	    Dica importante: Não usar propriedades randômicas no Fitness, pois o Fitness é acessado N vezes pelo sistema,
	    e se em cada vez que ele for acessado ele estiver com um valor diferente, o sistema não consiguirá 
	    calcular realmente sua aptidão.
	*/
    var subjectIndex = subject.Population.Subjects.indexOf(subject);

    var redDiff = Math.abs(Site.ImageColor.R - subject.Genes[0].Value);
    var greeDiff = Math.abs(Site.ImageColor.G - subject.Genes[1].Value);
    var blueDiff = Math.abs(Site.ImageColor.B - subject.Genes[2].Value);
    
    subject.Genes[0].Fitness = parseInt((255 - redDiff));
    subject.Genes[1].Fitness = parseInt((255 - greeDiff));
    subject.Genes[2].Fitness = parseInt((255 - blueDiff));

    /* POR MEDIA */
    /*var media = (parseInt(255 - redDiff) + parseInt(255 - greeDiff) + parseInt(255 - blueDiff)) / 3;
    var fitness = parseInt((media*100/255));*/

    /* por total de diferenca e porcentagem */
    var valortotal = 255*3;
    var sum = (subject.Genes[0].Fitness + subject.Genes[1].Fitness + subject.Genes[2].Fitness);
    var fitness = sum*100/valortotal;

    return fitness;
}

/* - On generation finish - */
Site.OnFinish = function(generation){
    Site.DrawCurrentGeneratioColor(generation);
    $('#btnExecute').removeAttr('disabled');
}

Site.DrawCurrentGeneratioColor = function(generation){
    var sumR = 0;
    var sumG = 0;
    var sumB = 0;
    
    generation.Population.Subjects.forEach(function(n, m){
        sumR += n.Genes[0].Value;
        sumG += n.Genes[1].Value;
        sumB += n.Genes[2].Value;           
    });
    
    sumR = parseInt(sumR/generation.Population.Subjects.length)
    sumG = parseInt(sumG/generation.Population.Subjects.length)
    sumB = parseInt(sumB/generation.Population.Subjects.length)

    $('#process-card #current-color').html('<div style="background-color: rgb(' + sumR + ',' + sumG + ',' + sumB + ');" class="large-pixel"></div>')
}

Site.ShowCurrentPopulation = function(){
    for (var i = 0; i < Site.Generation.Population.Subjects.length; i++) {
        console.info(Site.Generation.Population.Subjects[i].Fitness());

        for (var j = 0; j < Site.Generation.Population.Subjects[i].Genes.length; j++) {
            console.info(Site.Generation.Population.Subjects[i].Genes[j]);
        }
    }
}

Site.DrawArrayToImage = function(target, arr) {
    target.html("");
    arr.forEach(function (a, b) {
        target.append('<div style="background-color: rgb(' + a[0] + ',' + a[1] + ',' + a[2] + ');" class="pixel"></div>');
    });
}

