package com.synthetic.platform.service;

import com.synthetic.platform.model.Dataset;
import com.synthetic.platform.model.Project;
import com.synthetic.platform.model.AIModel;
import com.synthetic.platform.repository.DatasetRepository;
import com.synthetic.platform.repository.AIModelRepository;
import com.synthetic.platform.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final DatasetRepository datasetRepository;
    private final AIModelRepository aiModelRepository;

    public List<Project> findAll() {
        return projectRepository.findAll();
    }

    public Project findById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Project ID cannot be null");
        }
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
    }

    @Transactional
    public Project create(Project project) {
        if (project == null) {
            throw new IllegalArgumentException("Project cannot be null");
        }
        if (project.getName() == null || project.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Project name cannot be empty");
        }
        return projectRepository.save(project);
    }

    @Transactional
    public Project update(Long id, Project projectDetails) {
        Project project = findById(id);
        if (projectDetails.getName() != null && !projectDetails.getName().trim().isEmpty()) {
            project.setName(projectDetails.getName());
        }
        if (projectDetails.getDescription() != null) {
            project.setDescription(projectDetails.getDescription());
        }
        return projectRepository.save(project);
    }

    @Transactional
    public void delete(Long id) {
        Project project = findById(id);

        // Manual Cascading delete to avoid FK constraints in H2
        List<Dataset> datasets = datasetRepository.findByProjectId(id);
        for (Dataset dataset : datasets) {
            List<AIModel> models = aiModelRepository.findByDatasetId(dataset.getId());
            aiModelRepository.deleteAll(models);
            datasetRepository.delete(dataset);
        }

        projectRepository.delete(project);
    }
}
