package org.apache.camel.karavan.persistence;

import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

import static org.apache.camel.karavan.persistence.ProjectCacheEntity.TABLE_NAME;

@Entity
@Table(name = TABLE_NAME, indexes = {
        @Index(name = "idx_project_type", columnList = "type"),
        @Index(name = "idx_project_last_update", columnList = "last_update")
})
public class ProjectCacheEntity {

    public static final String TABLE_NAME = "project_state";

    @Id
    public String key;
    public String type;

    @Column(columnDefinition = "jsonb")
    public String data;

    @UpdateTimestamp
    @Column(name = "last_update")
    public Instant lastUpdate;
}