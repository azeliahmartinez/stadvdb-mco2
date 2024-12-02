// command prompt (node js)
// npm init
// npm i express mysql2 body-parser dotenv
// node server.js 

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connections for 3 nodes
const dbNode1 = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT_NODE1,
});

const dbNode2 = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT_NODE2,
});

const dbNode3 = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT_NODE3,
});

// Connect to all databases
dbNode1.connect(err => {
    if (err) throw err;
    console.log('Connected to Node 1 database');
});

dbNode2.connect(err => {
    if (err) throw err;
    console.log('Connected to Node 2 database');
});

dbNode3.connect(err => {
    if (err) throw err;
    console.log('Connected to Node 3 database');
});

// Fetch all games from all nodes
app.get('/games', async (req, res) => {
    const query = 'SELECT * FROM games';

    const fetchGamesFromNode = (db) => {
        return new Promise((resolve, reject) => {
            db.query(query, (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    };

    try {
        const node1Games = await fetchGamesFromNode(dbNode1);
        const node2Games = await fetchGamesFromNode(dbNode2);
        const node3Games = await fetchGamesFromNode(dbNode3);

        const allGames = [...node1Games, ...node2Games, ...node3Games];
        res.json(allGames);
    } catch (err) {
        res.status(500).send('Error fetching games from nodes');
    }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});