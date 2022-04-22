/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.camel.karavan.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.apicurio.datamodels.Library;
import io.apicurio.datamodels.openapi.models.OasDocument;
import io.vertx.core.Vertx;
import org.apache.camel.CamelContext;
import org.apache.camel.generator.openapi.RestDslGenerator;
import org.apache.camel.impl.lw.LightweightCamelContext;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;

@ApplicationScoped
public class GeneratorService {


    @ConfigProperty(name = "karavan.folder.integrations")
    String integrations;

    @Inject
    Vertx vertx;

    private static final Logger LOGGER = Logger.getLogger(GeneratorService.class.getName());

    public String generate(String openApi, boolean generateRoutes) throws Exception {
        final ObjectMapper mapper = new ObjectMapper();
        final JsonNode node = mapper.readTree(openApi);
        OasDocument document = (OasDocument) Library.readDocument(node);
        try (CamelContext context = new LightweightCamelContext()) {
            return RestDslGenerator.toYaml(document).generate(context, generateRoutes);
        }
    }
}
