function setErrorAndCloseContext(context, errorMessage, statusCode) {
    context.log(`ERROR: ${errorMessage}`);
    context.res = {
        status: statusCode,
        body: errorMessage,
    };
    context.done();
}

module.exports = {
    setErrorAndCloseContext
};