const CARBON_FACTORS = {
    food: 0.9,
    transport: 0.2,
    leisure: 0.5,
    shopping: 0.6
};

const RECOMMENDATIONS = {
    food: [
        "Choisissez des produits locaux et de saison pour réduire les émissions dues au transport",
        "Réduire la consommation de viande et opter pour des alternatives végétales",
        "Acheter en vrac pour minimiser les déchets d'emballage"
    ],
    transport: [
        "Envisager d'utiliser les transports en commun ou le vélo pour les courtes distances",
        "Faire du covoiturage lorsque c'est possible pour partager les émissions",
        "Planifier efficacement les déplacements pour minimiser les voyages inutiles"
    ],
    leisure: [
        "Choisissez des activités respectueuses de l'environnement comme la randonnée ou le vélo",
        "Soutenir les lieux de divertissement locaux pour réduire les émissions liées aux déplacements",
        "Envisager des alternatives virtuelles lorsque c'est possible"
    ],
    shopping: [
        "Acheter des articles d'occasion lorsque c'est possible",
        "Choisir des produits avec un minimum d'emballage",
        "Soutenir les marques respectueuses de l'environnement et les entreprises locales"
    ]
};

const ADVANCED_TIPS = {
    food: [
        "Compostez vos déchets alimentaires pour éviter qu'ils ne libèrent du méthane",
        "Participez à des jardins partagés ou cultivez vos propres herbes"
    ],
    transport: [
        "Passez à un mode de transport 100% électrique si ce n'est pas déjà fait",
        "Optimisez vos trajets avec des applications pour réduire votre temps et distance"
    ],
    leisure: [
        "Privilégiez les loisirs à domicile ou dans la nature",
        "Organisez des événements communautaires pour limiter les déplacements multiples"
    ],
    shopping: [
        "Pratiquez la consommation minimaliste : acheter moins mais mieux",
        "Utilisez des outils pour mesurer l'empreinte carbone de vos achats en ligne"
    ]
};

const DAILY_AVERAGE = {
    transport: 8.05,
    food: 5.29,
    leisure: 3.15,
    shopping: 3.15
};

let chart = null;
let lineChart = null; // <-- ajout
let emissionsHistory = []; // <-- ajout


    
document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const addBtn = document.getElementById('add-expense');
    const calculateBtn = document.getElementById('calculate');



    
    const url = `http://localhost:3000/profile/${userId}`;
    console.log("URL de la requête:", url);
    
