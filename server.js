const server = require('./app');
const connectDB = require('./config/db');

connectDB();   

server.listen(3000, () => {
    console.log("server running at 3000");
});