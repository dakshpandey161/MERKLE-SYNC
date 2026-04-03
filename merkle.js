const hashData = require('./hash');

function buildMerkleTree(hashes) {
    
    if (hashes.length === 1) {
        return hashes;
    }

    let newLevel = [];

    for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left; 

        const combined = hashData(left + right);
        newLevel.push(combined);
    }

    return buildMerkleTree(newLevel);
}

module.exports = buildMerkleTree;
