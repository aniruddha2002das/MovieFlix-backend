const { log } = require('console');
const crypto = require('crypto');

exports.generateRandomBytes = () => {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(30,(error, buffer) => {
            if (error) reject(error);
            const bufferString = buffer.toString('hex');
            resolve(bufferString);
        })
    })
}