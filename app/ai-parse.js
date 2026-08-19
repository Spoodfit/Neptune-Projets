function openAi(prefill = '') {
  els.aiPanel.classList.add('is-open');
  els.aiPanel.setAttribute('aria-hidden', 'false');
  els.aiOrb.setAttribute('aria-expanded', 'true');
  if (prefill) els.aiInput.value = prefill;
  autosizeAiInput();
  setTimeout(() => els.aiInput.focus(), 80);
}

function closeAi() {
  els.aiPanel.classList.remove('is-open');
  els.aiPanel.setAttribute('aria-hidden', 'true');
  els.aiOrb.setAttribute('aria-expanded', 'false');
}

function appendAiMessage(type, html) {
  const wrapper = document.createElement('div');
  wrapper.className = `ai-message ${type}`;
  if (type === 'assistant') wrapper.innerHTML = `<div class="ai-message-mark" aria-hidden="true">N</div><div>${html}</div>`;
  else wrapper.innerHTML = `<div>${html}</div>`;
  els.aiThread.appendChild(wrapper);
  els.aiThread.scrollTop = els.aiThread.scrollHeight;
  return wrapper;
}

function findProjectFromText(text) {
  const normalized = normalize(text);
  const aliases = {
    connexio: ['connexio', 'messagerie'],
    'social-conversion': ['social conversion', 'social', 'inbox'],
    'neptune-media': ['neptune media', 'media', 'studio'],
    'marche-noel': ['marché de noël', 'marche de noel', 'noël', 'noel'],
    school: ['school', 'école', 'ecole'],
  };
  let best = null;
  let score = 0;
  for (const project of state.projects) {
    const candidates = [project.name, ...(aliases[project.id] || [])];
    for (const candidate of candidates) {
      const candidateNorm = normalize(candidate);
      if (normalized.includes(candidateNorm) && candidateNorm.length > score) {
        best = project;
        score = candidateNorm.length;
      }
    }
  }
  return best;
}

function findTaskFromText(project, text) {
  const normalized = normalize(text);
  const words = new Set(normalized.split(/\s+/).filter((word) => word.length > 3));
  let best = null;
  let bestScore = 0;
  for (const role of project.roles) {
    for (const task of role.tasks) {
      const taskNorm = normalize(task.title);
      let score = 0;
      for (const word of words) if (taskNorm.includes(word)) score += word.length;
      if (score > bestScore) {
        best = { role, task };
        bestScore = score;
      }
    }
  }
  return bestScore >= 5 ? best : null;
}

function findBlockerFromText(project, text) {
  const normalized = normalize(text);
  const words = normalized.split(/\s+/).filter((word) => word.length > 3);
  let best = null;
  let bestScore = 0;
  for (const blocker of project.blockers) {
    const haystack = normalize(`${blocker.title} ${blocker.detail}`);
    let score = 0;
    for (const word of words) if (haystack.includes(word)) score += word.length;
    if (score > bestScore) {
      best = blocker;
      bestScore = score;
    }
  }
  return best || project.blockers[0] || null;
}

function findResolutionTask(project, blocker) {
  const blockerWords = normalize(`${blocker.title} ${blocker.detail}`).split(/\s+/).filter((word) => word.length > 4);
  let best = null;
  let bestScore = -1;
  for (const role of project.roles) {
    for (const task of role.tasks) {
      if (task.status === 'done') continue;
      const haystack = normalize(`${task.title} ${task.note}`);
      let score = task.status === 'blocked' ? 3 : 0;
      for (const word of blockerWords) if (haystack.includes(word)) score += word.length;
      if (score > bestScore) {
        best = { role, task };
        bestScore = score;
      }
    }
  }
  return best;
}

