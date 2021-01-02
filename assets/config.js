require("dotenv").config();

const config = {
    globalPrefix: ".",
    richPresence: ["treinamento.", "aprendizado.", "calculos.", "tentativas."],
    token: process.env.TOKEN,
    env: process.env.NODE_ENV,
    nnConfig: {
        iterations: process.env.NODE_ENV === "development" ? 100 : 1500,
        log: (data) => console.log(data),
        logPeriod: process.env.NODE_ENV === "development" ? 10 : 250,
        layers: [10],
    },
};

module.exports = config;
