const trainingData = require("./training.json");

let trainingDataFormated = [];
trainingData.forEach((data) => {
    const dataFormated = data.input.toLowerCase();
    const trainingReplaced = { input: dataFormated, output: data.output };
    trainingDataFormated.push(trainingReplaced);
});

module.exports = trainingDataFormated;
