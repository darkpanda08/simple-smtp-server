const logger = {
    info: (message) => console.log(`[${new Date().toISOString()}] INFO: ${message}`),
    error: (message) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`),
    debug: (message) => console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`)
};

module.exports = {
    logger,
};
