let autoTimer;

function checkLogin() {
    const nameInput = document.getElementById('user-name').value.trim();
    const pinInput = document.getElementById('user-pin').value.trim();

    fetch('/api/config')
        .then(res => res.json())
        .then(data => {
            const user = data.utilisateurs.find(u => 
                u.nom.toLowerCase() === nameInput.toLowerCase() && 
                String(u.pin) === String(pinInput)
            );
            
            if (user) {
                document.getElementById('login-page').style.display = 'none';
                document.getElementById('main-nav').style.display = 'flex';
                document.getElementById('ctrl').style.display = 'block';
                refresh();
            } else {
                document.getElementById('err').style.display = 'block';
            }
        });
}

function refresh() {
    fetch('/api/config').then(r => r.json()).then(data => {
        const e = document.getElementById('etat');
        const tDiv = document.getElementById('timer-display');
        
        // Mise à jour visuelle du bandeau
        e.innerText = data.porteOuverte ? "OUVERT" : "FERMÉ";
        e.className = data.porteOuverte ? "ouvert" : "ferme";

        // Gestion du timer de fermeture automatique
        if (data.porteOuverte) {
            tDiv.style.display = "block";
            startAutoClose(10);
        } else {
            tDiv.style.display = "none";
            clearInterval(autoTimer);
        }

        // Liste des utilisateurs
        document.getElementById('user-list').innerHTML = data.utilisateurs.map((u, i) => `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; align-items:center;">
                <span>👤 ${u.nom}</span>
                ${i > 0 ? `<button onclick="removeUser(${i})" style="background:#ff7675; color:white; border:none; border-radius:5px; padding:5px;">X</button>` : '👑'}
            </div>
        `).join('');

        // Historique
        document.getElementById('logs').innerHTML = data.historique.map(h => 
            `<div style="border-bottom:1px solid #eee; padding:5px 0;">${h.date.split(' ')[1]} - ${h.action}</div>`
        ).join('');
    });
}

// CETTE FONCTION COMMANDE LA PORTE
function toggleGarage() {
    fetch('/api/action', { method: 'POST' })
        .then(res => res.json())
        .then(() => {
            refresh(); // Force la mise à jour dès que le serveur a fini
        });
}

function startAutoClose(s) {
    clearInterval(autoTimer);
    let left = s;
    document.getElementById('secs').innerText = left;
    autoTimer = setInterval(() => {
        left--;
        if(document.getElementById('secs')) document.getElementById('secs').innerText = left;
        if(left <= 0) { 
            clearInterval(autoTimer); 
            // On ne lance la fermeture auto que si c'est encore ouvert
            fetch('/api/config').then(r => r.json()).then(data => {
                if(data.porteOuverte) toggleGarage();
            });
        }
    }, 1000);
}

function addUser() {
    const nom = prompt("Nom ?");
    const pin = prompt("Code PIN ?");
    if(nom && pin) fetch('/api/users/add', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({nom, pin})
    }).then(() => refresh());
}

function removeUser(i) {
    if(confirm("Supprimer ce profil ?")) fetch('/api/users/delete', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({index: i})
    }).then(() => refresh());
}