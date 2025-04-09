document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'volleyballTournamentData_v2'; // Changed key if structure differs significantly
    let tournamentData;

    // --- DOM Elements ---
    const groupSelect = document.getElementById('group-select');
    const team1Select = document.getElementById('team1-select');
    const team2Select = document.getElementById('team2-select');
    const resultForm = document.getElementById('result-form');
    const formMessage = document.getElementById('form-message');
    const tableBodyA = document.querySelector('#table-a tbody');
    const tableBodyB = document.querySelector('#table-b tbody');
    const resetDataButton = document.getElementById('reset-data-button');

    // --- Initial Data Setup ---
    function getDefaultData() {
        const groupANames = [
            "Ekaavdhani Knights",
            "Purshottam Hawk",
            "Samarpan Strom",
            "Surveer Spartans",
            "Prapti Pioneers",
            "Bhulku Flights",
            "Akshar Royal"
        ];

        const groupBNames = [
            "Sarvam Spikers",
            "Dazzling Das",
            "Satsangi Lions",
            "Ekantik Eagle",
            "Jagrat Lions",
            "Prabodham Titans",
            "Nishchay Tigers"
        ];

        const defaultData = { teams: { A: [], B: [] } };

        // Populate Group A
        groupANames.forEach((name, index) => {
            // Create a unique ID like A0, A1, A2...
            const teamId = `A${index}`;
            defaultData.teams.A.push(createTeam(teamId, name));
        });

        // Populate Group B
        groupBNames.forEach((name, index) => {
                // Create a unique ID like B0, B1, B2...
            const teamId = `B${index}`;
            defaultData.teams.B.push(createTeam(teamId, name));
        });

        return defaultData;
    }
    
    function createTeam(id, name) {
        // This function remains the same as before
        return {
            id: id,
            name: name,
            played: 0,
            wins30_31: 0, // Wins 3-0 or 3-1 (3 points)
            wins32: 0,     // Wins 3-2 (2 points)
            losses23: 0,   // Losses 2-3 (1 point)
            losses03_13: 0,// Losses 0-3 or 1-3 (0 points)
            setsWon: 0,
            setsLost: 0,
            pointsFor: 0,  // Total points scored by the team
            pointsAgainst: 0, // Total points scored against the team
            points: 0
        };
    }

    // --- Data Persistence ---
    function loadData() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            try {
                tournamentData = JSON.parse(data);
                // Basic validation and migration for missing point fields
                if (!tournamentData.teams || !tournamentData.teams.A || !tournamentData.teams.B) {
                    throw new Error("Invalid base structure");
                }
                 // Ensure all teams have the new point fields
                 ['A', 'B'].forEach(group => {
                     tournamentData.teams[group].forEach(team => {
                         if (team.pointsFor === undefined) team.pointsFor = 0;
                         if (team.pointsAgainst === undefined) team.pointsAgainst = 0;
                     });
                 });

            } catch (e) {
                 console.warn("Error parsing stored data or invalid structure, resetting to default.", e);
                 tournamentData = getDefaultData();
                 saveData(); // Save the default structure
            }
        } else {
            tournamentData = getDefaultData();
        }
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tournamentData));
    }

    // --- UI Rendering ---
    function populateSelectors(group) {
        const teams = tournamentData.teams[group] || [];
        team1Select.innerHTML = '<option value="">--Select Team 1--</option>';
        team2Select.innerHTML = '<option value="">--Select Team 2--</option>';

        // Sort teams alphabetically for dropdowns
        const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

        sortedTeams.forEach(team => {
            const option1 = document.createElement('option');
            option1.value = team.id;
            option1.textContent = team.name;
            team1Select.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = team.id;
            option2.textContent = team.name;
            team2Select.appendChild(option2);
        });
    }

    function calculateSetRatio(setsWon, setsLost) {
        if (setsLost === 0) {
            return setsWon > 0 ? Infinity : 0; // Handle division by zero
        }
        return setsWon / setsLost;
    }

     function calculatePointRatio(pointsFor, pointsAgainst) {
        if (pointsAgainst === 0) {
            return pointsFor > 0 ? Infinity : 0; // Handle division by zero
        }
        return pointsFor / pointsAgainst;
    }

    function formatRatio(ratio) {
        if (ratio === Infinity) return "Inf";
        if (isNaN(ratio) || ratio === 0) return "0.000";
        return ratio.toFixed(3); // Format to 3 decimal places
    }

    function renderTable(group) {
        const tableBody = group === 'A' ? tableBodyA : tableBodyB;
        const teams = [...tournamentData.teams[group]]; // Create a copy for sorting

        // Sort teams: 1. Points (desc), 2. Wins (desc), 3. Set Ratio (desc), 4. Point Ratio (desc), 5. Name (asc)
        teams.sort((a, b) => {
            // 1. Points
            if (b.points !== a.points) return b.points - a.points;
            // 2. Total Wins
            const winsA = a.wins30_31 + a.wins32;
            const winsB = b.wins30_31 + b.wins32;
            if (winsB !== winsA) return winsB - winsA;
            // 3. Set Ratio
            const setRatioA = calculateSetRatio(a.setsWon, a.setsLost);
            const setRatioB = calculateSetRatio(b.setsWon, b.setsLost);
            if (setRatioB !== setRatioA) return setRatioB - setRatioA; // Higher ratio is better
             // 4. Point Ratio
            const pointRatioA = calculatePointRatio(a.pointsFor, a.pointsAgainst);
            const pointRatioB = calculatePointRatio(b.pointsFor, b.pointsAgainst);
             if (pointRatioB !== pointRatioA) return pointRatioB - pointRatioA; // Higher ratio is better
             // 5. Sets Won (if ratios are equal, e.g., both Infinity or both 0)
             if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;
             // 6. Points For (if still tied)
              if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
            // 7. Name (alphabetical as final tie-breaker)
            return a.name.localeCompare(b.name);
        });

        // Render table rows
        tableBody.innerHTML = ''; // Clear existing rows
        teams.forEach((team, index) => {
            const setRatio = calculateSetRatio(team.setsWon, team.setsLost);
            const pointRatio = calculatePointRatio(team.pointsFor, team.pointsAgainst);
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${team.name}</td>
                <td>${team.played}</td>
                <td>${team.wins30_31}</td>
                <td>${team.wins32}</td>
                <td>${team.losses23}</td>
                <td>${team.losses03_13}</td>
                <td>${team.setsWon}-${team.setsLost}</td>
                <td>${formatRatio(setRatio)}</td>
                <td>${formatRatio(pointRatio)}</td>
                <td><b>${team.points}</b></td>
            `;
        });
    }

    // --- Event Handling ---
    groupSelect.addEventListener('change', (e) => {
        const selectedGroup = e.target.value;
        if (selectedGroup) {
            populateSelectors(selectedGroup);
        } else {
            // Clear dependent dropdowns
            team1Select.innerHTML = '<option value="">--Select Team 1--</option>';
            team2Select.innerHTML = '<option value="">--Select Team 2--</option>';
        }
        // Clear form message on group change
        formMessage.textContent = '';
        formMessage.className = 'message';
    });

    resultForm.addEventListener('submit', (e) => {
        e.preventDefault();
        formMessage.textContent = ''; // Clear previous messages
        formMessage.className = 'message'; // Reset class

        // --- Get form values ---
        const group = groupSelect.value;
        const team1Id = team1Select.value;
        const team2Id = team2Select.value;

        // Get scores, defaulting potentially empty set 3 to null
        const s1t1 = parseInt(document.getElementById('s1t1').value);
        const s1t2 = parseInt(document.getElementById('s1t2').value);
        const s2t1 = parseInt(document.getElementById('s2t1').value);
        const s2t2 = parseInt(document.getElementById('s2t2').value);
        const s3t1Input = document.getElementById('s3t1');
        const s3t2Input = document.getElementById('s3t2');
        let s3t1 = s3t1Input.value !== '' ? parseInt(s3t1Input.value) : null;
        let s3t2 = s3t2Input.value !== '' ? parseInt(s3t2Input.value) : null;


        // --- Input Validation ---
        if (!group || !team1Id || !team2Id) {
            showFormMessage("Please select group and both teams.", "error");
            return;
        }
        if (team1Id === team2Id) {
             showFormMessage("Team 1 and Team 2 cannot be the same.", "error");
            return;
        }
         // Check if required scores are valid numbers >= 0
        if (isNaN(s1t1) || isNaN(s1t2) || isNaN(s2t1) || isNaN(s2t2) || s1t1 < 0 || s1t2 < 0 || s2t1 < 0 || s2t2 < 0) {
            showFormMessage("Please enter valid, non-negative scores for Set 1 and Set 2.", "error");
            return;
        }
         // Validate Set 3 scores only if they are entered
         if ((s3t1 !== null && (isNaN(s3t1) || s3t1 < 0)) || (s3t2 !== null && (isNaN(s3t2) || s3t2 < 0))) {
            showFormMessage("Please enter valid, non-negative scores for Set 3 if played.", "error");
            return;
         }
         // Check if only one score is entered for Set 3
         if ((s3t1 !== null && s3t2 === null) || (s3t1 === null && s3t2 !== null)) {
             showFormMessage("Please enter scores for both teams for Set 3, or leave both blank.", "error");
             return;
         }


        // --- Calculate Sets Won & Points Scored in Match ---
        let t1SetsWon = 0;
        let t2SetsWon = 0;
        let matchPointsT1 = 0;
        let matchPointsT2 = 0;

        // Set 1
        if (s1t1 > s1t2) t1SetsWon++; else t2SetsWon++;
        matchPointsT1 += s1t1;
        matchPointsT2 += s1t2;

        // Set 2
        if (s2t1 > s2t2) t1SetsWon++; else t2SetsWon++;
        matchPointsT1 += s2t1;
        matchPointsT2 += s2t2;

        // Check if Set 3 was necessary
        let needSet3 = t1SetsWon < 2 && t2SetsWon < 2;
        let set3Played = s3t1 !== null && s3t2 !== null; // Both scores are entered and valid non-negative

        if (needSet3) {
            if (!set3Played) {
                showFormMessage("Set 3 scores are required (match was 1-1 after Set 2).", "error");
                return;
            }
             // Basic check for Set 3 score validity (win by 2 from 15) - simplified
             if ((s3t1 < 15 && s3t2 < 15) || (s3t1 === s3t2) || (Math.abs(s3t1 - s3t2) < 2 && (s3t1 >= 14 || s3t2 >= 14))) {
                // It's complex, maybe just warn? Or rely on user input being correct.
                 console.warn("Set 3 scores might not reflect standard win conditions (e.g., win by 2 from 15pts). Proceeding.");
             }
             if (s3t1 > s3t2) t1SetsWon++; else t2SetsWon++;
             matchPointsT1 += s3t1;
             matchPointsT2 += s3t2;
        } else if (set3Played) {
             showFormMessage("Set 3 scores entered, but one team already won 2-0. Set 3 scores ignored.", "warning");
             // Clear the ignored scores visually and effectively
             s3t1Input.value = '';
             s3t2Input.value = '';
             s3t1 = null;
             s3t2 = null;
        }

        // --- Final Match Validation ---
         if (t1SetsWon + t2SetsWon > 3 || (t1SetsWon < 2 && t2SetsWon < 2) || (t1SetsWon > 2 && t2SetsWon > 0) || (t2SetsWon > 2 && t1SetsWon > 0) ) {
            showFormMessage(`Invalid final set score: ${t1SetsWon}-${t2SetsWon}. Match must be 3-0, 3-1, or 3-2.`, "error");
            return; // Should not happen with logic above but safety check
        }


        // --- Update Team Stats ---
        const team1 = tournamentData.teams[group].find(t => t.id === team1Id);
        const team2 = tournamentData.teams[group].find(t => t.id === team2Id);

        if (!team1 || !team2) {
             showFormMessage("Error finding teams in data.", "error");
             console.error("Could not find teams:", team1Id, team2Id, "in group", group);
             return;
        }

        // Increment played count
        team1.played++;
        team2.played++;

        // Add sets won/lost
        team1.setsWon += t1SetsWon;
        team1.setsLost += t2SetsWon;
        team2.setsWon += t2SetsWon;
        team2.setsLost += t1SetsWon;

        // Add points for/against
        team1.pointsFor += matchPointsT1;
        team1.pointsAgainst += matchPointsT2;
        team2.pointsFor += matchPointsT2;
        team2.pointsAgainst += matchPointsT1;

        // Determine win/loss type and assign points
        if (t1SetsWon > t2SetsWon) { // Team 1 Wins
            if (t1SetsWon === 3 && t2SetsWon < 2) { // 3-0 or 3-1 Win for T1
                team1.wins30_31++;
                team1.points += 3;
                team2.losses03_13++; // 0-3 or 1-3 Loss for T2
                team2.points += 0;
            } else { // 3-2 Win for T1
                team1.wins32++;
                team1.points += 2;
                team2.losses23++; // 2-3 Loss for T2
                team2.points += 1;
            }
        } else { // Team 2 Wins
             if (t2SetsWon === 3 && t1SetsWon < 2) { // 3-0 or 3-1 Win for T2
                team2.wins30_31++;
                team2.points += 3;
                team1.losses03_13++; // 0-3 or 1-3 Loss for T1
                team1.points += 0;
            } else { // 3-2 Win for T2
                team2.wins32++;
                team2.points += 2;
                team1.losses23++; // 2-3 Loss for T1
                team1.points += 1;
            }
        }

        // --- Save and Re-render ---
        saveData();
        renderTable('A');
        renderTable('B');

        // Reset form and show success message
        resultForm.reset();
        // Repopulate selectors as reset might clear them if group isn't selected again
        populateSelectors(group);
        groupSelect.value = group; // Keep group selected
        showFormMessage("Match result added successfully!", "success");
    });

     resetDataButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset ALL tournament data? This cannot be undone.")) {
            localStorage.removeItem(STORAGE_KEY);
            initialize(); // Reload default data and re-render
            showFormMessage("All data has been reset.", "success");
             // Also reset the form completely
             resultForm.reset();
             groupSelect.value = '';
             populateSelectors(''); // Clear team dropdowns
        }
    });

    function showFormMessage(message, type = "info") { // type can be success, error, warning, info
        formMessage.textContent = message;
        formMessage.className = `message ${type}`; // Add specific class for styling
    }


    // --- Initialization ---
    function initialize() {
        loadData();
        // Don't pre-select a group, let user choose
        groupSelect.value = '';
        populateSelectors(''); // Start with empty team lists
        renderTable('A');
        renderTable('B');

        // Register service worker for PWA
         if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js') // Ensure path is correct
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            }).catch(error => {
                console.error('Service Worker registration failed:', error);
            });
        }
    }

    initialize(); // Run setup on page load
});