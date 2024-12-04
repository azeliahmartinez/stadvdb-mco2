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

// Global variable for storing logs
let logs = [];

// Log function to store and display logs
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    logs.push(logMessage);
    console.log(logMessage); // Logs in terminal
}

// Connect to all databases
function connectNodes() {
    dbNode1.connect(err => {
        if (err) {
            log(`Failed to connect to Node 1: ${err.message}`);
        } else {
            log('Connected to Node 1 database');
        }
    });

    dbNode2.connect(err => {
        if (err) {
            log(`Failed to connect to Node 2: ${err.message}`);
        } else {
            log('Connected to Node 2 database');
        }
    });

    dbNode3.connect(err => {
        if (err) {
            log(`Failed to connect to Node 3: ${err.message}`);
        } else {
            log('Connected to Node 3 database');
        }
    });
}

connectNodes();

// Log Operation (fetch the old value before update)
// Ensure logOperation is an async function
// Log Operation with correct old value
async function logOperation(operationType, targetId, oldValue, newValue) {
    const logQuery = 'INSERT INTO operation_logs (operation_type, target_id, old_value, new_value) VALUES (?, ?, ?, ?)';
    try {
        // Log the operation with both old and new values
        await dbNode1.promise().query(logQuery, [operationType, targetId, oldValue, newValue]);
        log('Operation logged successfully');
    } catch (error) {
        log(`Error logging operation: ${error.message}`);
    }
}

// Simulating failure recovery case
async function handleWriteOperation(targetId, newName) {
    try {
        // Fetch the current value before performing the update
        const [currentData] = await dbNode1.promise().query('SELECT name FROM Game WHERE appid = ?', [targetId]);
        const oldValue = currentData[0]?.name;

        if (!oldValue) {
            return; // If no old value is found, exit
        }

        // Log the write operation with the old and new values
        await logOperation('WRITE', targetId, oldValue, newName);  // Log the write operation

        // Continue with the update after logging
        await dbNode1.promise().query('UPDATE Game SET name = ? WHERE appid = ?', [newName, targetId]);
        log(`Write operation for appid ${targetId} logged with new name ${newName}`);
    } catch (error) {
        log(`Error handling write operation: ${error.message}`);
    }
}


// Recovery Process - Include old and new values
async function recoverNode() {
    log('Starting recovery process...');
    try {
        const [logsFromDb] = await dbNode1.promise().query('SELECT * FROM operation_logs ORDER BY log_id ASC');
        for (const logRecord of logsFromDb) {
            if (logRecord.operation_type === 'WRITE') {
                // Update the database using oldValue if necessary, but ensure newValue is also updated
                await dbNode1.promise().query('UPDATE Game SET name = ? WHERE appid = ?', [logRecord.new_value, logRecord.target_id]);
                log(`Recovered WRITE operation on appid ${logRecord.target_id}: Old Value: ${logRecord.old_value}, New Value: ${logRecord.new_value}`);
            }
        }
        log('Recovery completed.');
    } catch (error) {
        log(`Error during recovery: ${error.message}`);
    }
}


// Failure Simulation Endpoints
app.get('/simulate-case1-failure', (req, res) => {
    dbNode1.end();
    log('Central Node (Node 1) is now offline. Please wait for recovery.');
    res.json({ message: 'Central Node (Node 1) is now offline. Please wait for recovery.' });
});

app.get('/simulate-case2-failure', (req, res) => {
    dbNode2.end();
    dbNode3.end();
    log('Nodes 2 and 3 are now offline. Please wait for recovery.');
    res.json({ message: 'Nodes 2 and 3 are now offline. Please wait for recovery.' });
});

app.get('/simulate-case3-failure', (req, res) => {
    dbNode1.query = () => {
        throw new Error('Write failure to Central Node simulated.');
    };
    log('Central Node (Node 1) write operations are failing. Please wait for recovery.');
    res.json({ message: 'Central Node (Node 1) write operations are failing. Please wait for recovery.' });
});

