package org.apache.camel.karavan.persistence;

import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = AccessCacheEntity.TABLE_NAME, indexes = {
        @Index(name = "idx_access_type", columnList = "type"),
        @Index(name = "idx_access_last_update", columnList = "last_update")
})
public class AccessCacheEntity {

    public static final String TABLE_NAME = "access_state";

    @Id
    public String key;       // The GroupedKey

    public String type;      // "UserFile", "RoleFolder", etc.

    @Column(columnDefinition = "jsonb")
    public String data;      // The actual object serialized to JSON

    @UpdateTimestamp
    @Column(name = "last_update")
    public Instant lastUpdate;
}