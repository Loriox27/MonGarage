const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

const DB_FILE = './config.json';

function charger() {
    if (!fs.existsSync(DB_FILE)) {
        const init = { 
            porteOuverte: false, 
            utilisateurs: [{nom: "Admin", pin: "1234"}],
            historique: [{ date: new Date().toLocaleString(), action: "Système prêt" }]
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2));
        return init;
    }
    return JSON.parse(fs.readFileSync(DB_FILE));
}

app.get('/api/config', (req, res) => res.json(charger()));

// CETTE ROUTE FAIT ALTERNER L'OUVERTURE/FERMETURE
app.post('/api/action', (req, res) => {
    let d = charger();
    
    // Inversion de l'état
    d.porteOuverte = !d.porteOuverte; 
    
    // Mise à jour de l'historique
    const actionNom = d.porteOuverte ? "Ouverture" : "Fermeture";
    d.historique.unshift({ date: new Date().toLocaleString(), action: actionNom });
    if(d.historique.length > 5) d.historique.pop();
    
    // Sauvegarde immédiate
    fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2));
    
    // Envoi de la réponse avec le nouvel état
    res.json(d); 
});

app.post('/api/users/add', (req, res) => {
    let d = charger();
    d.utilisateurs.push({nom: req.body.nom, pin: String(req.body.pin)});
    fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2));
    res.json(d);
});

app.post('/api/users/delete', (req, res) => {
    let d = charger();
    d.utilisateurs.splice(req.body.index, 1);
    fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2));
    res.json(d);
});

app.listen(port, () => console.log(`Serveur actif sur le port ${port}`));