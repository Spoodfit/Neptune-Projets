function openProject(id) {
  const project = state.projects.find((item) => item.id === id);
  if (!project) return;
  activeProjectId = id;
  activeRoleId = null;
  renderFocus(project);
  els.focus.setAttribute('aria-hidden', 'false');
  document.body.classList.add('spatial-project-open');
  requestAnimationFrame(() => els.focus.classList.add('is-open'));
  els.contextLabel.textContent = project.name;
  document.body.style.overflow = 'hidden';
  $('#focus-close').focus({ preventScroll: true });
}

function closeProject() {
  if (!els.focus.classList.contains('is-open')) return;
  const previousId = activeProjectId;
  const trigger = document.querySelector(`[data-open-project="${CSS.escape(previousId || '')}"]`);
  els.focus.classList.remove('is-open');
  els.focus.setAttribute('aria-hidden', 'true');
  els.contextLabel.textContent = 'Carte des projets';
  els.taskDrawer.classList.remove('is-open');
  els.taskDrawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('spatial-project-open');
  document.body.style.overflow = '';
  activeProjectId = null;
  activeRoleId = null;
  setTimeout(() => trigger?.focus({ preventScroll: true }), 240);
}

function routeProgress(project) {
  if (project.stages.length <= 1) return 100;
  let marker = 0;
  project.stages.forEach((stage, index) => {
    if (stage.state === 'done') marker = Math.max(marker, index);
    if (stage.state === 'current' || stage.state === 'blocked') marker = Math.max(marker, index - 0.08);
  });
  return Math.max(0, Math.min(100, (marker / (project.stages.length - 1)) * 100));
}

