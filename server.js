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
app.use(express.json());

// Database connections for 3 nodes
let dbNode1 = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT_NODE1,
});

let dbNode2 = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT_NODE2,
});

let dbNode3 = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT_NODE3,
});

// Connect to all databases
function connectNodes() {
    dbNode1.connect(err => {
        if (err) console.error('Failed to connect to Node 1:', err.message);
        else console.log('Connected to Node 1 database');
    });

    dbNode2.connect(err => {
        if (err) console.error('Failed to connect to Node 2:', err.message);
        else console.log('Connected to Node 2 database');
    });

    dbNode3.connect(err => {
        if (err) console.error('Failed to connect to Node 3:', err.message);
        else console.log('Connected to Node 3 database');
    });
}

connectNodes();

// Failure Simulation Endpoints
app.get('/simulate-case1-failure', (req, res) => {
    dbNode1.end();
    res.json({ message: 'Central Node (Node 1) is now offline. Please wait for recovery.' });
});

app.get('/simulate-case2-failure', (req, res) => {
    dbNode2.end();
    dbNode3.end();
    res.json({ message: 'Nodes 2 and 3 are now offline. Please wait for recovery.' });
});

app.get('/simulate-case3-failure', (req, res) => {
    dbNode1.query = () => {
        throw new Error('Write failure to Central Node simulated.');
    };
    res.json({ message: 'Central Node (Node 1) write operations are failing. Please wait for recovery.' });
});

app.get('/simulate-case4-failure', (req, res) => {
    dbNode2.query = () => {
        throw new Error('Write failure to Node 2 simulated.');
    };
    dbNode3.query = () => {
        throw new Error('Write failure to Node 3 simulated.');
    };
    res.json({ message: 'Write operations to Node 2 and Node 3 are failing. Please wait for recovery.' });
});

app.get('/recover', (req, res) => {
    dbNode1 = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT_NODE1,
    });
    dbNode2 = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT_NODE2,
    });
    dbNode3 = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT_NODE3,
    });
    connectNodes();
    res.json({ message: 'All nodes have been recovered successfully.' });
});

// Concurrent Transactions Endpoints
// Case 1: Concurrent transactions reading the same data item
app.get('/concurrent-case1', async (req, res) => {
    try {
        const { targetId } = req.query;
        if (!targetId) {
            return res.status(400).json({ success: false, message: 'Target ID is required' });
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
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Error during concurrent read', error: error.message });
    }
});

// Case 2: One transaction writing while others read
app.post('/concurrent-case2', async (req, res) => {
    try {
        const { targetId, newName } = req.body;
        if (!targetId || !newName) {
            return res.status(400).json({ success: false, message: 'Target ID and new name are required' });
        }
        const replicationResults = await Promise.all([
            dbNode1.promise().query('UPDATE Game SET name = ? WHERE appid = ?', [newName, targetId]),
            dbNode2.promise().query('UPDATE Game SET name = ? WHERE appid = ?', [newName, targetId]),
            dbNode3.promise().query('UPDATE Game SET name = ? WHERE appid = ?', [newName, targetId]),
        ]);
        const readResults = await Promise.all([
            dbNode1.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
            dbNode2.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
            dbNode3.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
        ]);
        res.json({
            success: true,
            message: 'Concurrent write and read operations completed successfully',
            replicationResults: replicationResults.map(([result], index) => ({
                node: `Node ${index + 1}`,
                affectedRows: result.affectedRows,
            })),
            readResults: readResults.map(([rows], index) => ({
                node: `Node ${index + 1}`,
                data: rows,
            })),
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Error during concurrent operations', error: error.message });
    }
});

// Case 3: Concurrent transactions writing the same data item
app.post('/concurrent-case3', async (req, res) => {
    try {
        const { targetId, newName } = req.body;
        if (!targetId || !newName) {
            return res.status(400).json({ success: false, message: 'Target ID and new name are required' });
        }
        const writePromises = [
            dbNode1.promise().query('UPDATE Game SET name = ? WHERE appid = ?', [newName, targetId]),
            dbNode2.promise().query('UPDATE Game SET name = ? WHERE appid = ?', [newName, targetId]),
            dbNode3.promise().query('UPDATE Game SET name = ? WHERE appid = ?', [newName, targetId]),
        ];
        const writeResults = await Promise.all(writePromises);
        const readResults = await Promise.all([
            dbNode1.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
            dbNode2.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
            dbNode3.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
        ]);
        res.json({
            success: true,
            message: 'Concurrent write and read operations completed successfully',
            writeResults: writeResults.map((result, index) => ({
                node: `Node ${index + 1}`,
                affectedRows: result[0].affectedRows,
            })),
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

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
