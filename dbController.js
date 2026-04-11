const User = require('../models/userModel');
const hashData = require('../utils/hash');

// Insert dataset into DB
exports.insertDataset = async (req, res) => {
    try {
        const { datasetName, values } = req.body;

        if (!datasetName || !values) {
            return res.status(400).json({ message: "datasetName and values required" });
        }

        await User.deleteMany({ dataset: datasetName });

        const dataToInsert = [];

        for (let i = 0; i < values.length; i++) {
            dataToInsert.push({
                userId: i,
                name: values[i],
                dataset: datasetName,
                hash: hashData({ value: values[i] })
            });
        }

        await User.insertMany(dataToInsert);

        res.json({
            message: `${datasetName} stored successfully`,
            data: dataToInsert
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};