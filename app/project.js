function openProject(id) {
  const project = state.projects.find((item) => item.id === id); if (!project) return;
  activeProjectId = id; activeRoleId = null; renderFocus(project); els.focus.setAttribute('aria-hidden', 'false'); els.focus.classList.add('is-open'); els.contextLabel.textContent = project.name;
  $$('.project-row').forEach((row) => row.classList.toggle('is-selected', row.dataset.projectId === id));
  requestAnimationFrame(() => els.projectNameInput?.focus({ preventScroll: true }));
}

function closeProject() {
  if (!els.focus.classList.contains('is-open')) return;
  els.focus.classList.remove('is-open'); els.focus.setAttribute('aria-hidden', 'true'); els.contextLabel.textContent = 'Projets'; els.taskDrawer.classList.remove('is-open'); els.taskDrawer.setAttribute('aria-hidden', 'true'); activeProjectId = null; activeRoleId = null; $$('.project-row').forEach((row) => row.classList.remove('is-selected'));
}

function projectReason(project) { return project.stateText.includes('·') ? project.stateText.split('·').slice(1).join('·').trim() : project.stateText; }
function updateStateText(project, reason = projectReason(project)) { project.stateText = `${statusLabels[project.status]} · ${reason || 'aucun point particulier'}`; }
function shortFromName(name) { return name.split(/\s+/).filter(Boolean).slice(0,2).map((word) => word[0]?.toUpperCase() || '').join('').slice(0,2) || 'P'; }

function renderFocus(project) {
  els.focusTitle.textContent = project.name; els.focusSummary.textContent = project.summary || ''; els.focusDeadline.textContent = formatDate(project.end); els.focusDeadlineNote.textContent = project.deadlineNote || ''; els.focusBreadcrumbName.textContent = project.name;
  els.focusStatus.innerHTML = `<i class="state-dot ${project.status}"></i><span>${escapeHtml(statusLabels[project.status])}</span>`;
  els.projectNameInput.value = project.name; els.projectStatusSelect.value = project.status; els.projectStartInput.value = project.start; els.projectEndInput.value = project.end; els.projectReasonInput.value = projectReason(project);

  els.projectPath.innerHTML = (project.stages || []).map((stage, index) => `<button class="panel-stage ${stage.state}" type="button" data-stage-index="${index}" title="Cliquer pour changer l’état"><span>${stage.state === 'done' ? icons.check : stage.state === 'blocked' ? icons.alert : stage.state === 'current' ? icons.spark : icons.dot}</span><strong>${escapeHtml(stage.label)}</strong></button>`).join('');
  $$('[data-stage-index]', els.projectPath).forEach((button) => button.addEventListener('click', () => {
    const stage = project.stages[Number(button.dataset.stageIndex)]; if (!stage) return;
    const order = ['future', 'current', 'done', 'blocked']; stage.state = order[(order.indexOf(stage.state) + 1) % order.length]; persistState(); renderFocus(project); celebrateProject(project.id);
  }));

  els.blockerCount.textContent = project.blockers.length ? `${project.blockers.length}` : '';
  els.blockerList.innerHTML = project.blockers.map((blocker, index) => `<div class="panel-blocker"><span class="blocker-dot"></span><input class="blocker-title-input" data-blocker-title="${index}" value="${escapeHtml(blocker.title)}" aria-label="Blocage"><input class="blocker-owner-input" data-blocker-owner="${index}" value="${escapeHtml(blocker.owner)}" aria-label="Responsable"><button type="button" class="blocker-resolve" data-resolve-blocker="${index}" title="Résoudre avec Neptune"><span class="tiny-orb" aria-hidden="true"></span></button><button type="button" class="blocker-delete" data-delete-blocker="${index}" aria-label="Supprimer">×</button></div>`).join('') + `<button class="inline-add" type="button" data-add-blocker>＋ Blocage</button>`;
  $$('[data-blocker-title]', els.blockerList).forEach((input) => input.addEventListener('change', () => { project.blockers[Number(input.dataset.blockerTitle)].title = input.value.trim() || 'Blocage'; persistState(); renderProjectRows(); }));
  $$('[data-blocker-owner]', els.blockerList).forEach((input) => input.addEventListener('change', () => { project.blockers[Number(input.dataset.blockerOwner)].owner = input.value.trim() || 'À assigner'; persistState(); }));
  $$('[data-resolve-blocker]', els.blockerList).forEach((button) => button.addEventListener('click', () => { const blocker = project.blockers[Number(button.dataset.resolveBlocker)]; if (blocker) resolveBlockerWithNeptune(project, blocker); }));
  $$('[data-delete-blocker]', els.blockerList).forEach((button) => button.addEventListener('click', () => { project.blockers.splice(Number(button.dataset.deleteBlocker), 1); persistState(); renderFocus(project); renderProjectRows(); }));
  $('[data-add-blocker]', els.blockerList)?.addEventListener('click', () => { project.blockers.push({ date: toISO(TODAY), title: 'Nouveau blocage', detail: '', owner: 'À assigner', kind: 'decision' }); persistState(); renderFocus(project); renderProjectRows(); requestAnimationFrame(() => $$('[data-blocker-title]', els.blockerList).at(-1)?.select()); });

  els.roleOrbit.innerHTML = project.roles.length ? project.roles.map((role) => { const remaining = role.tasks.filter((task) => task.status !== 'done').length; const cls = role.state === 'blocker' ? 'has-blocker' : role.state === 'warning' ? 'has-warning' : ''; return `<button class="panel-person ${cls}${activeRoleId === role.id ? ' is-selected' : ''}" type="button" data-role-id="${escapeHtml(role.id)}"><span class="role-avatar" style="background:${toneGradient(role.tone)}">${escapeHtml(role.initials)}</span><span><strong>${escapeHtml(role.name)}</strong><small>${escapeHtml(role.role)}</small></span><b>${remaining || '✓'}</b></button>`; }).join('') : `<button class="inline-add" type="button" data-add-person>＋ Responsable</button>`;
  $$('.panel-person', els.roleOrbit).forEach((button) => button.addEventListener('click', () => openRole(project, button.dataset.roleId)));
  $('[data-add-person]', els.roleOrbit)?.addEventListener('click', () => { project.roles.push({ id: `role-${Date.now().toString(36)}`, name: 'À assigner', role: 'Responsable', initials: '?', tone: 'slate', state: 'good', message: '', tasks: [] }); persistState(); renderFocus(project); });

  if (activeRoleId) { const role = project.roles.find((item) => item.id === activeRoleId); if (role) renderRoleTasks(project, role); else closeRoleTasks(); }
  else closeRoleTasks();
  bindProjectFields(project);
}

