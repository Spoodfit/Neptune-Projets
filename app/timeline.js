function renderMonths() {
  els.monthScale.innerHTML = '';
  let cursor = new Date(VIEW_START);
  while (cursor <= VIEW_END) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const clippedStart = start < VIEW_START ? VIEW_START : start;
    const clippedEnd = end > VIEW_END ? VIEW_END : end;
    const left = Math.round((clippedStart - VIEW_START) / DAY);
    const width = Math.round((clippedEnd - clippedStart) / DAY) + 1;
    const cell = document.createElement('div');
    cell.className = `month-cell${TODAY.getMonth() === month && TODAY.getFullYear() === year ? ' current' : ''}`;
    cell.style.left = `calc(${left} * var(--timeline-unit))`;
    cell.style.width = `calc(${width} * var(--timeline-unit))`;
    cell.textContent = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(start).replace('.', '');
    els.monthScale.appendChild(cell);
    cursor = new Date(year, month + 1, 1);
  }
}

function visualProgress(project) {
  const tasks = project.roles.flatMap((role) => role.tasks || []);
  if (tasks.length) {
    const value = tasks.reduce((sum, task) => sum + (task.status === 'done' ? 1 : task.status === 'progress' ? .55 : 0), 0);
    return Math.max(8, Math.min(100, (value / tasks.length) * 100));
  }
  const stages = project.stages || [];
  if (!stages.length) return 8;
  const value = stages.reduce((sum, stage) => sum + (stage.state === 'done' ? 1 : stage.state === 'current' ? .5 : 0), 0);
  return Math.max(8, Math.min(100, (value / stages.length) * 100));
}

function beginProjectCreation() {
  isCreatingProject = true;
  renderProjectRows();
  requestAnimationFrame(() => $('[data-new-project-name]')?.focus());
}

function cancelProjectCreation() { isCreatingProject = false; renderProjectRows(); }

function renderCreationRow() {
  const start = toISO(TODAY);
  const end = addDays(start, 30);
  const row = document.createElement('form');
  row.className = 'new-project-row';
  row.innerHTML = `<input data-new-project-name required maxlength="80" placeholder="Nom du projet" aria-label="Nom du projet"><input data-new-project-start type="date" value="${start}" aria-label="Date de début"><input data-new-project-end type="date" value="${end}" aria-label="Date de fin"><button class="new-project-save" type="submit">Créer</button><button class="new-project-cancel" type="button">Annuler</button>`;
  row.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = $('[data-new-project-name]', row).value.trim();
    const startDate = $('[data-new-project-start]', row).value;
    const endDate = $('[data-new-project-end]', row).value;
    if (!name || !startDate || !endDate || endDate < startDate) return;
    const project = {
      id: `${normalize(name).replace(/\s+/g, '-').slice(0, 34)}-${Date.now().toString(36).slice(-4)}`,
      name, short: name.split(/\s+/).slice(0,2).map((word) => word[0]?.toUpperCase() || '').join('').slice(0,2) || 'NP', status: 'fluid', stateText: 'Fluide · nouveau projet', start: startDate, end: endDate, deadlineNote: '', summary: '',
      stages: [{ label: 'Départ', note: '', state: 'current' }, { label: 'À faire', note: '', state: 'future' }, { label: 'Terminé', note: '', state: 'future' }], milestones: [], blockers: [], roles: [],
    };
    state.projects.push(project); state.projectSets[state.workspace.id] = state.projects; persistState(); isCreatingProject = false; refreshTimelineView(); requestAnimationFrame(() => openProject(project.id));
  });
  $('.new-project-cancel', row).addEventListener('click', cancelProjectCreation);
  return row;
}

