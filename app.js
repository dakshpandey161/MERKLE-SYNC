const express = require('express');

const app = express();

const userRoutes = require('./routes/userRoutes.js');

app.use(express.json());
app.use('/api', userRoutes);    

app.get('/', (req, res) => {
    res.send("Hello");
});

module.exports = app;