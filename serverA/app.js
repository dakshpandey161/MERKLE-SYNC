const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");

const { buildMerkleTree } = require("../common/merkle");

const app = express();
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/serverA");

const Data = mongoose.model(
    "Data",
    new mongoose.Schema({
        name: String,
        value: String,
        timestamp: { type: Date, default: Date.now }
    })
);

app.get("/", (req, res) => {
    res.send("Server A Running");
});

// Add Data
app.post("/add", async (req, res) => {
    const record = new Data(req.body);
    await record.save();
    res.send("Data added to Server A");
});

// Get All Data
app.get("/data", async (req, res) => {
    const records = await Data.find();
    res.json(records);
});

// Hash Endpoint
app.get("/hash", async (req, res) => {
    const records = await Data.find();
    const rootHash = buildMerkleTree(records);
    res.json({ rootHash });
});

// Compare Servers
app.get("/compare", async (req, res) => {
    try {
        const localData = await Data.find();
        const localHash = buildMerkleTree(localData);

        const response = await axios.get("http://localhost:4000/hash");
        const remoteHash = response.data.rootHash;

        res.json({
            localHash,
            remoteHash,
            equal: localHash === remoteHash
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auto Sync
app.get("/auto-sync", async (req, res) => {
    try {
        const localData = await Data.find();
        const localHash = buildMerkleTree(localData);

        const response = await axios.get("http://localhost:4000/hash");
        const remoteHash = response.data.rootHash;

        if (localHash === remoteHash) {
            return res.json({
                message: "Already synchronized",
                equal: true
            });
        }

        // Fetch data from Server B
        const remoteDataResponse = await axios.get("http://localhost:4000/data");
        const remoteData = remoteDataResponse.data;

        for (let r of remoteData) {
            await Data.updateOne({ _id: r._id }, r, { upsert: true });
        }

        res.json({
            message: "Synchronization completed",
            equal: false
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log("Server A running on port 3000");
});
