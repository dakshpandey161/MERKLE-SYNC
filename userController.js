const hashData = require('../utils/hash');
const { findDifferences } = require('../utils/compare');
const buildMerkleTree = require('../utils/merkle');
const User = require('../models/userModel');
const buildMerkleTreeWithLevels = require('../utils/merkle_level');
const { formatMerkleProfessional, generatePrettyTree } = require('../utils/helper');
const SyncLog = require('../models/syncLogModel');

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
            
            { name: "John", email: "updated@gmail.com" }
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

exports.compareMerkle = async (req, res) => {
    try {
        const data1Docs = await User.find({ dataset: "A" }).sort({ userId: 1 });
        const data2Docs = await User.find({ dataset: "B" }).sort({ userId: 1 });

        const data1 = data1Docs.map(d => d.name);
        const data2 = data2Docs.map(d => d.name);

        const hashes1 = data1Docs.map(d => d.hash);
        const hashes2 = data2Docs.map(d => d.hash);

        const tree1 = buildMerkleTreeWithLevels(hashes1);
        const tree2 = buildMerkleTreeWithLevels(hashes2);

        const root1 = tree1[tree1.length - 1][0];
        const root2 = tree2[tree2.length - 1][0];

        const differences = [];

        for (let i = 0; i < hashes1.length; i++) {
            if (hashes1[i] !== hashes2[i]) {
                differences.push(i);
            }
        }

        const formatted1 = formatMerkleProfessional(data1, hashes1, tree1);
        const formatted2 = formatMerkleProfessional(data2, hashes2, tree2);

        res.json({
            dataset1: formatted1,
            dataset2: formatted2,
            rootComparison: {
                root1,
                root2,
                isEqual: root1 === root2
            },
            differences
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.syncDatasets = async (req, res) => {
    try {
        const data1Docs = await User.find({ dataset: "A" }).sort({ userId: 1 });
        const data2Docs = await User.find({ dataset: "B" }).sort({ userId: 1 });

        let updatedIndexes = [];

        const before = data2Docs.map(d => d.name);

        for (let i = 0; i < data1Docs.length; i++) {
            if (data1Docs[i].hash !== data2Docs[i].hash) {

                updatedIndexes.push(i);

                await User.updateOne(
                    { dataset: "B", userId: i },
                    {
                        name: data1Docs[i].name,
                        hash: data1Docs[i].hash
                    }
                );
            }
        }

        const afterDocs = await User.find({ dataset: "B" }).sort({ userId: 1 });
        const after = afterDocs.map(d => d.name);

        const log = await SyncLog.create({
            updatedIndexes,
            before,
            after
        });

        res.json({
            message: "Sync completed successfully",
            updatedIndexes,
            log   
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSyncLogs = async (req, res) => {
    try {
        const logs = await SyncLog.find().sort({ timestamp: -1 });

        res.json(logs);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteSyncLogs = async (req, res) => {
    try {
        const result = await SyncLog.deleteMany({});

        res.json({
            message: "All sync logs deleted",
            deletedCount: result.deletedCount
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

exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const lastUser = await User.findOne().sort({ userId: -1 });
        const newId = lastUser ? lastUser.userId + 1 : 1;

        const userData = { name, email };
        const hash = hashData(userData);

        const user = new User({
            userId: newId,
            name,
            email,
            password,
            hash
        });

        await user.save();

        res.json({ message: "Signup successful", user });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user || user.password !== password) {
            return res.json({ message: "Invalid credentials" });
        }

        res.json({
            message: "Login successful",
            userId: user.userId
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getProfile = async (req, res) => {
    const { userId } = req.params;

    const user = await User.findOne({ userId: Number(userId) });

    res.json(user);
};


