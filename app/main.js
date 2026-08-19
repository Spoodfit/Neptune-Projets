let resizeTimer;

function bindEvents() {
  $$('.filter-pill').forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  $('#zoom-out').addEventListener('click', () => updateZoom(zoomIndex - 1));
  $('#zoom-in').addEventListener('click', () => updateZoom(zoomIndex + 1));
  $('#zoom-reset').addEventListener('click', () => updateZoom(0));
  $('#add-project-trigger').addEventListener('click', beginProjectCreation);
  els.timelineScroll.addEventListener('wheel', (event) => { if (event.ctrlKey || event.metaKey) { event.preventDefault(); updateZoom(zoomIndex + (event.deltaY < 0 ? 1 : -1)); } }, { passive: false });
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => updateZoom(zoomIndex, false), 80); });

  $('#focus-close').addEventListener('click', closeProject);
  $('#task-drawer-close').addEventListener('click', () => { closeRoleTasks(); $$('.panel-person', els.roleOrbit).forEach((node) => node.classList.remove('is-selected')); activeRoleId = null; });

  els.aiOrb.addEventListener('click', () => els.aiPanel.classList.contains('is-open') ? closeAi() : openAi());
  $('#ai-close').addEventListener('click', closeAi);
  els.aiInput.addEventListener('input', autosizeAiInput);
  els.aiInput.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('#ai-form').requestSubmit(); } });
  $('#ai-form').addEventListener('submit', (event) => { event.preventDefault(); handleAiSubmit(els.aiInput.value); });

  $('#search-trigger').addEventListener('click', () => { renderSearch(''); els.searchDialog.showModal(); setTimeout(() => els.searchInput.focus(), 20); });
  els.searchInput.addEventListener('input', () => renderSearch(els.searchInput.value));
  $('#workspace-trigger').addEventListener('click', openWorkspaceSheet);
  $('#people-trigger').addEventListener('click', openPeopleSheet);
  $('#settings-trigger').addEventListener('click', openSettingsSheet);
  $('.brand-mark').addEventListener('click', () => { closeProject(); els.timelineScroll.scrollTo({ left: 0, behavior: 'smooth' }); });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && els.taskDrawer.classList.contains('is-open')) { closeRoleTasks(); $$('.panel-person', els.roleOrbit).forEach((node) => node.classList.remove('is-selected')); activeRoleId = null; return; }
    if (event.key === 'Escape' && els.focus.classList.contains('is-open')) { closeProject(); return; }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); renderSearch(''); els.searchDialog.showModal(); setTimeout(() => els.searchInput.focus(), 20); }
  });
}

function centerToday() { if (els.timelineScroll.scrollWidth <= els.timelineScroll.clientWidth + 2) { els.timelineScroll.scrollLeft = 0; return; } const index = Math.round((TODAY - VIEW_START) / DAY); const unit = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--timeline-unit')) || fitTimelineUnit(); const target = index * unit - els.timelineScroll.clientWidth * .36; els.timelineScroll.scrollLeft = Math.max(0, target); }

function init() {
  loadPersistedState(); state.projects = state.projectSets[state.workspace.id] || []; els.workspaceName.textContent = state.workspace.name; refreshTimelineView(); bindEvents(); requestAnimationFrame(() => { updateZoom(zoomIndex, false); centerToday(); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}

init();
