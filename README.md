# CopyColorGAJs
CopyColorJs it's an genetic algorithm thats it's used for copy an RGB color. The logic it's show how a Genetic Algorithm works and understand your conceipt with something. This code can bem helpfull in a classing room, to show for students how you can create a selective generation of subjetcs with some fitness that you define.

## The Code
The main code was in **JavaScript**, that is the **MyGa.js** file. It's an object that contains another "classes", like Population, Subject, Gene and, of course, Generation.
The Html and CSS was using the Bootstrap 4 for a most beautiful visual design.

## How this works
You can configure a lot of things in this algoritm. Basically, you can chose the Population size, the percentual of mutations and the fitness target. You can see mora of the configuration in the table bellow:

![screenshot_configuration](http://ericlondon.com/images/google.png)

Option | Type of Value | Description
------------ | ------------- | ------------
Color | RGB Color | It's the target color of the algorithm
Population size | Integer | The size of the population in the generation. A big population results in a better fitness, but, can slow down the process 
Mutation probability | Float (0-100) | It's the probability of one subject receive an mutation in your genes.
Maximum generations to stop | Integer | The maximum cicles of generation until quit the algorithm
Seed | Integer | The seed usede for generate the random numbers in the process. Note that the seed its dependente of the every parameters on the screen 
Error margin | Float (0-100) | It's the erro that can be tolerated in the algorithm. For example: i want a color that can be 95% like the target color, so, the error margin is 5% (100-95).
Delay to execute | Integer | The delay between the generations cicles. The number represents miliseconds. 


