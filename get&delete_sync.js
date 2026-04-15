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
