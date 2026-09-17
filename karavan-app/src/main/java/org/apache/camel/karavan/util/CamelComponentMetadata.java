package org.apache.camel.karavan.util;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * Root record for the Camel component configuration.
 * Since the JSON is an array, you would typically deserialize it as List<CamelComponentMetadata>
 */
public record CamelComponentMetadata(
        ComponentDetails component,
        Map<String, ComponentProperty> componentProperties,
        Map<String, ComponentHeader> headers,
        Map<String, ComponentProperty> properties
) {
    /**
     * Record representing the "component" object in the JSON.
     */
    public record ComponentDetails(
            String kind,
            String name,
            String title,
            String description,
            boolean deprecated,
            String firstVersion,
            String label,
            String javaType,
            String supportLevel,
            String groupId,
            String artifactId,
            String version,
            String scheme,
            String extendsScheme,
            String syntax,
            boolean async,
            boolean api,
            boolean consumerOnly,
            boolean producerOnly,
            boolean lenientProperties,
            boolean browsable,
            boolean remote
    ) {}

    /**
     * Record representing the individual properties inside "componentProperties" and "properties".
     */
    public record ComponentProperty(
            int index,
            String kind,
            String displayName,
            String group,
            String label,
            boolean required,
            String type,
            String javaType,

            @JsonProperty("enum")
            List<String> enumValues,

            boolean deprecated,
            String deprecationNote,
            boolean autowired,
            boolean secret,
            Object defaultValue,
            String configurationClass,
            String configurationField,
            String description,

            // Additional optional fields found in advanced configurations
            String optionalPrefix,
            String prefix,
            Boolean multiValue,
            Boolean supportFileReference,
            Boolean largeInput,
            String inputLanguage
    ) {}

    /**
     * Record representing the individual headers inside the "headers" object.
     * Headers slightly differ from properties (e.g., they have 'constantName' and 'important', but no 'type').
     */
    public record ComponentHeader(
            int index,
            String kind,
            String displayName,
            String group,
            String label,
            boolean required,
            String javaType,

            @JsonProperty("enum")
            List<String> enumValues,

            boolean deprecated,
            String deprecationNote,
            boolean autowired,
            boolean secret,
            Object defaultValue,
            String description,
            String constantName,

            // Additional optional fields specific to headers
            Boolean important
    ) {}
}

