export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskType = 'construction' | 'maintenance';
export type UserRole = 'admin' | 'viewer';

export interface Vendor {
  id: string;
  name: string;
  type: string;
  phone: string;
  email: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string; // e.g., 'Project Manager', 'Site Manager', 'Architect'
  initials: string;
}

export interface SubProject {
  id: string;
  name: string;
  description?: string;
  color: string; // Hex color for UI grouping
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Attachment {
  name: string;
  url: string;
  type: 'image' | 'document';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  subProjectId: string; // Changed from phaseId to link to SubProject
  type: TaskType;
  priority: 'low' | 'medium' | 'high';
  
  // Logic
  blockedBy: string[]; // IDs of tasks that block this one
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    nextDue: number; // Timestamp
  };

  // Assignment & Finance
  vendorId?: string; // External Provider
  assigneeId?: string; // Internal Team Member responsible
  budgetEstimated: number;
  costReal: number;
  projectedCost?: number; // New: Forecasted final cost
  financialNotes?: string; // New: Audit notes

  // Content
  checklist: ChecklistItem[];
  photos: string[]; // Base64 or URLs
  attachments: Attachment[];
  
  createdAt: number;
  dueDate: number;
}

export interface Project {
  id: string;
  name: string;
  role: UserRole;
}

export interface AppState {
  tasks: Task[];
  vendors: Vendor[];
  teamMembers: TeamMember[];
  subProjects: SubProject[];
  currentProject: Project;
  searchQuery: string;
}