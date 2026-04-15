function findDifferences(localHashes, remoteHashes) {
    let differences = [];

    const maxLength = Math.max(localHashes.length, remoteHashes.length);

    for (let i = 0; i < maxLength; i++) {
        if (localHashes[i] !== remoteHashes[i]) {
            differences.push(i);
        }
    }

    return differences;
}

module.exports = { findDifferences };
