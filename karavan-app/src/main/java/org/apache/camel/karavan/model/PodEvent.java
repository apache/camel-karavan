package org.apache.camel.karavan.model;

public record PodEvent(
        String id,
        String containerName,
        String reason,
        String note,
        String type,
        Integer count,
        String lastTimestamp
) {}