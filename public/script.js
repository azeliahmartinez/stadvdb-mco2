document.addEventListener('DOMContentLoaded', () => {
  


    // Simulate transactions

    // Simulate Case #1
    document.getElementById('simulate-case1').addEventListener('click', async () => {
    const targetId = document.getElementById('input-case1').value;
    const response = await fetch(`/concurrent-case1?targetId=${targetId}`);
    const results = await response.json();
    document.getElementById('results').textContent = JSON.stringify(results, null, 2);
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
