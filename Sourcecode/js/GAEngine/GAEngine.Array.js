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