function blockerPosition(project, blocker) {
  const start = new Date(`${project.start}T00:00:00`).getTime();
  const end = new Date(`${project.end}T00:00:00`).getTime();
  const date = new Date(`${blocker.date}T00:00:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !Number.isFinite(date)) return 50;
  return Math.max(7, Math.min(93, ((date - start) / (end - start)) * 100));
}

function renderFocus(project) {
  els.focusTitle.textContent = project.name;
  els.focusSummary.textContent = project.summary;
  els.focusDeadline.textContent = formatDate(project.end, { year: project.end.startsWith('2027') ? 'numeric' : undefined });
  els.focusDeadlineNote.textContent = project.deadlineNote;
  els.focusBreadcrumbName.textContent = project.name;
  const reason = project.stateText.includes('·') ? project.stateText.split('·').slice(1).join('·').trim() : statusLabels[project.status];
  els.focusStatus.innerHTML = `<i class="state-dot ${project.status}"></i><span>${escapeHtml(reason)}</span>`;

  els.projectPath.style.setProperty('--route-progress', `${routeProgress(project)}%`);
  els.projectPath.innerHTML = project.stages.map((stage, index) => `
    <div class="path-step ${stage.state}" style="--stage-index:${index};--stage-count:${project.stages.length}" title="${escapeHtml(stage.note)}">
      <span class="path-node">${stage.state === 'done' ? icons.check : stage.state === 'blocked' ? icons.alert : stage.state === 'current' ? icons.spark : icons.dot}</span>
      <span class="path-copy"><strong>${escapeHtml(stage.label)}</strong></span>
    </div>`).join('');

  if (project.blockers.length) {
    els.blockerCount.textContent = `${project.blockers.length}`;
    els.blockerList.innerHTML = project.blockers.map((blocker, index) => `
      <button class="blocker-card spatial-blocker" type="button" data-resolve-blocker="${index}" style="--blocker-x:${blockerPosition(project, blocker)}%" title="${escapeHtml(blocker.detail)}">
        <span class="blocker-icon">${icons.alert}</span>
        <span class="blocker-copy"><strong>${escapeHtml(blocker.title)}</strong><small>${escapeHtml(blocker.owner)}</small></span>
        <span class="blocker-neptune"><span class="tiny-orb" aria-hidden="true"></span><span>Résoudre</span></span>
      </button>`).join('');
  } else {
    els.blockerCount.textContent = '0';
    els.blockerList.innerHTML = '';
  }

  const roleCount = project.roles.length;
  els.roleOrbit.innerHTML = project.roles.map((role, index) => {
    const remaining = role.tasks.filter((task) => task.status !== 'done').length;
    const stateClass = role.state === 'blocker' ? 'has-blocker' : role.state === 'warning' ? 'has-warning' : '';
    const stateText = role.state === 'blocker' ? 'Bloqué' : role.state === 'warning' ? 'À voir' : remaining ? `${remaining}` : '✓';
    return `<button class="role-card spatial-role ${stateClass}" type="button" data-role-id="${escapeHtml(role.id)}" style="--role-index:${index};--role-count:${roleCount}" title="${escapeHtml(role.message)}">
      <span class="role-connector" aria-hidden="true"></span>
      <span class="role-avatar" style="background:${toneGradient(role.tone)}">${escapeHtml(role.initials)}</span>
      <span class="role-person-copy"><strong>${escapeHtml(role.name)}</strong><span>${escapeHtml(role.role)}</span></span>
      <span class="role-state">${escapeHtml(stateText)}</span>
    </button>`;
  }).join('');

  $$('.role-card', els.roleOrbit).forEach((card) => card.addEventListener('click', () => openRole(project, card.dataset.roleId)));
  $$('[data-resolve-blocker]', els.blockerList).forEach((button) => button.addEventListener('click', () => {
    const blocker = project.blockers[Number(button.dataset.resolveBlocker)];
    if (!blocker) return;
    openAi(`Sur ${project.name}, le blocage « ${blocker.title} » empêche d’avancer. ${blocker.detail} Propose-moi l’action la plus courte pour le lever.`);
  }));

  els.taskDrawer.classList.remove('is-open');
  els.taskDrawer.setAttribute('aria-hidden', 'true');
}

function openRole(project, roleId) {
  const role = project.roles.find((item) => item.id === roleId);
  if (!role) return;
  activeRoleId = roleId;
  $$('.spatial-role', els.roleOrbit).forEach((node) => node.classList.toggle('is-selected', node.dataset.roleId === roleId));
  els.taskDrawerTitle.textContent = `${role.name} · ${role.role}`;
  els.taskList.innerHTML = role.tasks.map((task, index) => {
    const meta = taskMeta(task.status);
    return `<button class="task-row spatial-task" type="button" data-task-index="${index}" title="${escapeHtml(task.note)}">
      <span class="task-state-icon ${escapeHtml(task.status)}">${meta.icon}</span>
      <span class="task-copy"><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(meta.label)}</small></span>
      <span class="task-date${task.status === 'blocked' ? ' late' : ''}">${escapeHtml(task.due)}</span>
    </button>`;
  }).join('');

  $$('.spatial-task', els.taskList).forEach((button) => button.addEventListener('click', () => {
    const task = role.tasks[Number(button.dataset.taskIndex)];
    if (!task) return;
    openAi(`Sur ${project.name}, pour ${role.name}, concernant « ${task.title} » : ${task.note}`);
  }));

  const roleAi = $('#role-ask-ai');
  roleAi.onclick = () => openAi(`Sur ${project.name}, aide-moi à prioriser les prochaines actions de ${role.name} (${role.role}).`);
  els.taskDrawer.classList.add('is-open');
  els.taskDrawer.setAttribute('aria-hidden', 'false');
}

function taskMeta(status) {
  if (status === 'done') return { icon: icons.check, label: 'Terminé' };
  if (status === 'blocked') return { icon: icons.alert, label: 'Bloqué' };
  if (status === 'progress') return { icon: icons.spark, label: 'En cours' };
  return { icon: icons.clock, label: 'À faire' };
}

function toneGradient(tone) {
  const gradients = {
    cyan: 'linear-gradient(145deg,#9ef4f1,#5bc8d9)',
    blue: 'linear-gradient(145deg,#94d6ff,#5c83ec)',
    violet: 'linear-gradient(145deg,#d1b3ff,#8c72e3)',
    amber: 'linear-gradient(145deg,#ffe09b,#e9a660)',
    mint: 'linear-gradient(145deg,#a3f3d5,#63cbb5)',
    slate: 'linear-gradient(145deg,#cad6df,#8195a8)',
  };
  return gradients[tone] || gradients.slate;
}

function setFilter(filter) {
  activeFilter = filter;
  $$('.filter-pill').forEach((button) => button.classList.toggle('is-active', button.dataset.filter === filter));
  $$('.project-row').forEach((row) => {
    const visible = filter === 'all' || (filter === 'blocked' ? row.dataset.hasBlocker === 'true' : row.dataset.status === filter);
    row.classList.toggle('is-filtered', !visible);
  });
}