// Format de la date avec toLocaleDateString
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');  // Pour afficher la date au format français
}


    // Fonction pour charger les émissions depuis la base de données
    function loadEmissionsFromDB(userId) {
        fetch(`http://localhost:3000/emissions/${userId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                return response.json();  // Assurez-vous que la réponse est en JSON
            })
            .then(data => {
                console.log("Données d'émissions reçues:", data);  // Vérifiez ici si les données sont correctes
                
                emissionsHistory.length = 0;  // Efface les anciennes émissions avant de les ajouter
                data.forEach(entry => {
                    emissionsHistory.push({
                        date: formatDate(entry.date),
                        value: entry.total
                    });
                });
                
                // Mettre à jour le graphique avec les nouvelles données
                updateLineChart();
            })
            .catch(err => {
                console.error("Erreur lors du chargement des émissions depuis la base de données :", err);
            });
    }
    


    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Erreur lors de la récupération des informations de l'utilisateur");
            }
            return response.json();
        })
        .then(user => {
            const userSection = document.getElementById('user');
            userSection.innerHTML = `<h1>Bienvenue, ${user.username} !</h1>`;
                    
            // Charger les émissions depuis la base de données
            loadEmissionsFromDB(userId);
        })
        .catch(error => {
            console.error("Erreur lors de la récupération des informations de l'utilisateur:", error);
        }
    );



    let expenseCount = 0;

    function createExpenseBlock(index) {
        const container = document.getElementById('expense-container');
        const div = document.createElement('div');
        div.classList.add('expense-group');
        div.innerHTML = `
            <button type="button" class="accordion">Dépense ${index}</button>
            <div class="panel">
                <div class="form-group">
                    <label>Montant (€)</label>
                    <input type="number" name="amount" required min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label>Catégorie</label>
                    <select name="category" required>
                        <option value="food">Alimentation</option>
                        <option value="transport">Transport</option>
                        <option value="leisure">Loisirs</option>
                        <option value="shopping">Shopping</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" name="date" required>
                </div>
            </div>
        `;
        container.appendChild(div);
        setupAccordion(div.querySelector('.accordion'));
    }

    function setupAccordion(button) {
        button.addEventListener('click', () => {
            button.classList.toggle('active');
            const panel = button.nextElementSibling;
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        });
    }

    addBtn.addEventListener('click', () => {
        expenseCount++;
        createExpenseBlock(expenseCount);
    });



    calculateBtn.addEventListener('click', () => {
        const panels = document.querySelectorAll('.panel');
        let totalCO2 = 0;
        const categoryTotals = {};
        const categoriesUsed = new Set();
        const dailyEmissionsMap = {};
        let allValid = true;
    
        panels.forEach(panel => {
            const amountInput = panel.querySelector('[name="amount"]');
            const categorySelect = panel.querySelector('[name="category"]');
            const dateInput = panel.querySelector('[name="date"]');
    
            const amount = parseFloat(amountInput.value);
            const category = categorySelect.value;
            const date = dateInput.value;
    
            if (
                isNaN(amount) || amount <= 0 ||
                !category || !date
            ) {
                allValid = false;
            } else {
                panel.style.border = '';
    
                const co2 = amount * (CARBON_FACTORS[category] || 0);
                totalCO2 += co2;
                categoriesUsed.add(category);
    
                categoryTotals[category] = (categoryTotals[category] || 0) + co2;
                dailyEmissionsMap[date] = (dailyEmissionsMap[date] || 0) + co2;
            }
        });
    
        if (!allValid) {
            alert("Veuillez remplir correctement tous les champs avant de calculer.");
            return;
        }
    
        document.getElementById('co2-result').textContent = `${totalCO2.toFixed(2)} kg CO2`;
        updateRecommendations(categoryTotals);
        updateChart(categoryTotals);
    

        // Affichage des résultats
        document.getElementById('results').classList.remove('hidden');
    


        // Sauvegarde dans la base de données
        if (userId) {
            Object.entries(dailyEmissionsMap).forEach(([date, totalEmission]) => {
                const categoryEmissionsForDate = {};
    
                panels.forEach(panel => {
                    const amount = parseFloat(panel.querySelector('[name="amount"]').value);
                    const category = panel.querySelector('[name="category"]').value;
                    const entryDate = panel.querySelector('[name="date"]').value;
    
                    if (entryDate === date && !isNaN(amount)) {
                        const emission = amount * (CARBON_FACTORS[category] || 0);
                        categoryEmissionsForDate[category] = (categoryEmissionsForDate[category] || 0) + emission;
                    }
                });
    
                fetch('http://localhost:3000/emissions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        date,
                        total_emission: parseFloat(totalEmission.toFixed(2)),
                        category_emissions: categoryEmissionsForDate,
                        user_id: parseInt(userId)
                    })
                })
                .then(res => {
                    if (!res.ok) throw new Error("Erreur lors de l'enregistrement des données carbone.");
                    return res.json();
                })
                .then(data => {
                    console.log("Émission enregistrée :", data);
                })
                .catch(err => {
                    console.error("Erreur serveur :", err);
                });



                emissionsHistory.push({
                    date,
                    value: parseFloat(totalEmission.toFixed(2))
                });
                emissionsHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
                
                // Affiche le graphique de l'évolution si le conteneur existe
                const lineChartContainer = document.getElementById('line-chart-container');
                if (lineChartContainer) {
                    updateLineChart();
                } else {
                    console.warn("⚠️ Élément #line-chart-container introuvable dans le DOM. Le graphe ne pourra pas s'afficher.");
                }


            });
        }
    });
});



function updateRecommendations(categoryTotals) {
    const recommendationsDiv = document.getElementById('recommendations');
    let html = '<h3>Conseils personnalisés par catégorie :</h3>';

    Object.keys(categoryTotals).forEach(category => {
        const userCO2 = categoryTotals[category];
        const avgCO2 = DAILY_AVERAGE[category];

        html += `<h4>${capitalize(category)}</h4>`;

        if (userCO2 > avgCO2) {
            html += `<p>Votre consommation dans cette catégorie est <strong>au-dessus</strong> de la moyenne. Voici quelques conseils pour réduire votre impact :</p><ul>`;
            RECOMMENDATIONS[category].forEach(tip => {
                html += `<li>${tip}</li>`;
            });
            html += `</ul>`;
        } else {
            html += `<p>Bravo ! Votre empreinte est <strong>inférieure à la moyenne</strong> dans cette catégorie 🎉 Voici quelques pistes pour aller encore plus loin :</p><ul>`;
            ADVANCED_TIPS[category].forEach(tip => {
                html += `<li>${tip}</li>`;
            });
            html += `</ul>`;
        }
    });

    recommendationsDiv.innerHTML = html;
}

function updateChart(categoryTotals) {
    const ctx = document.getElementById('chart').getContext('2d');

    if (chart) chart.destroy();

    const labels = Object.keys(categoryTotals);
    const userData = labels.map(cat => categoryTotals[cat]);
    const averageData = labels.map(cat => DAILY_AVERAGE[cat]);

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Votre impact (kg CO2)',
                    data: userData,
                    backgroundColor: 'rgba(34, 197, 94, 0.6)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Moyenne nationale (kg CO2)',
                    data: averageData,
                    backgroundColor: 'rgba(107, 114, 128, 0.6)',
                    borderColor: 'rgba(107, 114, 128, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'kg CO2'
                    }
                }
            }
        }
    });
}

function updateLineChart() {
    const ctx = document.getElementById('line-chart').getContext('2d');

    const labels = emissionsHistory.map(entry => entry.date);
    const data = emissionsHistory.map(entry => entry.value);

    if (lineChart) lineChart.destroy();

    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Évolution de votre empreinte carbone (kg CO₂)',
                data: data,
                fill: false,
                borderColor: 'rgba(34, 197, 94, 1)',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'kg CO₂'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}




document.querySelectorAll('.feature-title').forEach(button => {
    button.addEventListener('click', () => {
      const toggle = button.parentElement;
      toggle.classList.toggle('active');
    });
});