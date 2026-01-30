import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Production-level error interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.message || "An unexpected error occurred";
        console.error("[API Error]", message);
        // You could trigger a global toast here if a toast library is installed
        return Promise.reject(error);
    }
);

export const ProjectAPI = {
    getAll: () => api.get('/projects'),
    getOne: (id) => api.get(`/projects/${id}`),
    create: (data) => api.post('/projects', data),
    update: (id, data) => api.put(`/projects/${id}`, data),
    delete: (id) => api.delete(`/projects/${id}`)
};

export const DatasetAPI = {
    getByProject: (projectId) => api.get(`/datasets/project/${projectId}`),
    getStats: (id) => api.get(`/datasets/${id}/stats`),
    upload: (formData) => api.post('/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => api.delete(`/datasets/${id}`)
};

export const ModelAPI = {
    getByDataset: (datasetId) => api.get(`/models/dataset/${datasetId}`),
    train: (data) => api.post('/models/train', data),
    generate: (modelId, data) => api.post(`/models/${modelId}/generate`, data, {
        responseType: 'blob'
    })
};

export const AIAPI = {
    // Train a new AI model
    trainModel: (data) => api.post('/models/train', data),

    // Get model training status
    getModelStatus: (modelId) => api.get(`/models/${modelId}`),

    // Generate synthetic data
    generateData: (modelId, data) => api.post(`/models/${modelId}/generate`, data, {
        responseType: 'blob'
    }),

    // Get dataset statistics
    getDatasetStats: (datasetId) => api.get(`/datasets/${datasetId}/stats`),

    // Evaluate model quality
    evaluateModel: (modelId, sampleCount = 1000) =>
        api.get(`/models/${modelId}/evaluate?samples=${sampleCount}`),

    // Get all models for a dataset
    getModelsByDataset: (datasetId) => api.get(`/models/dataset/${datasetId}`),

    // Run privacy audit
    runPrivacyAudit: (datasetId) => api.post(`/datasets/${datasetId}/privacy-audit`),

    // Detect anomalies
    detectAnomalies: (datasetId) => api.post(`/datasets/${datasetId}/anomaly-detection`)
};
