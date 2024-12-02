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
                    const messageRow = document.createElement('tr');
                    const messageCell = document.createElement('td');
                    messageCell.colSpan = 3;
                    messageCell.textContent = "No data found for this node.";
                    messageRow.appendChild(messageCell);
                    tableBody.appendChild(messageRow);
    
                    document.getElementById(tableId).style.display = 'none';
                } else {
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
    const response = await fetch('/concurrent-case2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, newName }),
    });
    const results = await response.json();
    document.getElementById('results').textContent = JSON.stringify(results, null, 2);
    });

    // Simulate Case #3
    document.getElementById('simulate-case3').addEventListener('click', async () => {
    const targetId = document.getElementById('input-case3-id').value;
    const newName = document.getElementById('input-case3-name').value;
    const response = await fetch('/concurrent-case3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, newName }),
    });
    const results = await response.json();
    document.getElementById('results').textContent = JSON.stringify(results, null, 2);
    });

});
