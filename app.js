const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Database Connections
const node1 = mysql.createPool({ host: 'localhost', user: 'root', password: 'password', database: 'node1_db' });
const node2 = mysql.createPool({ host: 'localhost', user: 'root', password: 'password', database: 'node2_db' });
const node3 = mysql.createPool({ host: 'localhost', user: 'root', password: 'password', database: 'node3_db' });

// Sample Read Endpoint
app.get('/read-concurrent', async (req, res) => {
    try {
        const [node1Data] = await node1.query('SELECT * FROM Game_Facts LIMIT 10');
        const [node2Data] = await node2.query('SELECT * FROM Game_Facts_Node2 LIMIT 10');
        res.json({ node1: node1Data, node2: node2Data });
    } catch (error) {
        res.status(500).send('Error in concurrent read');
    }
});

// Start Server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
