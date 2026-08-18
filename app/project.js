function openProject(id) {
  const project = state.projects.find((item) => item.id === id);
  if (!project) return;
  activeProjectId = id;
  activeRoleId = null;
  renderFocus(project);
  els.focusBackdrop.hidden = false;
  els.focus.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => els.focus.classList.add('is-open'));
  els.contextLabel.textContent = project.name;
  document.body.style.overflow = 'hidden';
  $('#focus-close').focus({ preventScroll: true });
}

function closeProject() {
  if (!els.focus.classList.contains('is-open')) return;
  const trigger = document.querySelector(`[data-open-project="${CSS.escape(activeProjectId || '')}"]`);
  els.focus.classList.remove('is-open');
  els.focus.setAttribute('aria-hidden', 'true');
  els.focusBackdrop.hidden = true;
  els.contextLabel.textContent = 'Carte des projets';
  els.taskDrawer.classList.remove('is-open');
  els.taskDrawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  activeProjectId = null;
  setTimeout(() => trigger?.focus({ preventScroll: true }), 40);
}

function renderFocus(project) {
  els.focusTitle.textContent = project.name;
  els.focusSummary.textContent = project.summary;
  els.focusDeadline.textContent = formatDate(project.end, { year: project.end.startsWith('2027') ? 'numeric' : undefined });
  els.focusDeadlineNote.textContent = project.deadlineNote;
  els.focusBreadcrumbName.textContent = project.name;
  els.focusStatus.innerHTML = `<i class="state-dot ${project.status}"></i>${escapeHtml(statusLabels[project.status])} · ${escapeHtml(project.stateText.split('·').slice(1).join('·').trim() || project.stateText)}`;

  els.projectPath.innerHTML = project.stages.map((stage) => `
    <div class="path-step ${stage.state}">
      <span class="path-node">${stage.state === 'done' ? icons.check : stage.state === 'blocked' ? icons.alert : stage.state === 'current' ? icons.spark : icons.dot}</span>
      <span class="path-copy"><strong>${escapeHtml(stage.label)}</strong><span>${escapeHtml(stage.note)}</span></span>
    </div>`).join('');

  if (project.blockers.length) {
    els.blockerCount.textContent = `${project.blockers.length} point${project.blockers.length > 1 ? 's' : ''}`;
    els.blockerList.innerHTML = project.blockers.map((blocker) => `
      <article class="blocker-card">
        <span class="blocker-icon">${icons.alert}</span>
        <div class="blocker-copy"><strong>${escapeHtml(blocker.title)}</strong><p>${escapeHtml(blocker.detail)}</p></div>
        <span class="blocker-owner">${escapeHtml(blocker.owner)}</span>
      </article>`).join('');
  } else {
    els.blockerCount.textContent = 'Aucun blocage';
    els.blockerList.innerHTML = `<article class="blocker-card is-empty"><span class="blocker-icon">${icons.check}</span><div class="blocker-copy"><strong>Rien ne bloque le chemin critique</strong><p>L’outil ne te demande rien ici. Il continuera simplement à surveiller les dépendances.</p></div></article>`;
  }

  els.roleOrbit.innerHTML = project.roles.map((role) => {
    const remaining = role.tasks.filter((task) => task.status !== 'done').length;
    const stateClass = role.state === 'blocker' ? 'has-blocker' : role.state === 'warning' ? 'has-warning' : '';
    const stateText = role.state === 'blocker' ? 'Un blocage' : role.state === 'warning' ? 'À surveiller' : remaining ? `${remaining} action${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}` : 'Rien à faire';
    return `<button class="role-card ${stateClass}" type="button" data-role-id="${escapeHtml(role.id)}">
      <span class="role-person">
        <span class="role-avatar" style="background:${toneGradient(role.tone)}">${escapeHtml(role.initials)}</span>
        <span class="role-person-copy"><strong>${escapeHtml(role.name)}</strong><span>${escapeHtml(role.role)}</span></span>
      </span>
      <p class="role-message">${escapeHtml(role.message)}</p>
      <span class="role-foot"><span class="work-state"><i></i>${escapeHtml(stateText)}</span><span class="role-arrow">›</span></span>
    </button>`;
  }).join('');

  $$('.role-card', els.roleOrbit).forEach((card) => card.addEventListener('click', () => openRole(project, card.dataset.roleId)));
  els.taskDrawer.classList.remove('is-open');
  els.taskDrawer.setAttribute('aria-hidden', 'true');
}

function openRole(project, roleId) {
  const role = project.roles.find((item) => item.id === roleId);
  if (!role) return;
  activeRoleId = roleId;
  els.taskDrawerTitle.textContent = `${role.name} · ${role.role}`;
  els.taskList.innerHTML = role.tasks.map((task, index) => {
    const meta = taskMeta(task.status);
    return `<article class="task-row" data-task-index="${index}">
      <span class="task-state-icon ${escapeHtml(task.status)}">${meta.icon}</span>
      <span class="task-copy"><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.note)}</span></span>
      <span class="task-date${task.status === 'blocked' ? ' late' : ''}">${escapeHtml(task.due)}</span>
    </article>`;
  }).join('');
  els.taskDrawer.classList.add('is-open');
  els.taskDrawer.setAttribute('aria-hidden', 'false');
  els.taskDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
