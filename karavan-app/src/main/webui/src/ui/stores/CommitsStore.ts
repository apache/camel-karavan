import {create} from "zustand";
import {KaravanApi} from "@api/KaravanApi";
import isEqual from "lodash/isEqual";

export interface ProjectFileCommitDiff {
    changeType: string;
    newPath: string;
    oldPath: string;
    diff: string;
    before: string;
    after: string;
}

export interface ProjectFolderCommit {
    id: string;
    projectId: string;
    authorName: string;
    authorEmail: string;
    commitTime: number;
    message: string;
    diffs: ProjectFileCommitDiff[];
}

export interface SystemCommit {
    id: string;
    authorName: string;
    authorEmail: string;
    commitTime: number;
    message: string;
    projectIds?: string[];
}

type CommitsState = {
    projectCommits: ProjectFolderCommit[];
    systemCommits: SystemCommit[];
    clearProjectCommits: () => void;
    fetchProjectCommits: (projectId: string) => Promise<void>;
    fetchSystemCommits: () => Promise<void>;
}

export const useCommitsStore = create<CommitsState>((set, get) => ({
    projectCommits: [],
    systemCommits: [],
    clearProjectCommits: (): void => {
      set({projectCommits: []});
    },
    fetchProjectCommits: async (projectId: string): Promise<void> => {
        await new Promise<ProjectFolderCommit[]>((resolve) => {
            KaravanApi.getProjectCommits(projectId, resolve);
        }).then(commits => {
            const currentCommits = get().projectCommits;
            if (!isEqual(currentCommits, commits)) {
                set({ projectCommits: commits });
            }
        })
    },
    fetchSystemCommits: async (): Promise<void> => {
        await new Promise<SystemCommit[]>((resolve) => {
            KaravanApi.getSystemCommits(resolve);
        }).then(systemCommits => {
            const currentCommits = get().systemCommits;
            if (!isEqual(currentCommits, systemCommits)) {
                set({ systemCommits: systemCommits });
            }
        })
    }
}))



