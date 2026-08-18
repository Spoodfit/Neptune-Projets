# Neptune Projets — Front-end

Phase actuelle : **front-end uniquement**, en attente de validation UI/UX avant toute intégration backend.

## Vision produit

Neptune Projets n'est pas conçu comme un outil de gestion de projet administratif. L'interface doit permettre de comprendre en quelques secondes :

- ce qui avance ;
- ce qui bloque ;
- ce qui arrive ensuite ;
- qui porte la prochaine action.

La donnée détaillée reste secondaire. Le visuel principal est une carte temporelle vivante inspirée du principe du Gantt, mais repensée pour éviter l'effet tableur.

## Front actuellement implémenté

- carte temporelle principale avec trajectoires de projets ;
- jalons, échéances, blocages et états visuels ;
- filtres contextuels ;
- zoom temporel ;
- vue projet en profondeur sans rupture de contexte ;
- lecture par responsabilité puis par tâches ;
- panneau Neptune AI simulé côté front pour tester le parcours conversationnel ;
- recherche globale (`Ctrl/Cmd + K`) ;
- espaces / organisations simulés localement ;
- responsive desktop, tablette et mobile ;
- navigation clavier, focus visibles et réduction des animations ;
- PWA et service worker ;
- persistance locale via `localStorage` pour les tests d'usage.

## Important

Aucune synchronisation serveur, authentification réelle, base de données, permission distante ou appel IA réel n'est encore branché. Les comportements sont volontairement locaux afin de valider le front avant de construire la suite.

## Lancer localement

```bash
node server.mjs
```

Puis ouvrir `http://localhost:4173`.

## Structure

```text
index.html              structure de l'interface
styles.css              design system + responsive
app.js                  interactions et état local du front
data.js                 données d'exemple pour valider l'UX
manifest.webmanifest    configuration PWA
service-worker.js       cache applicatif
assets/favicon.svg      identité temporaire
_headers                headers statiques recommandés
server.mjs              serveur local sans dépendance
```
