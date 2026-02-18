const express = require("express");
const mongoose = require("mongoose");

const { buildMerkleTree } = require("../common/merkle");

const app = express();
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/serverB");

const Data = mongoose.model(
    "Data",
    new mongoose.Schema({
        name: String,
        value: String,
        timestamp: { type: Date, default: Date.now }
    })
);

app.get("/", (req, res) => {
    res.send("Server B Running");
});

// Add Data
app.post("/add", async (req, res) => {
    const record = new Data(req.body);
    await record.save();
    res.send("Data added to Server B");
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

// Sync Endpoint
app.post("/sync", async (req, res) => {
    const records = req.body;

    for (let r of records) {
        await Data.updateOne({ _id: r._id }, r, { upsert: true });
    }

    res.send("Server B Synced");
});

app.listen(4000, () => {
    console.log("Server B running on port 4000");
});
