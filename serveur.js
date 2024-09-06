import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import cors from 'cors';
import pkg from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
// import Possession from './models/possessions/Possession';
const { json } = pkg;
import fs from 'fs';
// Récupérer le chemin absolu du fichier actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const dataFilePath = path.resolve(__dirname, '../data/data.json');
const Possession = './models/possessions/Possession'
const Patrimoine = './models/Patrimoine.js';

app.use(cors());
app.use(json());


// Fonction pour charger les données
const loadData = () => {
    try {
        const data = readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error.message);
        return [];
    }
};

// Fonction pour sauvegarder les données
const saveData = (data) => {
    try {
        writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Données sauvegardées avec succès.');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des données:', error.message);
    }
};


// Route GET pour récupérer les possessions
app.get('/api/possessions', (req, res) => {
    const data = loadData();
    const possessions = data
        .filter(d => d.model === 'Patrimoine')
        .flatMap(d => d.data.possessions);
    res.json(possessions);
});

// Route POST pour ajouter une nouvelle possession
app.post('/api/possessions', (req, res) => {
    const newPossession = req.body;

    // Debugging log
    console.log('New possession data received:', newPossession);

    fs.readFile(dataFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la lecture du fichier' });
        }

        let jsonData = JSON.parse(data);
        let personFound = false;
        let patrimoineFound = false;

        // Find if the person exists
        const personIndex = jsonData.findIndex(item => item.model === 'Personne' && item.data.nom === newPossession.possesseur.nom);
        
        if (personIndex !== -1) {
            personFound = true;
        }

        // Find if the patrimoine exists for the person
        const patrimoineIndex = jsonData.findIndex(item => item.model === 'Patrimoine' && item.data.possesseur.nom === newPossession.possesseur.nom);

        if (patrimoineIndex !== -1) {
            patrimoineFound = true;
            // Update existing patrimoine with the new possession
            jsonData[patrimoineIndex].data.possessions.push(newPossession);
        }

        if (!personFound) {
            // Add new person
            jsonData.push({
                model: 'Personne',
                data: { nom: newPossession.possesseur.nom }
            });
        }

        if (!patrimoineFound) {
            // Add new patrimoine with the new possession
            jsonData.push({
                model: 'Patrimoine',
                data: {
                    possesseur: newPossession.possesseur,
                    possessions: [newPossession]
                }
            });
        }

        fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur lors de l\'écriture dans le fichier' });
            }
            res.status(201).json(newPossession);
        });
    });
});



// Route DELETE pour supprimer une possession
app.delete('/api/possessions/:libelle', (req, res) => {
    const { libelle } = req.params;
    let possessionFound = false;

    const data = loadData();
    const patrimoines = data.filter(d => d.model === 'Patrimoine');

    for (let i = 0; i < patrimoines.length; i++) {
        const patrimoine = patrimoines[i].data;
        const possessionIndex = patrimoine.possessions.findIndex(p => p.libelle === libelle);
        if (possessionIndex !== -1) {
            patrimoine.possessions.splice(possessionIndex, 1);
            possessionFound = true;

            // Mise à jour du fichier data.json après suppression
            const updatedData = data.map(d => {
                if (d.model === 'Patrimoine' && d.data.possesseur.nom === patrimoine.possesseur.nom) {
                    return {
                        model: 'Patrimoine',
                        data: {
                            possesseur: patrimoine.possesseur,
                            possessions: patrimoine.possessions
                        }
                    };
                }
                return d;
            });

            saveData(updatedData);
            break;
        }
    }

    if (possessionFound) {
        res.status(200).send('Possession supprimée avec succès');
    } else {
        res.status(404).send('Possession non trouvée');
    }
});

app.patch('/api/possessions/:possesseur/:libelle/dateFin', (req, res) => {
    const { possesseur, libelle } = req.params;
    const { dateFin } = req.body;

    fs.readFile(dataFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la lecture du fichier' });
        }

        let jsonData = JSON.parse(data);
        let possessionFound = false;

        // Trouver le patrimoine correspondant au possesseur
        const patrimoineIndex = jsonData.findIndex(item => 
            item.model === 'Patrimoine' && item.data.possesseur.nom === possesseur
        );

        if (patrimoineIndex === -1) {
            return res.status(404).json({ message: 'Patrimoine non trouvé pour ce possesseur.' });
        }

        // Trouver la possession par libellé
        const patrimoine = jsonData[patrimoineIndex].data;
        const possession = patrimoine.possessions.find(p => p.libelle === libelle);

        if (!possession) {
            return res.status(404).json({ message: 'Possession non trouvée.' });
        }

        // Mettre à jour la date de fin
        possession.dateFin = new Date(dateFin);
        possessionFound = true;

        // Écrire les données mises à jour dans le fichier JSON
        fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur lors de l\'écriture dans le fichier' });
            }

            res.status(200).json({ message: 'Date de fin mise à jour avec succès.', patrimoine });
        });
    });
});


// Route PATCH pour mettre à jour la date de fin d'une possession
app.patch('/api/possessions/:possesseur/:oldLibelle', (req, res) => {
    const { possesseur, oldLibelle } = req.params;
    const { newLibelle, dateFin } = req.body;

    fs.readFile(dataFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la lecture du fichier' });
        }

        let jsonData = JSON.parse(data);
        let possessionFound = false;

        // Trouver le patrimoine correspondant au possesseur
        const patrimoineIndex = jsonData.findIndex(item => 
            item.model === 'Patrimoine' && item.data.possesseur.nom === possesseur
        );

        if (patrimoineIndex === -1) {
            return res.status(404).json({ message: 'Patrimoine non trouvé pour ce possesseur.' });
        }

        // Trouver la possession par l'ancien libellé
        const patrimoine = jsonData[patrimoineIndex].data;
        const possession = patrimoine.possessions.find(p => p.libelle === oldLibelle);

        if (!possession) {
            return res.status(404).json({ message: 'Possession non trouvée.' });
        }

        // Mettre à jour le libellé et la date de fin
        possession.libelle = newLibelle || possession.libelle;
        possession.dateFin = dateFin ? new Date(dateFin) : possession.dateFin;
        possessionFound = true;

        // Écrire les données mises à jour dans le fichier JSON
        fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur lors de l\'écriture dans le fichier' });
            }

            res.status(200).json({ message: 'Possession mise à jour avec succès.', patrimoine });
        });
    });
});




app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
