document.addEventListener('DOMContentLoaded', () => {
  
    // Simulate transactions

    // Simulate Case #1
    document.getElementById('simulate-case1').addEventListener('click', async () => {
        const targetId = document.getElementById('input-case1').value;
    
        try {
            const response = await fetch(`/concurrent-case1?targetId=${targetId}`);
    
            // Check if the response is ok
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
    
            const results = await response.json();
    
            console.log('Fetched results:', results);
    
            // Process the results
            const nodes = ['Node 1', 'Node 2', 'Node 3'];
    
            nodes.forEach(nodeName => {
                const nodeData = results.results.find(node => node.node === nodeName)?.data;
    
                // Ensure the table and its body are targeted correctly
                const tableId = `table-${nodeName.toLowerCase().replace(' ', '')}`;
                const tableBody = document.querySelector(`#${tableId} tbody`);
    
                // Log table and node data for debugging
                console.log(`Processing ${nodeName}:`, nodeData, tableId);
    
                tableBody.innerHTML = ''; // Clear previous rows
    
                if (!nodeData || nodeData.length === 0) {
                    // No data found for this node
                    const messageRow = document.createElement('tr');
                    const messageCell = document.createElement('td');
                    messageCell.colSpan = 3; // Adjust based on your table's column count
                    messageCell.textContent = "No data found for this node.";
                    messageRow.appendChild(messageCell);
                    tableBody.appendChild(messageRow);
    
                    // Show the table (or ensure it's visible) for consistency
                    document.getElementById(tableId).style.display = 'table';
                } else {
                    // Populate the table with the node's data
                    nodeData.forEach(entry => {
                        const row = document.createElement('tr');
    
                        const appIdCell = document.createElement('td');
                        appIdCell.textContent = entry.appid;
                        row.appendChild(appIdCell);
    
                        const nameCell = document.createElement('td');
                        nameCell.textContent = entry.name;
                        row.appendChild(nameCell);
    
                        const genresCell = document.createElement('td');
                        genresCell.textContent = entry.genres;
                        row.appendChild(genresCell);
    
                        tableBody.appendChild(row);
                    });
    
                    // Show the table after populating
                    document.getElementById(tableId).style.display = 'table';
                }
            });
        } catch (error) {
            console.error('Error during Case #1 simulation:', error.message);
            alert('Failed to fetch results. Please try again.');
        }
    });
    

    // Simulate Case #2
    document.getElementById('simulate-case2').addEventListener('click', async () => {
        const targetId = document.getElementById('input-case2-id').value;
        const newName = document.getElementById('input-case2-name').value;
    
        try {
            const response = await fetch('/concurrent-case2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId, newName }),
            });
    
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
    
            const results = await response.json();
            console.log('Fetched results for Case #2:', results);
    
            // Clear all existing tables for Case #2
            ['Node 1', 'Node 2', 'Node 3'].forEach(nodeName => {
                const tableId = `table-${nodeName.toLowerCase().replace(' ', '')}`;
                const tableBody = document.querySelector(`#${tableId} tbody`);
                tableBody.innerHTML = ''; // Clear rows
                document.getElementById(tableId).style.display = 'none'; // Hide table by default
            });
    
            // Populate tables dynamically
            results.readResults.forEach(({ node, data }) => {
                const tableId = `table-${node.toLowerCase().replace(' ', '')}`;
                const tableBody = document.querySelector(`#${tableId} tbody`);
    
                if (!data || data.length === 0) {
                    const messageRow = document.createElement('tr');
                    const messageCell = document.createElement('td');
                    messageCell.colSpan = 3;
                    messageCell.textContent = "No data found for this node.";
                    messageRow.appendChild(messageCell);
                    tableBody.appendChild(messageRow);
                } else {
                    data.forEach(entry => {
                        const row = document.createElement('tr');
    
                        const appIdCell = document.createElement('td');
                        appIdCell.textContent = entry.appid;
                        row.appendChild(appIdCell);
    
                        const nameCell = document.createElement('td');
                        nameCell.textContent = entry.name;
                        row.appendChild(nameCell);
    
                        const genresCell = document.createElement('td');
                        genresCell.textContent = entry.genres;
                        row.appendChild(genresCell);
    
                        tableBody.appendChild(row);
                    });
                }
    
                document.getElementById(tableId).style.display = 'table'; // Show the table
            });
    
            alert('Case #2 simulated successfully.');
        } catch (error) {
            console.error('Error during Case #2 simulation:', error.message);
            alert('Failed to simulate Case #2. Please try again.');
        }
    });
    


    // Simulate Case #3
    document.getElementById('simulate-case3').addEventListener('click', async () => {
        const targetId = document.getElementById('input-case3-id').value;
        const newName = document.getElementById('input-case3-name').value;

        try {
            const response = await fetch('/concurrent-case3', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId, newName }),
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const results = await response.json();
            console.log('Fetched results for Case #3:', results);

            // Clear all existing tables for Case #3
            ['Node 1', 'Node 2', 'Node 3'].forEach(nodeName => {
                const tableId = `table-${nodeName.toLowerCase().replace(' ', '')}`;
                const tableBody = document.querySelector(`#${tableId} tbody`);
                tableBody.innerHTML = ''; // Clear rows
                document.getElementById(tableId).style.display = 'none'; // Hide table by default
            });

            // Populate tables dynamically
            results.readResults.forEach(({ node, data }) => {
                const tableId = `table-${node.toLowerCase().replace(' ', '')}`;
                const tableBody = document.querySelector(`#${tableId} tbody`);

                if (!data || data.length === 0) {
                    const messageRow = document.createElement('tr');
                    const messageCell = document.createElement('td');
                    messageCell.colSpan = 3;
                    messageCell.textContent = "No data found for this node.";
                    messageRow.appendChild(messageCell);
                    tableBody.appendChild(messageRow);
                } else {
                    data.forEach(entry => {
                        const row = document.createElement('tr');

                        const appIdCell = document.createElement('td');
                        appIdCell.textContent = entry.appid;
                        row.appendChild(appIdCell);

                        const nameCell = document.createElement('td');
                        nameCell.textContent = entry.name;
                        row.appendChild(nameCell);

                        const genresCell = document.createElement('td');
                        genresCell.textContent = entry.genres;
                        row.appendChild(genresCell);

                        tableBody.appendChild(row);
                    });
                }

                document.getElementById(tableId).style.display = 'table'; // Show the table
            });

            alert('Case #3 simulated successfully.');
        } catch (error) {
            console.error('Error during Case #3 simulation:', error.message);
            alert('Failed to simulate Case #3. Please try again.');
        }
    });


});
