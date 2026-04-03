const crypto = require('crypto');

function stableStringify(obj) {
    return JSON.stringify(
        Object.keys(obj)
            .sort()
            .reduce((result, key) => {
                result[key] = obj[key];
                return result;
            }, {})
    );
}

function hashData(data) {
    const stableData = stableStringify(data);

    return crypto
        .createHash('sha256')
        .update(stableData)
        .digest('hex');
}

module.exports = hashData;
