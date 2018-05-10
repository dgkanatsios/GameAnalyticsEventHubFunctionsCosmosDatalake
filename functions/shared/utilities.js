function setErrorAndCloseContext(context, errorMessage, statusCode) {
    context.log(`ERROR: ${JSON.stringify(errorMessage)}`);
    context.res = {
        status: statusCode,
        body: errorMessage,
    };
    context.done();
}

module.exports = {
    setErrorAndCloseContext
};