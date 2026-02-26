import React from 'react';
import { AppState, Task, TeamMember, SubProject, HistoryEntry } from '../types';

export interface AppContextType {
    state: AppState;
    updateTask: (task: Task) => Promise<void>;
    addTask: (task: Task) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    // Team Actions
    addTeamMember: (member: TeamMember) => Promise<void>;
    updateTeamMember: (member: TeamMember) => Promise<void>;
    deleteTeamMember: (id: string) => Promise<void>;
    // SubProject Actions
    addSubProject: (subProject: SubProject) => Promise<void>;
    updateSubProject: (subProject: SubProject) => Promise<void>;
    deleteSubProject: (id: string) => Promise<void>;

    setSearchQuery: (query: string) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isMobile: boolean;
    openTaskModal: (task?: Task | null) => void;
    addHistoryEntry: (taskId: string, description: string) => Promise<void>;
}

export const AppContext = React.createContext<AppContextType | null>(null);