function proposeAiAction(text) {
  const normalized = normalize(text);
  const createIntent = /(^| )(cree|creer|nouveau projet|ajoute un projet)( |$)/.test(normalized);
  if (createIntent) {
    const rawName = (text.split(':').slice(1).join(':').trim() || text.replace(/cr[ée]e?r?\s+(un\s+)?(nouveau\s+)?projet\s*/i, '').trim()).replace(/[.!?]+$/, '');
    if (!rawName || rawName.length < 3) return { type: 'clarify', message: 'Donne-moi simplement le nom du projet.' };
    const startDate = new Date(TODAY);
    const endDate = new Date(TODAY.getTime() + 45 * DAY);
    const iso = (d) => d.toISOString().slice(0, 10);
    const draftProject = {
      id: `${normalize(rawName).replace(/\s+/g, '-').slice(0, 36)}-${Date.now().toString(36).slice(-4)}`,
      name: rawName,
      short: rawName.split(/\s+/).slice(0,2).map((w) => w[0]?.toUpperCase() || '').join('').slice(0,2) || 'NP',
      status: 'fluid',
      stateText: 'Fluide · projet nouvellement créé',
      start: iso(startDate), end: iso(endDate), deadlineNote: 'Échéance à confirmer',
      summary: 'Projet créé depuis Neptune.',
      stages: [
        { label: 'Cadrage', note: 'But et résultat attendu', state: 'current' },
        { label: 'Préparation', note: 'Actions et dépendances', state: 'future' },
        { label: 'Exécution', note: 'Travail en cours', state: 'future' },
        { label: 'Validation', note: 'Contrôle final', state: 'future' },
        { label: 'Terminé', note: 'Résultat livré', state: 'future' },
      ],
      milestones: [{ date: iso(startDate), label: 'Départ', current: true }, { date: iso(endDate), label: 'Cible' }],
      blockers: [],
      roles: [{ id: 'lead', name: 'À assigner', role: 'Chef de projet', initials: '?', tone: 'slate', state: 'good', message: 'Responsable à préciser.', tasks: [] }],
    };
    return { type: 'project-create', project: draftProject, message: `Créer <strong>${escapeHtml(rawName)}</strong> dans <strong>${escapeHtml(state.workspace.name)}</strong> ?` };
  }

  const project = findProjectFromText(text) || (activeProjectId ? state.projects.find((p) => p.id === activeProjectId) : null);
  if (!project) return { type: 'clarify', message: 'Quel projet ?' };

  const resolutionIntent = /(resou|résou|solution|deblo|déblo|lever|leve|bloquage|blocage)/.test(normalized) && project.blockers.length;
  if (resolutionIntent) {
    const blocker = findBlockerFromText(project, text);
    const resolution = blocker ? findResolutionTask(project, blocker) : null;
    if (blocker && resolution) {
      return {
        type: 'resolution', project, blocker, role: resolution.role, task: resolution.task,
        message: `<strong>${escapeHtml(blocker.title)}</strong><br><span class="resolution-line">Action la plus directe → <strong>${escapeHtml(resolution.task.title)}</strong></span><br><span class="resolution-owner">${escapeHtml(resolution.role.name)} · ${escapeHtml(resolution.role.role)}</span>`,
      };
    }
    if (blocker) return { type: 'resolution', project, blocker, message: `<strong>${escapeHtml(blocker.title)}</strong><br><span class="resolution-line">${escapeHtml(blocker.detail)}</span>` };
  }

  const taskMatch = findTaskFromText(project, text);
  const wantsDone = /(termin|fini|finalis|valid|boucl|livr)/.test(normalized);
  const wantsBlocked = /(bloqu|attend|impossible|depend|dépend)/.test(normalized);
  const wantsProgress = /(avance|cours|commenc|travail|en train)/.test(normalized);

  const targetStatus = wantsBlocked ? 'blocked' : wantsDone ? 'done' : wantsProgress ? 'progress' : null;
  if (taskMatch && targetStatus) {
    return {
      type: 'task-update', project, role: taskMatch.role, task: taskMatch.task, targetStatus,
      message: `<strong>${escapeHtml(taskMatch.task.title)}</strong> → ${escapeHtml(taskMeta(targetStatus).label.toLowerCase())}.`,
    };
  }

  if (wantsDone && /(android|play console)/.test(normalized) && project.id === 'connexio') {
    const role = project.roles.find((r) => r.id === 'release');
    const task = role?.tasks.find((t) => /play console/i.test(t.title));
    if (role && task) return { type: 'task-update', project, role, task, targetStatus: 'done', message: `<strong>${escapeHtml(task.title)}</strong> → terminé.` };
  }

  return { type: 'project-note', project, message: `Noter cette information dans <strong>${escapeHtml(project.name)}</strong> sans modifier une tâche ?` };
}
