function getDate() {
    const dateObj = new Date();
    const month = dateObj.getUTCMonth() + 1; //months from 1-12
    const day = dateObj.getUTCDate();
    const year = dateObj.getUTCFullYear();

    return year + "-" + month + "-" + day;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const countries = ['GR', 'USA', 'UK', 'DE', 'FR', 'ESP'];

function getRandomCountry() {
    return countries[Math.floor(Math.random() * countries.length)];
}

function getRandomElement(array){
    return array[Math.floor(Math.random() * array.length)];
}

module.exports = {
    getDate,
    getRandomInt,
    getRandomCountry,
    getRandomElement
};