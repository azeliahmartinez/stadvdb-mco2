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

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

/**
 * Function to replicate a query across all nodes
 * @param {string} query - The SQL query to execute
 * @param {Array} params - Parameters for the query
 * @returns {Promise<Array>} - Resolves with the results from all nodes
 */
async function dataReplicate(query, params = []) {
    try {
        const results = await Promise.all([
            dbNode1.promise().query(query, params),
            dbNode2.promise().query(query, params),
            dbNode3.promise().query(query, params),
        ]);

        return results.map((result, index) => ({
            node: `Node ${index + 1}`,
            affectedRows: result[0].affectedRows,
        }));
    } catch (error) {
        console.error('Error during data replication:', error.message);
        throw new Error('Data replication failed.');
    }
}



// Concurrent transactions in two or more nodes reading the same data item
app.get('/concurrent-case1', async (req, res) => {
    try {
        const { targetId } = req.query;

        if (!targetId) {
            return res.status(400).json({
                success: false,
                message: 'Target ID is required',
            });
        }

        const results = await Promise.all([
            dbNode1.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
            dbNode2.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
            dbNode3.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
        ]);

        res.json({
            success: true,
            message: 'Concurrent read operations completed successfully',
            results: results.map(([rows], index) => ({
                node: `Node ${index + 1}`,
                data: rows,
            })),
        });
    } catch (error) {
        console.error('Error during concurrent read simulation:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error during concurrent read simulation',
            error: error.message,
        });
    }
});



// One transaction writing while others read
app.post('/concurrent-case2', async (req, res) => {
    try {
        const { targetId, newName } = req.body;

        if (!targetId || !newName) {
            return res.status(400).json({
                success: false,
                message: 'Target ID and new name are required',
            });
        }

        // Perform the update on Node 1
        const [writeResult] = await dbNode1.promise().query(
            'UPDATE Game SET name = ? WHERE appid = ?',
            [newName, targetId]
        );

        if (writeResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No matching record found to update on Node 1.',
            });
        }

        // Replicate the update to all nodes
        const replicationResults = await dataReplicate(
            'UPDATE Game SET name = ? WHERE appid = ?',
            [newName, targetId]
        );

        // Read data from all nodes
        const readResults = await Promise.all([
            dbNode1.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
            dbNode2.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
            dbNode3.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
        ]);

        res.json({
            success: true,
            message: 'Concurrent write and read operations completed successfully',
            replicationResults,
            readResults: readResults.map(([rows], index) => ({
                node: `Node ${index + 1}`,
                data: rows,
            })),
        });
    } catch (error) {
        console.error('Error during concurrent write and read simulation:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error during concurrent write and read simulation',
            error: error.message,
        });
    }
});


// Concurrent transactions writing the same data item
// Concurrent transactions writing the same data item
app.post('/concurrent-case3', async (req, res) => {
    try {
        const { targetId, newName } = req.body;

        if (!targetId || !newName) {
            return res.status(400).json({
                success: false,
                message: 'Target ID and new name are required',
            });
        }

        // Perform the update and replicate to all nodes
        const replicationResults = await dataReplicate(
            'UPDATE Game SET name = ? WHERE appid = ?',
            [newName, targetId]
        );

        // Read updated data from all nodes
        const readResults = await Promise.all([
            dbNode1.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
            dbNode2.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
            dbNode3.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
        ]);

        res.json({
            success: true,
            message: 'Concurrent write operations with replication completed successfully',
            replicationResults,
            readResults: readResults.map(([rows], index) => ({
                node: `Node ${index + 1}`,
                data: rows,
            })),
        });
    } catch (error) {
        console.error('Error during concurrent write simulation:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error during concurrent write simulation',
            error: error.message,
        });
    }
});
