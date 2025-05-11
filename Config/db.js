const mongoose = require('mongoose');
// require('dotenv').config(); // معطل مؤقتاً

async function ConnectToDB() {
    try {
        await mongoose.connect("mongodb+srv://Hoosho:Da4IE0CNnjkr0mD3@theprof.huavd7x.mongodb.net/?retryWrites=true&w=majority&appName=theProf", {
        });

        console.log('Connected to MongoDB successfully...');
    } catch (error) {
        console.log('Connection Failed to MongoDB!', error);
    }
};

module.exports = ConnectToDB;