function renderProjectRows() {
  els.projectRows.innerHTML = '';
  if (isCreatingProject) els.projectRows.appendChild(renderCreationRow());
  if (!state.projects.length && !isCreatingProject) {
    const empty = document.createElement('div'); empty.className = 'empty-project-map'; empty.innerHTML = `<strong>Aucun projet</strong><button type="button" data-empty-create>＋ Créer un projet</button>`; els.projectRows.appendChild(empty); $('[data-empty-create]', empty).addEventListener('click', beginProjectCreation); return;
  }

  for (const project of state.projects) {
    const row = document.createElement('article');
    row.className = `project-row${project.id === activeProjectId ? ' is-selected' : ''}`;
    row.dataset.projectId = project.id; row.dataset.status = project.status; row.dataset.hasBlocker = String(project.blockers.length > 0 || project.status === 'blocked');
    const visible = activeFilter === 'all' || (activeFilter === 'blocked' ? row.dataset.hasBlocker === 'true' : project.status === activeFilter);
    if (!visible) row.classList.add('is-filtered');
    const start = dayIndex(project.start); const end = dayIndex(project.end); const widthDays = Math.max(3, end - start + 1);
    const stateReason = project.stateText.includes('·') ? project.stateText.split('·').slice(1).join('·').trim() : project.stateText;
    const people = project.roles.slice(0,3).map((role) => `<button class="row-person" type="button" data-open-role="${escapeHtml(role.id)}" data-project-id="${escapeHtml(project.id)}" style="background:${toneGradient(role.tone)}" title="${escapeHtml(role.name)}">${escapeHtml(role.initials)}</button>`).join('');

    row.innerHTML = `<div class="project-label"><button class="project-main-button" type="button" data-open-project="${project.id}"><span class="project-symbol ${project.status}" aria-hidden="true">${escapeHtml(project.short)}</span><span class="project-label-copy"><strong>${escapeHtml(project.name)}</strong><span class="project-state-line"><span class="state-dot ${project.status}"></span><span>${escapeHtml(stateReason)}</span></span></span></button><span class="row-people">${people}</span></div><div class="project-track"><div class="project-ribbon ${project.status}" style="left:calc(${start} * var(--timeline-unit));width:calc(${widthDays} * var(--timeline-unit));--visual-progress:${visualProgress(project)}%"><button class="ribbon-hit" type="button" data-open-project="${project.id}" aria-label="${escapeHtml(project.name)}, du ${formatDate(project.start)} au ${formatDate(project.end)}"></button><span class="project-progress-flow" aria-hidden="true"></span><button class="ribbon-handle start" type="button" data-resize-project="${project.id}" data-edge="start" aria-label="Ajuster le début"></button><button class="ribbon-handle end" type="button" data-resize-project="${project.id}" data-edge="end" aria-label="Ajuster la fin"></button></div></div>`;

    const track = $('.project-track', row);
    for (const milestone of project.milestones) {
      const index = dayIndex(milestone.date); const node = document.createElement('span'); node.className = `milestone${milestone.done ? ' done' : ''}${milestone.current ? ' current' : ''}`; node.style.left = `calc(${index} * var(--timeline-unit) - 5px)`; node.title = milestone.label; track.appendChild(node);
    }
    for (const blocker of project.blockers) {
      const index = dayIndex(blocker.date); const marker = document.createElement('button'); marker.type = 'button'; marker.className = 'blocker-marker'; marker.dataset.openProject = project.id; marker.style.left = `calc(${index} * var(--timeline-unit))`; marker.title = blocker.title; marker.innerHTML = `<span class="blocker-rock">${icons.alert}</span>`; track.appendChild(marker);
    }
    els.projectRows.appendChild(row);
  }

  $$('[data-open-project]').forEach((button) => button.addEventListener('click', () => openProject(button.dataset.openProject)));
  $$('[data-open-role]').forEach((button) => button.addEventListener('click', () => { const project = state.projects.find((p) => p.id === button.dataset.projectId); if (!project) return; openProject(project.id); requestAnimationFrame(() => openRole(project, button.dataset.openRole)); }));
  bindTimelineResize();
}

function bindTimelineResize() {
  $$('[data-resize-project]').forEach((handle) => handle.addEventListener('pointerdown', (event) => {
    event.preventDefault(); event.stopPropagation();
    const project = state.projects.find((p) => p.id === handle.dataset.resizeProject); if (!project) return;
    const row = handle.closest('.project-row'); const ribbon = handle.closest('.project-ribbon'); const edge = handle.dataset.edge;
    const originalStart = project.start; const originalEnd = project.end; const startX = event.clientX; const unit = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--timeline-unit')) || 1;
    let deltaDays = 0; handle.setPointerCapture(event.pointerId); row.classList.add('is-adjusting');
    const move = (moveEvent) => {
      deltaDays = Math.round((moveEvent.clientX - startX) / Math.max(.55, unit));
      let nextStart = originalStart; let nextEnd = originalEnd;
      if (edge === 'start') nextStart = addDays(originalStart, Math.min(deltaDays, Math.max(-365, Math.round((new Date(`${originalEnd}T00:00:00`) - new Date(`${originalStart}T00:00:00`)) / DAY) - 1)));
      else nextEnd = addDays(originalEnd, Math.max(deltaDays, -Math.round((new Date(`${originalEnd}T00:00:00`) - new Date(`${originalStart}T00:00:00`)) / DAY) + 1));
      const left = dayIndex(nextStart); const right = dayIndex(nextEnd); ribbon.style.left = `calc(${left} * var(--timeline-unit))`; ribbon.style.width = `calc(${Math.max(3, right - left + 1)} * var(--timeline-unit))`;
    };
    const up = () => {
      if (edge === 'start') { const candidate = addDays(originalStart, deltaDays); if (candidate < originalEnd) project.start = candidate; }
      else { const candidate = addDays(originalEnd, deltaDays); if (candidate > originalStart) project.end = candidate; }
      persistState(); row.classList.remove('is-adjusting'); refreshTimelineView(); if (activeProjectId === project.id) renderFocus(project); document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up, { once: true });
  }));
}

function positionTodayLine() { const index = Math.round((TODAY - VIEW_START) / DAY); els.todayLine.style.left = `calc(var(--project-col) + (${index} * var(--timeline-unit)))`; }
function updateZoom(nextIndex, preserveCenter = true) { const scroll = els.timelineScroll; const oldWidth = scroll.scrollWidth; const viewportCenter = scroll.scrollLeft + scroll.clientWidth / 2; const ratio = oldWidth ? viewportCenter / oldWidth : 0; zoomIndex = Math.max(0, Math.min(zoomLevels.length - 1, nextIndex)); const unit = fitTimelineUnit() * zoomLevels[zoomIndex]; css.setProperty('--timeline-unit', `${unit}px`); $('#zoom-reset').textContent = ['Tout', '×1,25', '×1,55', '×1,95', '×2,5'][zoomIndex]; $('#zoom-out').disabled = zoomIndex === 0; $('#zoom-in').disabled = zoomIndex === zoomLevels.length - 1; requestAnimationFrame(() => { if (zoomIndex === 0) scroll.scrollLeft = 0; else if (preserveCenter) scroll.scrollLeft = Math.max(0, scroll.scrollWidth * ratio - scroll.clientWidth / 2); }); }
