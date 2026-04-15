function formatMerkleProfessional(data, hashes, levels) {
    let leaves = [];
    let formattedLevels = [];

    // Leaves
    for (let i = 0; i < data.length; i++) {
        leaves.push({
            data: data[i],
            hash: hashes[i]
        });
    }

    // Build levels
    let currentLevel = data.map(d => d);

    for (let level = 1; level < levels.length; level++) {
        let newLevel = [];
        let levelData = [];

        for (let i = 0; i < currentLevel.length; i += 2) {
            const left = currentLevel[i];
            const right = currentLevel[i + 1] || left;

            const parentHash = levels[level][Math.floor(i / 2)];

            levelData.push({
                left,
                right,
                hash: parentHash
            });

            newLevel.push(`(${left},${right})`);
        }

        formattedLevels.push(levelData);
        currentLevel = newLevel;
    }

    return {
        leaves,
        levels: formattedLevels,
        root: levels[levels.length - 1][0]
    };
}

function shortHash(hash) {
    return hash.substring(0, 6); 
}

function shortHash(hash) {
    return hash.substring(0, 6);
}

function generatePrettyTree(levels) {
    let diagram = "";
    const maxWidth = levels[0].length * 8; // base width

    for (let i = levels.length - 1; i >= 0; i--) {
        const level = levels[i].map(h => shortHash(h));

        const gap = Math.floor(maxWidth / (level.length + 1));

        let line = "";

        for (let j = 0; j < level.length; j++) {
            line += " ".repeat(gap) + level[j];
        }

        diagram += line + "\n\n";
    }

    return diagram;
}

module.exports = {
    formatMerkleProfessional,
    generatePrettyTree
};
