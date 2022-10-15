package org.apache.camel.karavan.operator;

import org.eclipse.microprofile.config.ConfigProvider;

import java.util.HashMap;
import java.util.Map;

public class Utils {

    public static Map<String, String> getLabels(String name, Map<String, String> labels) {
        Map<String, String> result = new HashMap<>(Map.of(
                "app", name,
                "app.kubernetes.io/name", name,
                "app.kubernetes.io/version", ConfigProvider.getConfig().getValue("karavan.version", String.class),
                "app.kubernetes.io/part-of", Constants.NAME
        ));
        result.putAll(labels);
        return result;
    }
}
