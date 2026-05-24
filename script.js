// --- FONCTIONNALITÉS DES AUTRES BOUTONS ---
document.getElementById('monBouton').addEventListener('click', () => {
    document.body.style.backgroundColor = '#' + Math.floor(Math.random()*16777215).toString(16);
});

document.getElementById('NumberAleatoire').addEventListener('click', () => {
    alert('Nombre aléatoire : ' + (Math.floor(Math.random() * 67) + 1));
});

document.getElementById('motAleatoire').addEventListener('click', () => {
    const mots = ['pomme', 'banane', 'orange', 'fraise', 'raisin'];
    alert('Mot aléatoire : ' + mots[Math.floor(Math.random() * mots.length)]);
});

document.getElementById('BlagueAleatoire').addEventListener('click', () => {
    const blagues = ['Pourquoi les zombies mangent-ils du pain ?', 'Quel est le sport préféré des vampires ? Le foot !'];
    alert('Blague : ' + blagues[Math.floor(Math.random() * blagues.length)]);
});
// --- VARIABLES ET CONFIG ---
const canvas = document.getElementById('canvasDessin');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const resultatIA = document.getElementById('resultatIA');
const inputTaille = document.getElementById('taillePinceau');
const inputCouleur = document.getElementById('couleurPinceau');

let classifier, enTrainDeDessiner = false;

// Dictionnaire de traduction
const traductions = {
    "apple": "une pomme", "house": "une maison", "cat": "un chat", "face": "un visage",
    "sun": "un soleil", "airplane": "un avion", "fish": "un poisson", "tree": "un arbre"
};

// --- LOGIQUE IA ---
async function initIA() {
    resultatIA.innerText = "Chargement...";
    try {
        // Initialisation du modèle DoodleNet
        classifier = await ml5.imageClassifier('DoodleNet');
        resultatIA.innerText = "IA prête !";
        // Lancement de la boucle de classification
        classify();
    } catch (err) {
        resultatIA.innerText = "Erreur de chargement.";
        console.error(err);
    }
}

async function classify() {
    if (!classifier) return;

    // Création d'un canvas temporaire de 28x28 pixels en niveaux de gris
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 28; 
    tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext('2d');
    
    // 1. Fond blanc
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, 28, 28);
    
    // 2. Dessiner le contenu du canvas principal redimensionné à 28x28
    tempCtx.drawImage(canvas, 0, 0, 400, 400, 0, 0, 28, 28);
    
    // 3. Forcer le passage en noir et blanc pur (Niveaux de gris)
    // On utilise cette approche pour s'assurer que le tenseur envoyé a bien 1 seul canal
    const imgData = tempCtx.getImageData(0, 0, 28, 28);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        // Moyenne des canaux RGB pour obtenir le gris
        let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
    }
    tempCtx.putImageData(imgData, 0, 0);

    // Classification avec le canvas traité
    const results = await classifier.classify(tempCanvas);
    
    if (results && results.length > 0 && results[0].confidence > 0.2) {
        let labelAnglais = results[0].label;
        let labelFr = traductions[labelAnglais] || labelAnglais;
        resultatIA.innerText = "Je pense que c'est : " + labelFr;
    } else {
        resultatIA.innerText = "Je ne vois rien de clair...";
    }
    
    setTimeout(classify, 1000); 
}

// --- DESSIN ---
function dessiner(e) {
    if (!enTrainDeDessiner) return;
    ctx.lineWidth = inputTaille.value;
    ctx.strokeStyle = inputCouleur.value;
    ctx.lineCap = 'round';
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
}

canvas.addEventListener('mousedown', () => enTrainDeDessiner = true);
canvas.addEventListener('mouseup', () => { enTrainDeDessiner = false; ctx.beginPath(); });
canvas.addEventListener('mousemove', dessiner);

// --- NAVIGATION ---
document.getElementById('LancerDessin').addEventListener('click', () => {
    document.getElementById('zoneJeu').style.display = 'block';
    // Masquage du menu principal
    document.getElementById('menuPrincipal').style.display = 'none';
    initIA();
});

document.getElementById('btnEffacer').addEventListener('click', () => {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 400, 400);
});