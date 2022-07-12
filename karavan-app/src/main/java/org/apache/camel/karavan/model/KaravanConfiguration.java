package org.apache.camel.karavan.model;

import io.smallrye.config.ConfigMapping;

import java.util.List;

@ConfigMapping(prefix = "karavan.config")
public interface KaravanConfiguration {

    String groupId();
    String imageGroup();
    String runtime();
    String runtimeVersion();
    Long statusThreshold();
    List<Environment> environments();

    interface Environment {
        String name();
        String cluster();
        String namespace();
        String pipeline();
        Boolean active();
    }
}
