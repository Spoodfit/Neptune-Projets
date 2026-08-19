function handleAiSubmit(text) {
  const clean = text.trim();
  if (!clean) return;
  appendAiMessage('user', `<p>${escapeHtml(clean)}</p>`);
  els.aiInput.value = '';
  autosizeAiInput();
  const proposal = proposeAiAction(clean);

  if (proposal.type === 'clarify') {
    appendAiMessage('assistant', `<p>${proposal.message}</p>`);
    return;
  }

  const confirmation = proposal.type === 'task-update'
    ? `<div class="ai-confirmation"><button type="button" class="primary" data-ai-confirm="yes">Confirmer</button><button type="button" data-ai-confirm="no">Non</button></div>`
    : proposal.type === 'project-create'
      ? `<div class="ai-confirmation"><button type="button" class="primary" data-ai-confirm="create">Créer</button><button type="button" data-ai-confirm="no">Annuler</button></div>`
      : `<div class="ai-confirmation"><button type="button" class="primary" data-ai-confirm="note">Noter</button><button type="button" data-ai-confirm="no">Annuler</button></div>`;

  const message = appendAiMessage('assistant', `<p>${proposal.message}</p>${confirmation}`);
  $$('[data-ai-confirm]', message).forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.aiConfirm;
    if (action === 'yes' && proposal.type === 'task-update') {
      proposal.task.status = proposal.targetStatus;
      persistState();
      renderProjectRows();
      if (activeProjectId === proposal.project.id) {
        renderFocus(proposal.project);
        openRole(proposal.project, proposal.role.id);
      }
      message.querySelector('.ai-confirmation')?.remove();
      appendAiMessage('assistant', '<p>Mis à jour.</p>');
      toast('Mis à jour');
    } else if (action === 'create' && proposal.type === 'project-create') {
      state.projects.push(proposal.project);
      state.projectSets[state.workspace.id] = state.projects;
      persistState();
      refreshTimelineView();
      message.querySelector('.ai-confirmation')?.remove();
      appendAiMessage('assistant', '<p>Projet créé.</p>');
      toast('Projet créé');
    } else if (action === 'note') {
      message.querySelector('.ai-confirmation')?.remove();
      appendAiMessage('assistant', '<p>Noté dans le projet.</p>');
      toast('Noté');
    } else {
      message.querySelector('.ai-confirmation')?.remove();
      appendAiMessage('assistant', '<p>Aucune modification.</p>');
    }
  }));
}

function autosizeAiInput() {
  els.aiInput.style.height = 'auto';
  els.aiInput.style.height = `${Math.min(130, els.aiInput.scrollHeight)}px`;
}

