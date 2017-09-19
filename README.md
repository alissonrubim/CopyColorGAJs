# CopyColorGAJs
CopyColorJs is a genetic algorithm that is used for copy a RGB color, selecting the best population. The logic is show how a genetic algorithm works and understand how this can be applied for anything. This code can be helpful in a classroom to show to the students how you can create a selective generation of subjects with some fitness that you define.

## The Code
The main code was in **MyGa.js**, that's a **JavaScript** file. The MyGa is an object that contains another classes, like Population, Subject, Gene and, of course, Generation. The Generation class is the controller of the algorithm. This class makes all the work, calling the constructors and methods on another classes.
The Html and CSS were using the Bootstrap 4 for a most beautiful visual design.

## How this works
You can configure a lot of things in this algorithm. Basically, you can choose the population size, the percentual of mutations and the fitness target. It's fun to play with, because, each configuration shows a diferents results.

![Screenshot of the configurations](https://github.com/alissonrubim/CopyColorGAJs/blob/master/Screenshots/configuration_screenshot.png)

You can see more of the configurations in the table bellow:
 
Option | Type of Value | Description
------------ | ------------- | ------------
Color | RGB Color | It's the target color of the algorithm
Population size | Integer | The size of the population in the generation. A big population results in a better fitness, but, can slow down the process. 
Mutation probability | Float (0-100) | It's the probability of one subject received a mutation in its/his genes.
Maximum generations to stop | Integer | The maximum cicles of generation until quit the algorithm.
Seed | Integer | The seed used for generate the random numbers in the process. Note that the seed is dependent of every parameters on the screen. 
Error margin | Float (0-100) | It's the error that can be tolerated in the algorithm. For example: I want a color that can be 95% like the target color, so, the error margin is 5% (100-95).
Delay to execute | Integer | The delay between the generations. The number represents milliseconds. 

## The results
You can see the process processing when the script is working. Some data is shown for you to follow the process.

![Screenshot of the configurations](https://github.com/alissonrubim/CopyColorGAJs/blob/master/Screenshots/result_screenshot.png)

Data | Description
------------ | -------------
Fitness | Show a progress bar with the current fitness in percent. You can see if your current generation is close to the fitness target.
Current generation number | The current generation number (generationIndex + 1). That's the number of generations that were created until now.
Best generation number | It's the best generation number until now.
Best generation fitness | It's the fitness of the best generation until now.
Seed | The seed used to run the current process.

### History of generations
That's the beauty of this code. You can see the history of the generations. You have the generation number (in order of creation), the population in a visual table, and the generation fitness.

![Screenshot of the configurations](https://github.com/alissonrubim/CopyColorGAJs/blob/master/Screenshots/history_screenshot.png)

You can compare the first generation with the last generation and see how the population grown up with the time:

![Screenshot of the configurations](https://github.com/alissonrubim/CopyColorGAJs/blob/master/Screenshots/first_vs_last_screenshot.png)

## What is missing?
I still have some things to do in this code, like improve the process and make it better to understand. Let me show you that i have in mind, and I'll let the task list of what is missing in this project:

- [ ] Reset/Clear the process before start again
- [ ] Stop the algorithm and continue
- [ ] Show step by step of the process (the population selection, the gene mutations and etc...)
- [ ] Generate some report, for generations, to show how grow up the percentual

> If you want to help me to improve this code, please, send me a message or contact me by the Twitter [@alissonrubim](http://twitter.com/alissonrubim). I'll be glade to work with you. :+1:
