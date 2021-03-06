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

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomGameStartTime() {
    const now = new Date();
    //all times in UTC
    const randomDateStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const randomDateEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 0));
    const randomDateTime = randomDate(randomDateStart, randomDateEnd);
    //https://stackoverflow.com/questions/221294/how-do-you-get-a-timestamp-in-javascript
    //return Math.round(randomDateTime.getTime() / 1000); //seconds -> you need to change parseDate method on shared/utilities.js for this to work!!
    //return Math.round(randomDateTime.getTime()); //miliseconds
    //https://stackoverflow.com/questions/10286204/the-right-json-date-format
    return randomDateTime.toJSON();
}

module.exports = {
    getDate,
    getRandomInt,
    getRandomCountry,
    getRandomElement,
    randomstring,
    getRandomGameStartTime
};