app.get('/simulate-case4-failure', (req, res) => {
    dbNode2.query = () => {
        throw new Error('Write failure to Node 2 simulated.');
    };
    dbNode3.query = () => {
        throw new Error('Write failure to Node 3 simulated.');
    };
    log('Write operations to Node 2 and Node 3 are failing. Please wait for recovery.');
    res.json({ message: 'Write operations to Node 2 and Node 3 are failing. Please wait for recovery.' });
});

// Recover Central Node and Replay Logged Operations
app.get('/recover', async (req, res) => {
    try {
        // Reinitialize connections for all nodes
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

        // Reconnect all nodes
        connectNodes();

        // Replay logged operations for recovery
        await recoverNode();

        res.json({ success: true, message: 'All nodes have been recovered successfully, and logs have been replayed.' });
    } catch (error) {
        log(`Error during recovery: ${error.message}`);
        res.status(500).json({ success: false, message: 'Recovery failed', error: error.message });
    }
});

// Display logs with both old and new values
app.get('/logs', async (req, res) => {
    try {
        const [logsFromDb] = await dbNode1.promise().query('SELECT * FROM operation_logs ORDER BY log_id ASC');
        res.json({ logs: logsFromDb });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch logs', error: error.message });
    }
});



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

        // Log read operations
        await logOperation('READ', targetId, null, null);  // Log as read operation (no old or new value)

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

        // Set READ COMMITTED isolation level and perform the write operation on Node 1
        await dbNode1.promise().query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        
        // Fetch the current value before performing the update
        const [currentData] = await dbNode1.promise().query('SELECT name FROM Game WHERE appid = ?', [targetId]);
        const oldValue = currentData[0]?.name;

        if (!oldValue) {
            return res.status(404).json({ success: false, message: `No data found for appid ${targetId}` });
        }

        // Log the write operation with the old and new values
        await logOperation('WRITE', targetId, oldValue, newName); 

        // Use dataReplicate function to update all three nodes
        const replicationResults = await dataReplicate('UPDATE Game SET name = ? WHERE appid = ?', [newName, targetId]);

        // Perform read operations after the write operation
        const readResults = await Promise.all([ 
            dbNode1.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
            dbNode2.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
            dbNode3.promise().query('SELECT * FROM Game WHERE appid = ?', [targetId]),
        ]);

        res.json({
            success: true,
            message: 'Concurrent write and read operations completed successfully',
            replicationResults: replicationResults,
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

        // Set the isolation level to SERIALIZABLE to ensure full isolation during the transaction
        await dbNode1.promise().query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        await dbNode2.promise().query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        await dbNode3.promise().query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

        // Fetch the old value from the first node (you can pick any node, just need a consistent source)
        const [currentData] = await dbNode1.promise().query('SELECT name FROM Game WHERE appid = ?', [targetId]);
        
        // If no data is found, return an error
        if (!currentData || currentData.length === 0) {
            return res.status(404).json({ success: false, message: `No game found with appid ${targetId}` });
        }

        const oldValue = currentData[0].name;  // Capture the old name

        // Perform the write operation on all three nodes
        const writePromises = [
            dbNode1.promise().query('UPDATE Game SET name = ? WHERE appid = ?', [newName, targetId]),
            dbNode2.promise().query('UPDATE Game SET name = ? WHERE appid = ?', [newName, targetId]),
            dbNode3.promise().query('UPDATE Game SET name = ? WHERE appid = ?', [newName, targetId]),
        ];

        // Wait for all write operations to finish
        const writeResults = await Promise.all(writePromises);

        // Log the write operation
        await logOperation('WRITE', targetId, oldValue, newName);

        // Log the write operation for all nodes (you might want to log this for each node separately)
        writeResults.forEach((result, index) => {
            console.log(`Node ${index + 1} affected rows:`, result[0].affectedRows);
            logOperation('WRITE', targetId, oldValue, newName);  // Log for each write
        });

        // Perform read operations after the write operation
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