function bindProjectFields(project) {
  els.projectNameInput.onchange = () => { const name = els.projectNameInput.value.trim(); if (!name) { els.projectNameInput.value = project.name; return; } project.name = name; project.short = shortFromName(name); persistState(); renderProjectRows(); els.contextLabel.textContent = name; };
  els.projectStatusSelect.onchange = () => { project.status = els.projectStatusSelect.value; updateStateText(project); persistState(); renderProjectRows(); renderFocus(project); celebrateProject(project.id); };
  els.projectStartInput.onchange = () => { if (!els.projectStartInput.value || els.projectStartInput.value >= project.end) { els.projectStartInput.value = project.start; return; } project.start = els.projectStartInput.value; persistState(); refreshTimelineView(); renderFocus(project); };
  els.projectEndInput.onchange = () => { if (!els.projectEndInput.value || els.projectEndInput.value <= project.start) { els.projectEndInput.value = project.end; return; } project.end = els.projectEndInput.value; persistState(); refreshTimelineView(); renderFocus(project); };
  els.projectReasonInput.onchange = () => { updateStateText(project, els.projectReasonInput.value.trim()); persistState(); renderProjectRows(); };
}

function openRole(project, roleId) { const role = project.roles.find((item) => item.id === roleId); if (!role) return; activeRoleId = roleId; $$('.panel-person', els.roleOrbit).forEach((node) => node.classList.toggle('is-selected', node.dataset.roleId === roleId)); renderRoleTasks(project, role); }
function closeRoleTasks() { els.taskDrawer.classList.remove('is-open'); els.taskDrawer.setAttribute('aria-hidden', 'true'); }

