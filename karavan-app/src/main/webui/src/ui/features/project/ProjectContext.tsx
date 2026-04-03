import React, {createContext, useContext} from 'react';
import {ProjectFunctions, UseProjectHook} from './Project.types';

const ProjectContext = createContext<ProjectFunctions | null>(null);

export const useProjectFunctions = () => {
    const context = useContext(ProjectContext);
    if (context === null) {
        throw new Error('UseProjectHook must be used within a ProjectProvider');
    }
    return context;
};

interface ProjectProviderProps {
    children: React.ReactNode;
    useProjectHook: UseProjectHook;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({
                                                                    children,
                                                                    useProjectHook,
                                                                }) => {
    const api = useProjectHook();
    return (
        <ProjectContext.Provider value={api}>
            {children}
        </ProjectContext.Provider>
    );
};