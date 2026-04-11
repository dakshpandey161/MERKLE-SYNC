const hashData = require('./hash');

function buildMerkleTreeWithLevels(hashes) {
    let levels = [];
    levels.push(hashes);

    let currentLevel = hashes;

    while (currentLevel.length > 1) {
        let newLevel = [];

        for (let i = 0; i < currentLevel.length; i += 2) {
            const left = currentLevel[i];
            const right = currentLevel[i + 1] || left;

            const combined = hashData(left + right);
            newLevel.push(combined);
        }

        levels.push(newLevel);
        currentLevel = newLevel;
    }

    return levels;
}

module.exports = buildMerkleTreeWithLevels;