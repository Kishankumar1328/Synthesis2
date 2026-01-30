package com.synthetic.platform.controller;

import com.synthetic.platform.model.Dataset;
import com.synthetic.platform.service.AIService;
import com.synthetic.platform.service.DatasetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/datasets")
@RequiredArgsConstructor
@CrossOrigin
public class DatasetController {
    private final DatasetService datasetService;
    private final AIService aiService;

    @GetMapping("/{id}/stats")
    public String getStats(@PathVariable Long id) throws Exception {
        Dataset dataset = datasetService.findById(id);
        return aiService.getDatasetStats(dataset.getFilePath());
    }

    @GetMapping("/project/{projectId}")
    public List<Dataset> getByProject(@PathVariable Long projectId) {
        return datasetService.findByProjectId(projectId);
    }

    @PostMapping("/upload")
    public Dataset upload(@RequestParam("file") MultipartFile file,
            @RequestParam("projectId") Long projectId) throws Exception {
        return datasetService.uploadDataset(file, projectId);
    }

    @PostMapping("/{id}/privacy-audit")
    public String privacyAudit(@PathVariable Long id) throws Exception {
        Dataset dataset = datasetService.findById(id);
        return aiService.runPrivacyAudit(dataset.getFilePath());
    }

    @PostMapping("/{id}/anomaly-detection")
    public String anomalyDetection(@PathVariable Long id) throws Exception {
        Dataset dataset = datasetService.findById(id);
        return aiService.detectAnomalies(dataset.getFilePath());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        datasetService.delete(id);
    }
}
