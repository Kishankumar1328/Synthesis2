package com.synthetic.platform.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "models")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class AIModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "dataset_id", nullable = false)
    private Dataset dataset;

    private String algorithm; // CTGAN, TVAE
    private String status; // PENDING, TRAINING, COMPLETED, FAILED
    private String modelFilePath;

    @Column(columnDefinition = "TEXT")
    private String trainingMetrics;

    @CreatedDate
    private LocalDateTime createdAt;
}
