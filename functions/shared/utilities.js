function parseDate(dateString) {
    const dateObj = new Date(dateString);
    const month = dateObj.getUTCMonth() + 1; //months from 1-12
    const day = dateObj.getUTCDate();
    const year = dateObj.getUTCFullYear();

    return year + "/" + month + "/" + day;
}

function setErrorAndCloseContext(context, errorMessage, statusCode) {
    context.log(`ERROR: ${errorMessage}`);
    context.res = {
        status: statusCode,
        body: errorMessage,
    };
    context.done();
}

module.exports = {
    parseDate,
    setErrorAndCloseContext
};