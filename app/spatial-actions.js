document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-resolve-blocker]');
  if (!trigger) return;
  const project = state.projects.find((item) => item.id === activeProjectId);
  const blocker = project?.blockers?.[Number(trigger.dataset.resolveBlocker)];
  if (!project || !blocker) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  openAi();
  handleAiSubmit(`Sur ${project.name}, résous le blocage « ${blocker.title} ». ${blocker.detail}`);
}, true);
