export const workspace = {
  id: 'neptune',
  name: 'Neptune',
  members: 8,
};

export const projects = [
  {
    id: 'connexio',
    name: 'Connexio — sortie mobile',
    short: 'CX',
    status: 'attention',
    stateText: 'À surveiller · iOS dépend du compte développeur',
    start: '2026-07-20',
    end: '2026-09-18',
    deadlineNote: 'Marge faible sur iOS',
    summary: 'Finaliser la publication Android et iOS, sécuriser les derniers tests et brancher l’application au backend Neptune.',
    stages: [
      { label: 'Front', note: 'Interface et interactions', state: 'done' },
      { label: 'Android', note: 'Build et Play Console', state: 'done' },
      { label: 'iOS', note: 'Compte et publication', state: 'current' },
      { label: 'API', note: 'Connexion Neptune', state: 'current' },
      { label: 'Release', note: 'Stores + contrôle final', state: 'future' },
    ],
    milestones: [
      { date: '2026-07-28', label: 'RC1', done: true },
      { date: '2026-08-18', label: 'Android', done: true },
      { date: '2026-09-02', label: 'iOS', current: true },
      { date: '2026-09-18', label: 'Release' },
    ],
    blockers: [
      { date: '2026-08-26', title: 'Compte Apple Developer', detail: 'La publication iOS ne peut pas être finalisée avant activation du compte.', owner: 'Johan', kind: 'decision' },
    ],
    roles: [
      {
        id: 'tech', name: 'Alexis', role: 'Direction technique', initials: 'A', tone: 'cyan', state: 'warning',
        message: 'Le produit est stable. Il reste l’API et la chaîne iOS à verrouiller.',
        tasks: [
          { title: 'Brancher l’API Connexio au backend Neptune', status: 'progress', due: 'Cette semaine', note: 'Contrat d’API prêt pour intégration.' },
          { title: 'Vérifier les callbacks de notifications', status: 'todo', due: '24 août', note: 'Android puis équivalent iOS.' },
          { title: 'Tests de non-régression RC1', status: 'done', due: 'Terminé', note: 'Suite de tests validée.' },
        ],
      },
      {
        id: 'product', name: 'Léa', role: 'Pilotage produit', initials: 'L', tone: 'violet', state: 'good',
        message: 'Les parcours prioritaires sont validés. Aucun arbitrage UX urgent.',
        tasks: [
          { title: 'Valider les textes stores', status: 'todo', due: '22 août', note: 'Description courte, longue et captures.' },
          { title: 'Contrôler les écrans critiques', status: 'done', due: 'Terminé', note: 'Messagerie, appels, profils, rendez-vous.' },
        ],
      },
      {
        id: 'release', name: 'Johan', role: 'Release & stores', initials: 'J', tone: 'blue', state: 'blocker',
        message: 'Android est prêt. La seule friction forte reste l’accès Apple Developer.',
        tasks: [
          { title: 'Finaliser Play Console', status: 'progress', due: '20 août', note: 'Fiche application et contrôle du build.' },
          { title: 'Activer Apple Developer', status: 'blocked', due: 'Bloqué', note: 'Prérequis à la publication iOS.' },
          { title: 'Préparer la checklist de publication', status: 'todo', due: '26 août', note: 'Stores, confidentialité, versioning.' },
        ],
      },
      {
        id: 'com', name: 'Océane', role: 'Communication', initials: 'O', tone: 'amber', state: 'good',
        message: 'La communication peut démarrer dès que la date stores est verrouillée.',
        tasks: [
          { title: 'Préparer l’annonce de lancement', status: 'todo', due: 'À caler', note: 'Dépend de la date de publication.' },
          { title: 'Lister les contenus onboarding', status: 'done', due: 'Terminé', note: 'Tutoriels courts prêts à tourner.' },
        ],
      },
    ],
  },
  {
    id: 'social-conversion',
    name: 'Social Conversion',
    short: 'SC',
    status: 'fluid',
    stateText: 'Fluide · architecture et UX avancent ensemble',
    start: '2026-08-03',
    end: '2026-11-06',
    deadlineNote: 'Trajectoire saine',
    summary: 'Centraliser les réseaux sociaux, les interactions, les conversions et les automatisations dans une interface cohérente par plateforme.',
    stages: [
      { label: 'Architecture', note: 'Espaces et comptes', state: 'done' },
      { label: 'Inbox', note: 'Interactions par réseau', state: 'current' },
      { label: 'Calendrier', note: 'Création et planification', state: 'current' },
      { label: 'IA', note: 'Agent et règles auto', state: 'future' },
      { label: 'Beta', note: 'Usage interne Neptune', state: 'future' },
    ],
    milestones: [
      { date: '2026-08-12', label: 'Architecture', done: true },
      { date: '2026-09-05', label: 'Inbox', current: true },
      { date: '2026-10-02', label: 'Calendrier' },
      { date: '2026-11-06', label: 'Beta' },
    ],
    blockers: [],
    roles: [
      {
        id: 'product', name: 'Johan', role: 'Pilotage produit', initials: 'J', tone: 'blue', state: 'good',
        message: 'Le cap est clair : moins de menus, plus de contexte propre à chaque réseau.',
        tasks: [
          { title: 'Valider le comportement de l’Inbox par réseau', status: 'progress', due: '21 août', note: 'Commentaires, DM, likes et réponses.' },
          { title: 'Valider le sélecteur Tous / Compte unique', status: 'done', due: 'Terminé', note: 'Logique de filtrage confirmée.' },
          { title: 'Cadrer les règles “Gagné”', status: 'done', due: 'Terminé', note: 'CTA accepté ou email fourni.' },
        ],
      },
      {
        id: 'tech', name: 'Alexis', role: 'Technique', initials: 'A', tone: 'cyan', state: 'good',
        message: 'Les fondations sont propres. Le point sensible sera l’hétérogénéité des API sociales.',
        tasks: [
          { title: 'Normaliser le modèle d’interactions', status: 'progress', due: '28 août', note: 'Une base commune sans gommer les spécificités.' },
          { title: 'Préparer les adaptateurs Meta', status: 'todo', due: '4 sept.', note: 'Instagram et Facebook.' },
          { title: 'Séparer données par compte social', status: 'done', due: 'Terminé', note: 'Aucune fusion involontaire.' },
        ],
      },
      {
        id: 'design', name: 'Léa', role: 'Expérience', initials: 'L', tone: 'violet', state: 'good',
        message: 'La hiérarchie visuelle est lisible ; priorité aux états contextuels de l’Inbox.',
        tasks: [
          { title: 'Harmoniser espacements et marges', status: 'progress', due: '25 août', note: 'Revue écran par écran.' },
          { title: 'Définir les micro-animations', status: 'todo', due: '31 août', note: 'Confirmation sans pop-up.' },
        ],
      },
      {
        id: 'ai', name: 'Neptune AI', role: 'Automatisation', initials: 'N', tone: 'mint', state: 'good',
        message: 'En attente des contrats d’actions pour brancher les décisions automatiques.',
        tasks: [
          { title: 'Définir les actions autorisées', status: 'todo', due: 'Septembre', note: 'Réponse, classement, CTA et suivi.' },
          { title: 'Tracer les décisions de l’agent', status: 'todo', due: 'Septembre', note: 'Journal explicable et réversible.' },
        ],
      },
    ],
  },
  {
    id: 'neptune-media',
    name: 'Neptune Media — industrialisation',
    short: 'NM',
    status: 'waiting',
    stateText: 'En attente · dépend de la cadence commerciale',
    start: '2026-08-24',
    end: '2026-10-23',
    deadlineNote: 'Démarrage après validation',
    summary: 'Stabiliser l’offre studio, la réservation et le parcours de production pour rendre le service répétable et rentable.',
    stages: [
      { label: 'Offre', note: 'Formats et prix', state: 'done' },
      { label: 'Site', note: 'Réservation et contenus', state: 'current' },
      { label: 'Process', note: 'Tournage et livraison', state: 'future' },
      { label: 'Acquisition', note: 'Cadence commerciale', state: 'future' },
      { label: 'Récurrence', note: '5–6 sessions/mois', state: 'future' },
    ],
    milestones: [
      { date: '2026-08-28', label: 'Offre', done: true },
      { date: '2026-09-18', label: 'Site', current: true },
      { date: '2026-10-02', label: 'Process' },
      { date: '2026-10-23', label: 'Récurrence' },
    ],
    blockers: [
      { date: '2026-09-06', title: 'Cadence d’acquisition non verrouillée', detail: 'Le process peut être prêt, mais sans volume commercial régulier le projet ne produit pas son effet.', owner: 'Direction', kind: 'decision' },
    ],
    roles: [
      {
        id: 'offer', name: 'Léa', role: 'Offre', initials: 'L', tone: 'violet', state: 'good',
        message: 'Les formats sont clairs. Il faut éviter d’ajouter des variantes avant d’avoir du volume.',
        tasks: [
          { title: 'Verrouiller les formats commercialisés', status: 'progress', due: '28 août', note: 'Hors Norme, Connexio et Libre.' },
          { title: 'Nettoyer les miniatures de sélection', status: 'progress', due: '22 août', note: 'Un seul titre, lecture immédiate.' },
        ],
      },
      {
        id: 'sales', name: 'Johan', role: 'Commercial', initials: 'J', tone: 'blue', state: 'blocker',
        message: 'Le vrai risque est d’avoir un beau produit sans machine d’acquisition récurrente.',
        tasks: [
          { title: 'Définir la cadence de prospection', status: 'blocked', due: 'À décider', note: 'Volume hebdomadaire et canal principal.' },
          { title: 'Construire le suivi des leads studios', status: 'todo', due: '2 sept.', note: 'De la demande à la réservation.' },
        ],
      },
      {
        id: 'production', name: 'RECBOX', role: 'Production studio', initials: 'R', tone: 'amber', state: 'good',
        message: 'Capacité disponible ; la standardisation des livrables reste à formaliser.',
        tasks: [
          { title: 'Formaliser le pack de livraison', status: 'todo', due: '8 sept.', note: 'Long format + shorts + fichiers.' },
          { title: 'Définir les délais standards', status: 'todo', due: '8 sept.', note: 'Promesse client reproductible.' },
        ],
      },
      {
        id: 'site', name: 'Équipe web', role: 'Site & réservation', initials: 'W', tone: 'cyan', state: 'warning',
        message: 'Le parcours est fonctionnel, mais il reste à supprimer les frictions visuelles.',
        tasks: [
          { title: 'Simplifier la sélection des formats', status: 'progress', due: '30 août', note: 'Choix visuel sans surcharge.' },
          { title: 'Contrôler le mobile', status: 'todo', due: '2 sept.', note: 'Réservation complète sur petit écran.' },
        ],
      },
    ],
  },
  {
    id: 'marche-noel',
    name: 'Marché de Noël 2026',
    short: 'MN',
    status: 'fluid',
    stateText: 'Fluide · montée en charge jusqu’au 29 novembre',
    start: '2026-08-10',
    end: '2026-11-29',
    deadlineNote: '29 novembre 2026',
    summary: 'Piloter les exposants, la communication, la logistique et l’expérience visiteurs sans perdre la vue globale de l’évènement.',
    stages: [
      { label: 'Exposants', note: 'Recrutement et suivi', state: 'current' },
      { label: 'Communication', note: 'Montée en puissance', state: 'current' },
      { label: 'Logistique', note: 'Salles, stands, flux', state: 'future' },
      { label: 'Jour J', note: 'Exécution', state: 'future' },
      { label: 'Bilan', note: 'Retours et chiffres', state: 'future' },
    ],
    milestones: [
      { date: '2026-08-18', label: 'Lancement', done: true },
      { date: '2026-09-30', label: '50 stands', current: true },
      { date: '2026-11-10', label: 'Plan final' },
      { date: '2026-11-29', label: 'Jour J' },
    ],
    blockers: [],
    roles: [
      {
        id: 'event', name: 'Léa', role: 'Direction évènement', initials: 'L', tone: 'violet', state: 'good',
        message: 'Le planning est cohérent. La priorité est de fermer progressivement les inconnues logistiques.',
        tasks: [
          { title: 'Finaliser la répartition des 5 salles', status: 'progress', due: '15 sept.', note: 'Capacité, circulation et catégories.' },
          { title: 'Verrouiller le plan exposants', status: 'todo', due: '10 nov.', note: 'Placement final après clôture.' },
        ],
      },
      {
        id: 'com', name: 'Océane', role: 'Communication', initials: 'O', tone: 'amber', state: 'good',
        message: 'La communication est lancée ; il faut garder une cadence utile jusqu’au jour J.',
        tasks: [
          { title: 'Planifier les séries de stories', status: 'progress', due: 'Continu', note: 'Avant, pendant et défis interactifs.' },
          { title: 'Préparer les contenus J-30 / J-7 / J-J', status: 'todo', due: 'Octobre', note: 'Réutilisables sur les réseaux.' },
        ],
      },
      {
        id: 'sales', name: 'Johan', role: 'Exposants & partenaires', initials: 'J', tone: 'blue', state: 'good',
        message: 'Le recrutement avance. Il faut suivre les catégories pour éviter un marché déséquilibré.',
        tasks: [
          { title: 'Suivre les inscriptions exposants', status: 'progress', due: 'Hebdomadaire', note: 'Quantité + équilibre des catégories.' },
          { title: 'Fermer les besoins partenaires', status: 'todo', due: '30 sept.', note: 'Restauration, animation et soutien.' },
        ],
      },
      {
        id: 'ops', name: 'Équipe terrain', role: 'Logistique', initials: 'T', tone: 'mint', state: 'good',
        message: 'Aucune alerte immédiate. Le plan terrain devra être figé assez tôt pour absorber les imprévus.',
        tasks: [
          { title: 'Lister matériel et signalétique', status: 'todo', due: '15 oct.', note: 'Stands, circulation, sécurité.' },
          { title: 'Préparer le plan de montage', status: 'todo', due: '10 nov.', note: 'Ordre, responsables, temps.' },
        ],
      },
    ],
  },
  {
    id: 'school',
    name: 'Neptune School — nouvelle offre',
    short: 'NS',
    status: 'upcoming',
    stateText: 'À venir · cadrage prévu après les priorités actuelles',
    start: '2026-10-05',
    end: '2026-12-18',
    deadlineNote: 'Pas encore engagé',
    summary: 'Concevoir une offre pédagogique Neptune simple à vendre et à délivrer, sans détourner les ressources des produits déjà lancés.',
    stages: [
      { label: 'Problème', note: 'Besoin cible', state: 'future' },
      { label: 'Offre', note: 'Format et promesse', state: 'future' },
      { label: 'Contenu', note: 'Parcours pédagogique', state: 'future' },
      { label: 'Pilote', note: 'Premiers utilisateurs', state: 'future' },
      { label: 'Lancement', note: 'Commercialisation', state: 'future' },
    ],
    milestones: [
      { date: '2026-10-05', label: 'Kickoff', current: true },
      { date: '2026-11-02', label: 'Offre' },
      { date: '2026-12-01', label: 'Pilote' },
      { date: '2026-12-18', label: 'Go/No-Go' },
    ],
    blockers: [],
    roles: [
      {
        id: 'lead', name: 'Direction', role: 'Cadrage', initials: 'D', tone: 'slate', state: 'good',
        message: 'Projet volontairement non démarré pour éviter de disperser les ressources.',
        tasks: [
          { title: 'Définir le problème client prioritaire', status: 'todo', due: 'Octobre', note: 'Avant tout contenu ou plateforme.' },
          { title: 'Choisir le format pilote', status: 'todo', due: 'Octobre', note: 'Le plus simple à vendre et délivrer.' },
        ],
      },
    ],
  },
];

export const statusLabels = {
  fluid: 'Fluide',
  attention: 'À surveiller',
  blocked: 'Bloqué',
  waiting: 'En attente',
  upcoming: 'À venir',
};