function normalize(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  els.toastRegion.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function renderSearch(query = '') {
  const q = normalize(query);
  const projectMatches = state.projects.filter((project) => !q || normalize(`${project.name} ${project.stateText}`).includes(q));
  const taskMatches = [];
  if (q) {
    for (const project of state.projects) {
      for (const role of project.roles) {
        for (const task of role.tasks) {
          if (normalize(`${task.title} ${role.name} ${role.role} ${project.name}`).includes(q)) taskMatches.push({ project, role, task });
        }
      }
    }
  }

  if (!projectMatches.length && !taskMatches.length) {
    els.searchResults.innerHTML = '<div class="search-empty">Aucun résultat.</div>';
    return;
  }

  let html = '';
  if (projectMatches.length) {
    html += '<div class="search-section-label">Projets</div>';
    html += projectMatches.slice(0, 6).map((project) => `<button class="search-result" type="button" data-search-project="${project.id}"><span class="search-result-icon">${icons.arrow}</span><span class="search-result-copy"><strong>${escapeHtml(project.name)}</strong><span>${escapeHtml(project.stateText)}</span></span></button>`).join('');
  }
  if (taskMatches.length) {
    html += '<div class="search-section-label">Tâches</div>';
    html += taskMatches.slice(0, 8).map(({ project, role, task }) => `<button class="search-result" type="button" data-search-task="${project.id}|${role.id}"><span class="search-result-icon">${taskMeta(task.status).icon}</span><span class="search-result-copy"><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(project.name)} · ${escapeHtml(role.name)}</span></span></button>`).join('');
  }
  els.searchResults.innerHTML = html;
  $$('[data-search-project]', els.searchResults).forEach((button) => button.addEventListener('click', () => {
    els.searchDialog.close();
    openProject(button.dataset.searchProject);
  }));
  $$('[data-search-task]', els.searchResults).forEach((button) => button.addEventListener('click', () => {
    const [projectId, roleId] = button.dataset.searchTask.split('|');
    els.searchDialog.close();
    openProject(projectId);
    requestAnimationFrame(() => {
      const project = state.projects.find((p) => p.id === projectId);
      if (project) openRole(project, roleId);
    });
  }));
}

function showSheet(title, content, options = {}) {
  document.querySelector('.utility-sheet-backdrop')?.remove();
  const backdrop = document.createElement('div');
  backdrop.className = 'utility-sheet-backdrop';
  backdrop.innerHTML = `<section class="utility-sheet" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><header><div><p class="eyebrow">${escapeHtml(options.kicker || 'Neptune')}</p><h2>${escapeHtml(title)}</h2></div><button class="icon-button" type="button" data-close-sheet aria-label="Fermer"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><div class="utility-sheet-body">${content}</div></section>`;
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('is-open'));
  const close = () => { backdrop.classList.remove('is-open'); setTimeout(() => backdrop.remove(), 180); };
  $('[data-close-sheet]', backdrop).addEventListener('click', close);
  backdrop.addEventListener('click', (event) => { if (event.target === backdrop) close(); });
  document.addEventListener('keydown', function esc(event) { if (event.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  return { backdrop, close };
}

function openWorkspaceSheet() {
  const items = state.workspaces.map((item) => `<button type="button" class="workspace-option ${item.id === state.workspace.id ? 'is-selected' : ''}" data-workspace-id="${escapeHtml(item.id)}"><span class="workspace-option-mark">${escapeHtml(item.name.slice(0,1).toUpperCase())}</span><span><strong>${escapeHtml(item.name)}</strong><small>${item.id === state.workspace.id ? 'Actif' : 'Ouvrir'}</small></span>${item.id === state.workspace.id ? icons.check : icons.arrow}</button>`).join('');
  const { backdrop, close } = showSheet('Espaces', `${items}<button type="button" class="sheet-primary-action" data-create-workspace>+ Nouvelle organisation</button>`, { kicker: 'Organisation' });
  $$('[data-workspace-id]', backdrop).forEach((button) => button.addEventListener('click', () => {
    const item = state.workspaces.find((ws) => ws.id === button.dataset.workspaceId);
    if (!item) return;
    state.workspace = { id: item.id, name: item.name, members: item.members || 1 };
    state.projects = state.projectSets[item.id] || [];
    els.workspaceName.textContent = item.name;
    refreshTimelineView();
    persistState();
    close();
    requestAnimationFrame(centerToday);
    toast(item.name);
  }));
  $('[data-create-workspace]', backdrop).addEventListener('click', () => {
    const body = $('.utility-sheet-body', backdrop);
    body.innerHTML = `<form class="simple-form" data-workspace-form><label>Nom<input name="name" required maxlength="60" placeholder="Ex. Studio Horizon"></label><button class="sheet-primary-action" type="submit">Créer</button></form>`;
    $('[data-workspace-form]', body).addEventListener('submit', (event) => {
      event.preventDefault();
      const name = new FormData(event.currentTarget).get('name').trim();
      if (!name) return;
      const id = `${normalize(name).replace(/\s+/g, '-')}-${Date.now().toString(36).slice(-4)}`;
      state.workspaces.push({ id, name, members: 1 });
      state.projectSets[id] = [];
      state.workspace = { id, name, members: 1 };
      state.projects = state.projectSets[id];
      els.workspaceName.textContent = name;
      refreshTimelineView();
      persistState();
      close();
      requestAnimationFrame(centerToday);
      toast('Organisation créée');
    });
  });
}

function openPeopleSheet() {
  const people = new Map();
  for (const project of state.projects) {
    for (const role of project.roles) {
      if (!people.has(role.name)) people.set(role.name, { ...role, projects: [] });
      people.get(role.name).projects.push(project.name);
    }
  }
  const content = people.size
    ? [...people.values()].slice(0, 12).map((person) => `<div class="people-sheet-row"><span class="role-avatar" style="background:${toneGradient(person.tone)}">${escapeHtml(person.initials)}</span><span><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(person.role)} · ${person.projects.length} projet${person.projects.length > 1 ? 's' : ''}</small></span><span class="presence-dot" title="Présence"></span></div>`).join('')
    : '<div class="search-empty">Aucun membre.</div>';
  showSheet('Équipe', content, { kicker: 'Responsabilités' });
}

function openSettingsSheet() {
  const content = `<div class="setting-row"><span><strong>Animations</strong><small>Mouvements discrets de la carte.</small></span><button class="toggle is-on" type="button" data-toggle-motion aria-pressed="true"><span></span></button></div><div class="setting-row"><span><strong>Densité</strong><small>Ajuste l’espace entre les éléments.</small></span><select data-density><option value="comfortable">Normale</option><option value="compact">Dense</option></select></div>`;
  const { backdrop } = showSheet('Réglages', content, { kicker: 'Interface' });
  $('[data-toggle-motion]', backdrop).addEventListener('click', (event) => {
    const button = event.currentTarget;
    button.classList.toggle('is-on');
    button.setAttribute('aria-pressed', String(button.classList.contains('is-on')));
    document.documentElement.classList.toggle('motion-off', !button.classList.contains('is-on'));
  });
  $('[data-density]', backdrop).addEventListener('change', (event) => document.querySelector('#app').dataset.density = event.target.value);
}
