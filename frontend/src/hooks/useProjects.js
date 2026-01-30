import { useState, useEffect, useCallback } from 'react';
import { ProjectAPI } from '../api';

export function useProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await ProjectAPI.getAll();
            const data = res.data || [];
            if (data.length === 0) {
                const newProj = await ProjectAPI.create({ name: 'Default Workspace' });
                setProjects([newProj.data]);
            } else {
                setProjects(data);
            }
        } catch (err) {
            console.error('Failed to load projects:', err);
            setError(err.message || 'Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    }, []);

    const createProject = async (name) => {
        try {
            const res = await ProjectAPI.create({ name });
            await loadProjects();
            return res.data;
        } catch (err) {
            throw err;
        }
    };

    const updateProject = async (id, name) => {
        try {
            const res = await ProjectAPI.update(id, { name });
            await loadProjects();
            return res.data;
        } catch (err) {
            throw err;
        }
    };

    const deleteProject = async (id) => {
        try {
            await ProjectAPI.delete(id);
            await loadProjects();
        } catch (err) {
            throw err;
        }
    };

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    return {
        projects,
        loading,
        error,
        refresh: loadProjects,
        createProject,
        updateProject,
        deleteProject
    };
}
