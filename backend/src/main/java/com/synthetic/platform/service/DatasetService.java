package com.synthetic.platform.service;

import com.synthetic.platform.model.Dataset;
import com.synthetic.platform.model.Project;
import com.synthetic.platform.model.AIModel;
import com.synthetic.platform.repository.DatasetRepository;
import com.synthetic.platform.repository.AIModelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DatasetService {
    private final DatasetRepository datasetRepository;
    private final AIModelRepository aiModelRepository;
    private final ProjectService projectService;

    @Value("${app.storage.location}")
    private String storageLocation;

    public List<Dataset> findByProjectId(Long projectId) {
        return datasetRepository.findByProjectId(projectId);
    }

    public Dataset findById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Dataset ID cannot be null");
        }
        return datasetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dataset not found with id: " + id));
    }

    @Transactional
    public Dataset uploadDataset(MultipartFile file, Long projectId) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }
        if (projectId == null) {
            throw new IllegalArgumentException("Project ID cannot be null");
        }

        Project project = projectService.findById(projectId);

        String originalName = file.getOriginalFilename();
        String safeName = originalName != null ? originalName.replaceAll("[^a-zA-Z0-9._-]", "_") : "dataset.csv";
        String fileName = UUID.randomUUID() + "_" + safeName;

        Path uploadPath = Paths.get(storageLocation);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        Dataset dataset = new Dataset();
        dataset.setName(originalName);
        dataset.setFilePath(fileName);
        dataset.setProject(project);

        return datasetRepository.save(dataset);
    }

    @Transactional
    public void delete(Long id) {
        Dataset dataset = findById(id);

        // Purge associated models first
        List<AIModel> models = aiModelRepository.findByDatasetId(id);
        aiModelRepository.deleteAll(models);

        // Optional: delete physical file if needed
        try {
            Path filePath = Paths.get(storageLocation).resolve(dataset.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (Exception e) {
            System.err.println("Failed to delete physical file: " + e.getMessage());
        }

        datasetRepository.delete(dataset);
    }
}
