const seedProjects = projects;
const seedWorkspace = workspace;

const DAY = 86400000;
const now = new Date();
const TODAY = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let VIEW_START = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1);
let VIEW_END = new Date(TODAY.getFullYear(), TODAY.getMonth() + 5, 0);
let TOTAL_DAYS = Math.round((VIEW_END - VIEW_START) / DAY) + 1;
const zoomLevels = [1, 1.25, 1.55, 1.95, 2.5];
let zoomIndex = 0;
let activeFilter = 'all';
let activeProjectId = null;
let activeRoleId = null;

const clone = (value) => JSON.parse(JSON.stringify(value));
const state = {
  workspace: clone(seedWorkspace),
  projectSets: { [seedWorkspace.id]: clone(seedProjects) },
  projects: [],
  workspaces: [{ ...clone(seedWorkspace), active: true }],
};
state.projects = state.projectSets[state.workspace.id];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const css = document.documentElement.style;

const els = {
  projectRows: $('#project-rows'),
  monthScale: $('#month-scale'),
  todayLine: $('#today-line'),
  timelineScroll: $('#timeline-scroll'),
  timelineCanvas: $('#timeline-canvas'),
  workspaceName: $('#workspace-name'),
  contextLabel: $('#context-label'),
  focus: $('#project-focus'),
  focusBackdrop: $('#focus-backdrop'),
  focusTitle: $('#focus-project-title'),
  focusSummary: $('#focus-project-summary'),
  focusStatus: $('#focus-status'),
  focusDeadline: $('#focus-deadline'),
  focusDeadlineNote: $('#focus-deadline-note'),
  focusBreadcrumbName: $('#focus-breadcrumb-name'),
  projectPath: $('#project-path'),
  blockerList: $('#blocker-list'),
  blockerCount: $('#blocker-count'),
  roleOrbit: $('#role-orbit'),
  taskDrawer: $('#task-drawer'),
  taskDrawerTitle: $('#task-drawer-title'),
  taskList: $('#task-list'),
  aiOrb: $('#ai-orb'),
  aiPanel: $('#ai-panel'),
  aiThread: $('#ai-thread'),
  aiInput: $('#ai-input'),
  searchDialog: $('#search-dialog'),
  searchInput: $('#global-search'),
  searchResults: $('#search-results'),
  toastRegion: $('#toast-region'),
};

const icons = {
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4 4L19 7"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6v12M16 6v12"/></svg>',
  alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.8 19h18.4L12 3Z"/><path d="M12 9v4M12 16.5h.01"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
  spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.4 4.4L18 9l-4.6 1.6L12 15l-1.4-4.4L6 9l4.6-1.6L12 3Z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/></svg>',
  dot: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
};

function loadPersistedState() {
  try {
    const saved = JSON.parse(localStorage.getItem('neptune-projects-state') || 'null');
    if (!saved) return;
    if (Array.isArray(saved.workspaces) && saved.workspaces.length) state.workspaces = saved.workspaces;
    if (saved.workspace?.name) state.workspace = saved.workspace;
    if (saved.customProjectSets && typeof saved.customProjectSets === 'object') Object.assign(state.projectSets, saved.customProjectSets);
    state.projects = state.projectSets[state.workspace.id] || [];
    if (saved.taskStates) {
      for (const project of state.projects) {
        for (const role of project.roles) {
          for (const task of role.tasks) {
            const key = `${project.id}:${role.id}:${task.title}`;
            if (saved.taskStates[key]) task.status = saved.taskStates[key];
          }
        }
      }
    }
  } catch (error) {
    console.warn('État local illisible, réinitialisation.', error);
  }
}

function persistState() {
  const taskStates = {};
  for (const projectSet of Object.values(state.projectSets)) {
    for (const project of projectSet) {
      for (const role of project.roles) {
        for (const task of role.tasks) taskStates[`${project.id}:${role.id}:${task.title}`] = task.status;
      }
    }
  }
  const customProjectSets = Object.fromEntries(Object.entries(state.projectSets).filter(([key]) => key !== seedWorkspace.id));
  localStorage.setItem('neptune-projects-state', JSON.stringify({
    workspace: state.workspace,
    workspaces: state.workspaces,
    taskStates,
    customProjectSets,
  }));
}

function recalculateTimelineBounds() {
  const projectDates = state.projects.flatMap((project) => [new Date(`${project.start}T00:00:00`), new Date(`${project.end}T00:00:00`)]).filter((date) => !Number.isNaN(date.getTime()));
  const allDates = [TODAY, ...projectDates];
  const minDate = new Date(Math.min(...allDates.map((date) => date.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((date) => date.getTime())));
  VIEW_START = new Date(minDate.getFullYear(), minDate.getMonth() - 1, 1);
  const dataEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0);
  const sixMonthEnd = new Date(VIEW_START.getFullYear(), VIEW_START.getMonth() + 7, 0);
  VIEW_END = dataEnd > sixMonthEnd ? dataEnd : sixMonthEnd;
  TOTAL_DAYS = Math.round((VIEW_END - VIEW_START) / DAY) + 1;
  css.setProperty('--timeline-days', TOTAL_DAYS);
}

function fitTimelineUnit() {
  const projectColumn = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--project-col')) || 210;
  const viewport = Math.max(1, els.timelineScroll.clientWidth - projectColumn - 2);
  return Math.max(0.85, viewport / Math.max(1, TOTAL_DAYS));
}

function refreshTimelineView() {
  recalculateTimelineBounds();
  renderMonths();
  renderProjectRows();
  positionTodayLine();
}

function dayIndex(dateString) {
  return Math.max(0, Math.min(TOTAL_DAYS - 1, Math.round((new Date(`${dateString}T00:00:00`) - VIEW_START) / DAY)));
}

function formatDate(dateString, options = {}) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', ...options }).format(date);
}

function getStatusIcon(status) {
  if (status === 'fluid') return icons.check;
  if (status === 'blocked') return icons.alert;
  if (status === 'waiting') return icons.pause;
  if (status === 'upcoming') return icons.clock;
  return icons.alert;
}
