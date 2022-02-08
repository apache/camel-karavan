package org.apache.camel.karavan;

import java.util.Map;

public final class Constants {
    public static final String CRD_GROUP = "camel.apache.org";
    public static final String CRD_VERSION = "v1";
    public static final String SHORT_NAME = "karavan";
    public static final String NAME = "karavan";
    public static final String PLURAL_NAME = "karavans";
    public static final String MANAGED_BY_LABEL = "app.kubernetes.io/managed-by";
    public static final String MANAGED_BY_VALUE = "karavan-operator";

    public static final String KARAVAN_MODE = "KARAVAN_MODE";

    public static final Map<String, String> DEFAULT_LABELS = Map.of(
            "app.kubernetes.io/name", NAME,
            "app.kubernetes.io/version", "latest",
            "app.kubernetes.io/part-of",  NAME
    );

    public static final String KARAVAN_IMAGE = "ghcr.io/apache/camel-karavan:latest";
}