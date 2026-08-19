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

function renderProjectRows() {
  els.projectRows.innerHTML = '';
  if (!state.projects.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-project-map';
    empty.innerHTML = `<div class="empty-project-mark">${icons.spark}</div><div><strong>Aucun projet</strong></div><button type="button" data-empty-ai>Créer avec Neptune AI</button>`;
    els.projectRows.appendChild(empty);
    $('[data-empty-ai]', empty).addEventListener('click', () => openAi('Crée un nouveau projet : '));
    return;
  }
  for (const project of state.projects) {
    const row = document.createElement('article');
    row.className = 'project-row';
    row.dataset.projectId = project.id;
    row.dataset.status = project.status;
    row.dataset.hasBlocker = String(project.blockers.length > 0 || project.status === 'blocked');
    const visible = activeFilter === 'all' || (activeFilter === 'blocked' ? row.dataset.hasBlocker === 'true' : project.status === activeFilter);
    if (!visible) row.classList.add('is-filtered');

    const start = dayIndex(project.start);
    const end = dayIndex(project.end);
    const widthDays = Math.max(5, end - start + 1);
    const stateReason = project.stateText.includes('·') ? project.stateText.split('·').slice(1).join('·').trim() : project.stateText;

    row.innerHTML = `
      <button class="project-label" type="button" data-open-project="${project.id}" aria-label="Ouvrir ${escapeHtml(project.name)}">
        <span class="project-symbol ${project.status}" aria-hidden="true">${escapeHtml(project.short)}</span>
        <span class="project-label-copy">
          <strong>${escapeHtml(project.name)}</strong>
          <span class="project-state-line"><span class="state-dot ${project.status}"></span><span>${escapeHtml(stateReason)}</span></span>
        </span>
      </button>
      <div class="project-track">
        <button class="project-ribbon ${project.status}" type="button" data-open-project="${project.id}"
          style="left:calc(${start} * var(--timeline-unit));width:calc(${widthDays} * var(--timeline-unit));"
          aria-label="${escapeHtml(project.name)}, ${escapeHtml(statusLabels[project.status])}, du ${formatDate(project.start)} au ${formatDate(project.end)}">
          <span class="ribbon-copy"><span class="ribbon-status-icon">${getStatusIcon(project.status)}</span><strong>${escapeHtml(statusLabels[project.status])}</strong></span>
        </button>
      </div>`;

    const track = $('.project-track', row);
    for (const milestone of project.milestones) {
      const index = dayIndex(milestone.date);
      const node = document.createElement('span');
      node.className = `milestone${milestone.done ? ' done' : ''}${milestone.current ? ' current' : ''}`;
      node.style.left = `calc(${index} * var(--timeline-unit) - 6px)`;
      node.title = `${milestone.label} · ${formatDate(milestone.date)}`;
      track.appendChild(node);

      const label = document.createElement('span');
      label.className = 'milestone-label';
      label.style.left = `calc(${index} * var(--timeline-unit))`;
      label.textContent = milestone.label;
      track.appendChild(label);
    }

    for (const blocker of project.blockers) {
      const index = dayIndex(blocker.date);
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = 'blocker-marker';
      marker.dataset.openProject = project.id;
      marker.style.left = `calc(${index} * var(--timeline-unit))`;
      marker.title = blocker.title;
      marker.setAttribute('aria-label', `Blocage : ${blocker.title}. Ouvrir ${project.name}`);
      marker.innerHTML = `<span class="blocker-rock">${icons.alert}</span>`;
      track.appendChild(marker);
    }

    els.projectRows.appendChild(row);
  }

  $$('[data-open-project]').forEach((button) => button.addEventListener('click', () => openProject(button.dataset.openProject)));
}

function positionTodayLine() {
  const index = Math.round((TODAY - VIEW_START) / DAY);
  els.todayLine.style.left = `calc(var(--project-col) + (${index} * var(--timeline-unit)))`;
}

function updateZoom(nextIndex, preserveCenter = true) {
  const scroll = els.timelineScroll;
  const oldWidth = scroll.scrollWidth;
  const viewportCenter = scroll.scrollLeft + scroll.clientWidth / 2;
  const ratio = oldWidth ? viewportCenter / oldWidth : 0;
  zoomIndex = Math.max(0, Math.min(zoomLevels.length - 1, nextIndex));
  const unit = fitTimelineUnit() * zoomLevels[zoomIndex];
  css.setProperty('--timeline-unit', `${unit}px`);
  $('#zoom-reset').textContent = ['Tout', '×1,25', '×1,55', '×1,95', '×2,5'][zoomIndex];
  $('#zoom-out').disabled = zoomIndex === 0;
  $('#zoom-in').disabled = zoomIndex === zoomLevels.length - 1;
  requestAnimationFrame(() => {
    if (zoomIndex === 0) {
      scroll.scrollLeft = 0;
      return;
    }
    if (preserveCenter) scroll.scrollLeft = Math.max(0, scroll.scrollWidth * ratio - scroll.clientWidth / 2);
  });
}
