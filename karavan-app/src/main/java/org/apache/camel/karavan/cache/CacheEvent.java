package org.apache.camel.karavan.cache;

public record CacheEvent(String key, Operation operation, Object data) {
    public enum Operation {
        SAVE,
        DELETE
    }
}