import { Task, Vendor, Project, TeamMember, SubProject } from './types';

export const INITIAL_PROJECT: Project = {
  id: 'proj_001',
  name: 'Centro Deportivo Norte',
  role: 'admin', // default to admin for demo
};

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm1', name: 'Ana García', role: 'Project Manager', initials: 'AG' },
  { id: 'tm2', name: 'Carlos Ruiz', role: 'Jefe de Obra', initials: 'CR' },
  { id: 'tm3', name: 'Laura M.', role: 'Arquitecta Téc.', initials: 'LM' },
];

export const INITIAL_VENDORS: Vendor[] = [
  { id: 'v1', name: 'ElectroVolt SL', type: 'Electricista', phone: '+34 600 123 456', email: 'contacto@electrovolt.com' },
  { id: 'v2', name: 'Constructora Base', type: 'Contratista Gral.', phone: '+34 600 999 888', email: 'info@basebuild.com' },
  { id: 'v3', name: 'AquaPure Systems', type: 'Fontanería', phone: '+34 611 222 333', email: 'servicio@aquapure.com' },
];

export const INITIAL_SUBPROJECTS: SubProject[] = [
  { id: 'sub_civil', name: 'Obra Civil / Cimientos', description: 'Fase inicial y estructuras', color: '#e0f2fe' }, // Light Blue
  { id: 'sub_padel', name: 'Pistas de Padel', description: 'Instalación pistas 1-4', color: '#dcfce7' }, // Light Green
  { id: 'sub_gym', name: 'Edificio Gimnasio', description: 'Interiores y equipamiento', color: '#f3e8ff' }, // Light Purple
  { id: 'sub_ops', name: 'Mantenimiento General', description: 'Tareas recurrentes', color: '#f1f5f9' }, // Slate
];

// Fechas relativas para el Gantt
const NOW = Date.now();
const DAY = 86400000;

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Excavación de Cimientos',
    description: 'Excavación para la zona de la piscina principal.',
    status: 'done',
    subProjectId: 'sub_civil',
    type: 'construction',
    priority: 'high',
    blockedBy: [],
    vendorId: 'v2',
    assigneeId: 'tm2',
    budgetEstimated: 5000,
    costReal: 5200,
    checklist: [{ id: 'c1', text: 'Marcar perímetro', done: true }, { id: 'c2', text: 'Excavar', done: true }],
    photos: [],
    attachments: [],
    createdAt: NOW - (10 * DAY),
    startDate: NOW - (10 * DAY),
    dueDate: NOW - (2 * DAY),
  },
  {
    id: 't2',
    title: 'Fontanería de Piscina',
    description: 'Instalación de tuberías principales y sistema de drenaje.',
    status: 'doing',
    subProjectId: 'sub_civil',
    type: 'construction',
    priority: 'high',
    blockedBy: ['t1'],
    vendorId: 'v3',
    assigneeId: 'tm3',
    budgetEstimated: 3500,
    costReal: 1000,
    checklist: [{ id: 'c3', text: 'Colocar tuberías principales', done: true }, { id: 'c4', text: 'Prueba de presión', done: false }],
    photos: [],
    attachments: [],
    createdAt: NOW - (1 * DAY),
    startDate: NOW - (1 * DAY),
    dueDate: NOW + (4 * DAY),
  },
  {
    id: 't3',
    title: 'Vertido de Hormigón',
    description: 'Vertido de hormigón para el vaso de la piscina.',
    status: 'todo',
    subProjectId: 'sub_civil',
    type: 'construction',
    priority: 'high',
    blockedBy: ['t2'], // Blocked by t2
    vendorId: 'v2',
    assigneeId: 'tm2',
    budgetEstimated: 8000,
    costReal: 0,
    checklist: [{ id: 'c5', text: 'Instalar ferralla', done: false }, { id: 'c6', text: 'Verter hormigón', done: false }],
    photos: [],
    attachments: [],
    createdAt: NOW + (5 * DAY),
    startDate: NOW + (5 * DAY),
    dueDate: NOW + (10 * DAY),
  },
  {
    id: 't4',
    title: 'Revisión Diaria Filtros',
    description: 'Comprobar manómetros y limpiar skimmers.',
    status: 'todo',
    subProjectId: 'sub_ops',
    type: 'maintenance',
    priority: 'medium',
    blockedBy: [],
    recurrence: { frequency: 'daily', nextDue: NOW + DAY },
    vendorId: 'v3',
    assigneeId: 'tm1',
    budgetEstimated: 0,
    costReal: 0,
    checklist: [{ id: 'c7', text: 'Revisar presión', done: false }],
    photos: [],
    attachments: [],
    createdAt: NOW,
    startDate: NOW,
    dueDate: NOW + DAY,
  },
  {
    id: 't5',
    title: 'Estructura Metálica Pistas',
    description: 'Montaje de pilares y malla.',
    status: 'todo',
    subProjectId: 'sub_padel',
    type: 'construction',
    priority: 'high',
    blockedBy: ['t3'],
    vendorId: 'v2',
    budgetEstimated: 12000,
    costReal: 0,
    checklist: [],
    photos: [],
    attachments: [],
    createdAt: NOW + (12 * DAY),
    startDate: NOW + (12 * DAY),
    dueDate: NOW + (20 * DAY),
  }
];