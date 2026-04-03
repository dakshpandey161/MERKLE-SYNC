const hashData = require('../utils/hash');
const { findDifferences } = require('../utils/compare');
const buildMerkleTree = require('../utils/merkle');
const User = require('../models/userModel');

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();

        if (users.length === 0) {
            return res.json({ message: "No users found" });
        }

        const cleanUsers = users.map(u => ({
            userId: u.userId,
            name: u.name,
            email: u.email,
            hash: u.hash
        }));

        res.json({
            totalUsers: users.length,
            users: cleanUsers
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.syncdata = async (req, res) => {
    try {

        const localUsers = await User.find();

        if (localUsers.length === 0) {
            return res.json({ message: "No local data found" });
        }

        const localData = localUsers.map(u => ({
            name: u.name,
            email: u.email
        }));

        const localHashes = localData.map(hashData);

        const remoteData = [
            { name: "nick", email: "john@gmail.com" },
        ];

        const remoteHashes = remoteData.map(hashData);

        const localRoot = buildMerkleTree(localHashes)[0];
        const remoteRoot = buildMerkleTree(remoteHashes)[0];

        if (localRoot === remoteRoot) {
            return res.json({ message: "Already synced"});
        }

        const differences = findDifferences(localHashes, remoteHashes);

        const changedData = [];

        for (let i of differences) {

            const localRecord = localData[i];
            const remoteRecord = remoteData[i];

            
            if (remoteRecord) {

                await User.findOneAndUpdate(
                    { name: localRecord?.name },
                    {
                        name: remoteRecord.name,
                        email: remoteRecord.email,
                        hash: hashData(remoteRecord)
                    }
                );

                changedData.push({
                    action: "UPDATED",
                    from: localRecord,
                    to: remoteRecord
                });

            }

            else {

                await User.findOneAndDelete({
                    name: localRecord?.name
                });

                changedData.push({
                    action: "DELETED",
                    data: localRecord
                });
            }
        }
        res.json({
            message: "Sync completed",
            differences,
            changedData
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, email } = req.body;

        
        const lastUser = await User.findOne().sort({ userId: -1 });

        const newId = lastUser ? lastUser.userId + 1 : 1;

        const userData = { name, email };
        const hash = hashData(userData);

        const user = new User({
            userId: newId,
            name,
            email,
            hash
        });

        await user.save();

        res.json({ message: "User saved", user });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOneAndDelete({ userId: Number(userId) });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "User deleted successfully",
            deletedUser: user
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


