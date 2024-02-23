package org.apache.camel.karavan.shared;

public enum Property {
    PROJECT_ID("camel.karavan.project-id=%s"),
    PROJECT_NAME("camel.karavan.project-name=%s"),
    PROJECT_DESCRIPTION("camel.karavan.project-description=%s"),
    GAV("camel.jbang.gav=org.camel.karavan.demo:%s:1");

    private final String keyValueFormatter;

    Property(String keyValueFormatter) {
        this.keyValueFormatter = keyValueFormatter;
    }

    public String getKeyValueFormatter() {
        return keyValueFormatter;
    }
}
