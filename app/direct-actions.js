function resolveBlockerWithNeptune(project, blocker) {
  if (!project || !blocker) return;
  openAi();
  handleAiSubmit(`Sur ${project.name}, résous le blocage « ${blocker.title} ». ${blocker.detail || ''}`);
}