function renderRoleTasks(project, role) {
  els.taskDrawerTitle.textContent = `${role.name} · ${role.role}`;
  els.taskList.innerHTML = role.tasks.length ? role.tasks.map((task, index) => `<div class="panel-task" data-task-index="${index}"><button class="task-state-button ${escapeHtml(task.status)}" type="button" data-task-state="${index}" aria-label="Changer l’état">${taskMeta(task.status).icon}</button><input class="task-title-input" data-task-title="${index}" value="${escapeHtml(task.title)}" aria-label="Tâche"><input class="task-due-input" data-task-due="${index}" value="${escapeHtml(task.due)}" aria-label="Échéance"><button class="task-delete" type="button" data-delete-task="${index}" aria-label="Supprimer">×</button></div>`).join('') : '<div class="task-empty">Aucune tâche</div>';
  $$('[data-task-state]', els.taskList).forEach((button) => button.addEventListener('click', () => { const task = role.tasks[Number(button.dataset.taskState)]; const order = ['todo', 'progress', 'done', 'blocked']; task.status = order[(order.indexOf(task.status) + 1) % order.length]; persistState(); renderRoleTasks(project, role); renderProjectRows(); celebrateProject(project.id); }));
  $$('[data-task-title]', els.taskList).forEach((input) => input.addEventListener('change', () => { const task = role.tasks[Number(input.dataset.taskTitle)]; task.title = input.value.trim() || 'Tâche'; persistState(); }));
  $$('[data-task-due]', els.taskList).forEach((input) => input.addEventListener('change', () => { role.tasks[Number(input.dataset.taskDue)].due = input.value.trim() || 'À planifier'; persistState(); }));
  $$('[data-delete-task]', els.taskList).forEach((button) => button.addEventListener('click', () => { role.tasks.splice(Number(button.dataset.deleteTask), 1); persistState(); renderRoleTasks(project, role); renderProjectRows(); }));
  els.addTaskTrigger.onclick = () => { role.tasks.push({ title: 'Nouvelle tâche', status: 'todo', due: 'À planifier', note: '' }); persistState(); renderRoleTasks(project, role); renderProjectRows(); requestAnimationFrame(() => $$('[data-task-title]', els.taskList).at(-1)?.select()); };
  $('#role-ask-ai').onclick = () => openAi(`Sur ${project.name}, pour ${role.name}, `);
  els.taskDrawer.classList.add('is-open'); els.taskDrawer.setAttribute('aria-hidden', 'false');
}

function celebrateProject(projectId) { requestAnimationFrame(() => { const row = document.querySelector(`.project-row[data-project-id="${CSS.escape(projectId)}"]`); if (!row) return; row.classList.add('is-progressing'); setTimeout(() => row.classList.remove('is-progressing'), 950); }); }
function taskMeta(status) { if (status === 'done') return { icon: icons.check, label: 'Terminé' }; if (status === 'blocked') return { icon: icons.alert, label: 'Bloqué' }; if (status === 'progress') return { icon: icons.spark, label: 'En cours' }; return { icon: icons.clock, label: 'À faire' }; }
function toneGradient(tone) { const gradients = { cyan:'linear-gradient(145deg,#8be9ee,#54bed3)', blue:'linear-gradient(145deg,#91cfff,#6386ef)', violet:'linear-gradient(145deg,#c5a8ff,#8f73e8)', amber:'linear-gradient(145deg,#ffd98e,#eaa35b)', mint:'linear-gradient(145deg,#9cebcf,#62c5ad)', slate:'linear-gradient(145deg,#d4dbe3,#95a2b0)' }; return gradients[tone] || gradients.slate; }
function setFilter(filter) { activeFilter = filter; $$('.filter-pill').forEach((button) => button.classList.toggle('is-active', button.dataset.filter === filter)); $$('.project-row').forEach((row) => { const visible = filter === 'all' || (filter === 'blocked' ? row.dataset.hasBlocker === 'true' : row.dataset.status === filter); row.classList.toggle('is-filtered', !visible); }); }
