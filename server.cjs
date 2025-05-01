/*Done*//*Done*//*Done*//*Done*//*Done*/
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const port = 3000;


const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');



app.use(cors());  // Autorise toutes les origines
app.use(express.json());


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'toeic800',
    database: 'users_db',
});


db.connect(err => {
    if (err) throw err;
    console.log('Connecté à la base de données MySQL');

    const queryUsers = `
    SELECT 
        id AS user_id, 
        username, 
        email
    FROM users
    `;

    db.query(queryUsers, (err, userResults) => {
        if (err) {
            console.error('Erreur lors de la récupération des utilisateurs:', err);
            return;
        }
        const usersData = userResults.map(user => ({
            user_id: user.user_id,
            username: user.username,
            email: user.email
        }));

        const filePath = path.join(__dirname, 'users.json');
        fs.writeFile(filePath, JSON.stringify(usersData, null, 2), (err) => {
            if (err) {
                console.error('Erreur lors de l\'écriture du fichier JSON des utilisateurs:', err);
            } else {
                console.log('Les données des utilisateurs ont été exportées avec succès dans users.json');
            }
        });
    });
});



app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = { username, email, password: hashedPassword };

        db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
        [user.username, user.email, user.password], (err, result) => {
            if (err) {
                console.error('Erreur lors de la création de l\'utilisateur:', err);
                return res.status(500).json({ message: 'Erreur serveur lors de la création de l\'utilisateur' });
            }
            // Renvoyer l'ID nouvellement créé
            res.status(201).json({ 
                message: 'Utilisateur créé avec succès !', 
                userId: result.insertId // Ajout de l'ID dans la réponse
            });
        });
    } catch (err) {
        console.error('Erreur de hachage du mot de passe:', err);
        res.status(500).json({ message: 'Erreur lors de la création du mot de passe' });
    }
});





app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('Erreur lors de la recherche de l\'utilisateur:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (results.length === 0) {
      // Utilisateur non trouvé
      return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }
    const user = results[0];
    // Compare le mot de passe fourni avec le hash stocké
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }
    // Authentification réussie
    res.status(200).json({ message: 'Connexion réussie', userId: user.id });
  });
});







app.get('/profile/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = `SELECT username FROM users WHERE id = ?`;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des données utilisateur:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(results[0]);
  });
});
/*Done*//*Done*//*Done*//*Done*//*Done*/




  // Sert au frontend à savoir si on doit afficher des options admin (boutons, liens, etc.)
app.get('/admin/check/:userId', (req, res) => {
    const userId = req.params.userId;
  
    db.query('SELECT is_admin FROM users WHERE id = ?', [userId], (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).json({ message: 'Erreur serveur ou utilisateur non trouvé' });
      }
  
      res.json({ isAdmin: results[0].is_admin === 1 });
    });
});
  


//Sert à récupérer toutes les données (liste des utilisateurs), mais est protégée pour les admins uniquement
app.get('/all-users', (req, res) => {
    const userId = req.headers['x-user-id']; // On récupère l'ID de l'utilisateur depuis les headers
  
    db.query('SELECT is_admin FROM users WHERE id = ?', [userId], (err, results) => {
      if (err || results.length === 0) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
  
      const isAdmin = results[0].is_admin;
      if (!isAdmin) {
        return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
      }
  
      // Si admin, on renvoie tous les utilisateurs
      db.query('SELECT id, username, email, is_admin, created_at FROM users', (err, users) => {
        if (err) {
          return res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs' });
        }
        res.json(users);
      });
    });
});
  






/*Données ce calcul*/
// Enregistrement des résultats de calcul d’émissions
app.post('/emissions', (req, res) => {
  console.log('Requête reçue:', req.body); // Vérifie les données envoyées
  const { date, total_emission, category_emissions, user_id } = req.body;

  if (!date || !total_emission || !category_emissions || !user_id) {
      return res.status(400).json({ message: "Champs manquants pour l'enregistrement des émissions" });
  }

  const query = `
      INSERT INTO carbon_emissions (date, total_emission, category_emissions, user_id)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
          total_emission = VALUES(total_emission),
          category_emissions = VALUES(category_emissions)
  `;

  db.query(query, [date, total_emission, JSON.stringify(category_emissions), user_id], (err, result) => {
      if (err) {
          console.error("Erreur lors de l'insertion des données d'émission :", err);
          return res.status(500).json({ message: "Erreur lors de l'enregistrement des données" });
      }

      res.status(200).json({ message: "Émissions enregistrées avec succès", insertId: result.insertId });
  });
});



// Récupération des émissions pour affichage graphique
app.get('/emissions/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = `
      SELECT date, total_emission, category_emissions 
      FROM carbon_emissions 
      WHERE user_id = ? 
      ORDER BY date ASC
  `;

  db.query(query, [userId], (err, results) => {
      if (err) {
          console.error("Erreur de récupération des émissions:", err);
          return res.status(500).json({ message: "Erreur serveur" });
      }
      try {
          const formattedData = results.map(row => ({
              date: row.date,
              total: row.total_emission,
              categories: JSON.parse(row.category_emissions)
          }));
          res.status(200).json(formattedData);
      } catch (parseError) {
          console.error("Erreur de parsing JSON:", parseError);
          res.status(500).json({ message: "Erreur de traitement des données" });
      }
  });
});




app.delete('/delete-user/:userId', (req, res) => {
  const userIdToDelete = req.params.userId;

  const query = `DELETE FROM users WHERE id = ?`;

  db.query(query, [userIdToDelete], (err, result) => {
    if (err) {
      console.error("Erreur lors de la suppression de l'utilisateur :", err);
      return res.status(500).json({ message: "Erreur lors de la suppression de l'utilisateur" });
    }

    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  });
});


app.listen(port, () => console.log(`Serveur lancé sur http://localhost:${port}`));