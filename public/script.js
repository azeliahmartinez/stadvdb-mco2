document.addEventListener('DOMContentLoaded', () => {
  


    // Simulate transactions

    // Simulate Case #1
    document.getElementById('simulate-case1').addEventListener('click', async () => {
        const targetId = document.getElementById('input-case1').value;
    
        try {
            // Fetch the data from the server
            const response = await fetch(`/concurrent-case1?targetId=${targetId}`);
            const results = await response.json();
    
            // Get the data for Node 1
            const node1Data = results.results.find(node => node.node === "Node 1").data;
    
            // Select the table body for Node 1
            const tableBody = document.querySelector('#table-node1 tbody');
    
            // Clear any previous rows in the table
            tableBody.innerHTML = '';

            // If no data is found for Node 1, show a "No data found" message
            if (!node1Data || node1Data.length === 0) {
                const messageRow = document.createElement('tr');
                const messageCell = document.createElement('td');
                messageCell.colSpan = 3; // Span across the entire table
                messageCell.textContent = "No data found for this node.";
                messageRow.appendChild(messageCell);
                tableBody.appendChild(messageRow);

                // Hide the table if no data
                document.getElementById('table-node1').style.display = 'none';

            } else {
    
                // Populate the table with data
                node1Data.forEach(entry => {
                    const row = document.createElement('tr');
        
                    // Create and append cells for App ID, Name, and Genres
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

                // Now that data is added, show the table
                document.getElementById('table-node1').style.display = 'table';
            }
                
        } catch (error) {
            console.error('Error fetching or processing data:', error);
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
