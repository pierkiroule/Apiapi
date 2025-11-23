# Paysage existentiel (React + Vite)

Webapp ultra-frugale, 100% locale, pensée pour un psychologue clinicien : à partir d’un texte, elle extrait un réseau d’actants, projette un diagramme existentiel (centralité vs densité relationnelle), et génère une synthèse douce.

## Périmètre clé
- **5 écrans max** : Input → Nuage → Réseau → Diagramme → Synthèse.
- **Offline** : aucun backend, aucun appel API. Le modèle `all-MiniLM-L6-v2` est chargé via `@xenova/transformers`.
- **Fonctions principales** :
  - Nettoyage / segmentation / lemmatisation légère (FR).
  - Cooccurrences + proximité sémantique → réseau d’actants (ANT).
  - Embeddings MiniLM locaux, clustering k-means (3–4 groupes).
  - Diagramme existentiel 2D (bulles canvas léger, style Chart.js) + réseau Cytoscape.js.
  - Synthèse heuristique (noyau, tensions, ressources, questions), export PNG, sauvegarde IndexedDB.

## Installation
1. Cloner le repo puis installer les dépendances :
   ```bash
   npm install
   ```
2. Préparer le modèle MiniLM pour un usage 100% local **(aucun appel réseau)** :
   - Créer le dossier `public/models` (déjà présent avec un `.gitkeep`).
   - Télécharger en local `Xenova/all-MiniLM-L6-v2` (version quantized) depuis Hugging Face et placer les fichiers dans `public/models/all-MiniLM-L6-v2`.
   - La configuration dans `src/embeddings.js` force le chargement local (`allowRemoteModels = false`) ; l’appli échouera si le modèle n’est pas présent.
3. Lancer le mode dev :
   ```bash
   npm run dev
   ```
4. Build de production :
   ```bash
   npm run build && npm run preview
   ```

## Usage rapide
1. Coller un récit dans la zone de texte ou charger un exemple.
2. Cliquer sur « Lancer l’analyse locale » :
   - parsing + lemmatisation → nuage de mots,
   - embeddings MiniLM → réseau d’actants,
   - clustering + métriques → diagramme existentiel,
   - heuristiques → synthèse clinique douce.
3. Exporter le diagramme en PNG et retrouver la dernière session dans IndexedDB (stockage local uniquement).

## Exemples de texte
- Suivi clinique : "Je me sens souvent fatigué... retrouver une direction claire."
- Transition de vie : "Depuis le déménagement, tout paraît neuf... Je veux créer un foyer stable et doux."
- Questionnement identitaire : "Je me demande souvent qui je suis devenu... avancer avec cohérence."

## Architecture
```
├─ index.html
├─ vite.config.js
├─ src
│  ├─ main.jsx                # bootstrap React
│  ├─ App.jsx                 # UI mobile-first (5 écrans)
│  ├─ styles.css              # thème léger, 1 colonne
│  ├─ samples.js              # textes exemples
│  ├─ parser.js               # nettoyage + segmentation + lemmatisation FR
│  ├─ embeddings.js           # chargement MiniLM local + cosinus
│  ├─ network.js              # cooccurrences + graphe ANT
│  ├─ cluster.js              # k-means minimaliste
│  ├─ existentialDiagram.js   # centralité × densité (points normalisés)
│  ├─ chartLite.js            # rendu bulles canvas léger (Chart.js-like)
│  ├─ synthese.js             # heuristiques cliniques (noyau/tensions/ressources)
```

## Notes UX
- Interface mobile-first, transitions douces, bulles lisibles.
- Cytoscape pour déplacer visuellement les actants ; diagramme 2D rendu en canvas léger.
- Aucun backend, aucune télémétrie : tout reste dans le navigateur.
