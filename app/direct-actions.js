function toISO(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolveBlockerWithNeptune(project, blocker) {
  if (!project || !blocker) return;
  openAi();
  handleAiSubmit(`Sur ${project.name}, résous le blocage « ${blocker.title} ». ${blocker.detail || ''}`);
}
