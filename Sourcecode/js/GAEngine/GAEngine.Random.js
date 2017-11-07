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