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

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomstring(L) {
    let s = '';
    let randomchar = function () {
        var n = Math.floor(Math.random() * 62);
        if (n < 10) return n; //1-10
        if (n < 36) return String.fromCharCode(n + 55); //A-Z
        return String.fromCharCode(n + 61); //a-z
    }
    while (s.length < L) s += randomchar();
    return s;
}


function getNow() {
    //https://stackoverflow.com/questions/221294/how-do-you-get-a-timestamp-in-javascript
    //return Math.round(new Date().getTime() / 1000); //seconds -> you need to change 
    return Math.round(new Date().getTime()); //miliseconds
    //https://stackoverflow.com/questions/10286204/the-right-json-date-format
    //return new Date().toJSON();
}

module.exports = {
    getDate,
    getRandomInt,
    getRandomCountry,
    getRandomElement,
    randomstring,
    getNow
};