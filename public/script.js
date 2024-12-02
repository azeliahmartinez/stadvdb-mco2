document.addEventListener('DOMContentLoaded', () => {
    const fetchGamesBtn = document.getElementById('fetch-games-btn');
    const fetchGamesWindowsBtn = document.getElementById('fetch-games-windows-btn');
    const fetchGamesMultiOsBtn = document.getElementById('fetch-games-multios-btn');
    const simulateReadBtn = document.getElementById('simulate-read');
    const simulateReadWriteBtn = document.getElementById('simulate-read-write');
    const simulateWritesBtn = document.getElementById('simulate-writes');
    const gamesList = document.getElementById('games-list');
    const simulationResults = document.getElementById('simulation-results');

    // Fetch all games
    fetchGamesBtn.addEventListener('click', async () => {
        const response = await fetch('/games');
        const games = await response.json();
        displayGamesInTable(games);
    });

    // Fetch games playable on Windows
    fetchGamesWindowsBtn.addEventListener('click', async () => {
        const response = await fetch('/games-windows');
        const games = await response.json();
        const windowsGames = games.filter(game => game.os === 'Windows');
        displayGamesInTable(windowsGames);
    });

    // Fetch games playable on multi-OS
    fetchGamesMultiOsBtn.addEventListener('click', async () => {
        const response = await fetch('/games-multios');
        const games = await response.json();
        const multiOsGames = games.filter(game => game.os.includes('Windows') || game.os.includes('Mac') || game.os.includes('Linux'));
        displayGamesInTable(multiOsGames);
    });

    // Function to display games in a table
    function displayGamesInTable(games) {
        const tableHeader = `
            <table>
                <thead>
                    <tr>
                        <th>App ID</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Genre</th>
                        <th>Release Date</th>
                        <th>OS Support</th>
                    </tr>
                </thead>
                <tbody>
                    ${games.map(game => `
                        <tr>
                            <td>${game.appid}</td>
                            <td>${game.name}</td>
                            <td>${game.price}</td>
                            <td>${game.genres}</td>
                            <td>${game.release_date}</td>
                            <td>${game.os}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        gamesList.innerHTML = tableHeader;
    }

    // Simulate transactions
    simulateReadBtn.addEventListener('click', async () => {
        const response = await fetch('/concurrent-read');
        const results = await response.json();
        simulationResults.textContent = JSON.stringify(results, null, 2);
    });

    simulateReadWriteBtn.addEventListener('click', async () => {
        const response = await fetch('/concurrent-read-write', { method: 'POST' });
        const results = await response.json();
        simulationResults.textContent = JSON.stringify(results, null, 2);
    });

    simulateWritesBtn.addEventListener('click', async () => {
        const response = await fetch('/concurrent-writes', { method: 'POST' });
        const results = await response.json();
        simulationResults.textContent = JSON.stringify(results, null, 2);
    });
});
