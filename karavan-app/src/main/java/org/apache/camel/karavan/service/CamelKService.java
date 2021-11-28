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

import io.fabric8.camelk.client.CamelKClient;
import io.fabric8.camelk.client.DefaultCamelKClient;
import io.fabric8.camelk.v1.Integration;
import io.fabric8.camelk.v1.IntegrationList;
import io.fabric8.camelk.v1.SourceSpec;
import io.vertx.core.Vertx;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@ApplicationScoped
public class CamelKService {

    private CamelKClient camelk = new DefaultCamelKClient();

    private static final String header =
            "apiVersion: camel.apache.org/v1\n" +
            "kind: Integration\n" +
            "metadata:\n" +
            "  name: %s\n" +
            "spec:\n" +
            "  flows:\n";

    @Inject
    Vertx vertx;

    private static final Logger LOGGER = Logger.getLogger(CamelKService.class.getName());

    public Map<String, String> getIntegrationList() throws IOException {
        IntegrationList list = camelk.v1().integrations().inNamespace(getNamespace()).list();
        return list.getItems().stream()
                .collect(Collectors.toMap(i -> i.getMetadata().getName(),i -> i.getStatus().getPhase()));
    }

    public String getIntegration(String name) throws IOException {
        StringBuilder result = new StringBuilder(String.format(header, name));
        Integration i = camelk.v1().integrations().inNamespace(getNamespace()).withName(name).get();
        Optional<SourceSpec> spec = i.getStatus().getGeneratedSources().stream()
                .filter(s -> s.getContent() != null && !s.getContent().isEmpty())
                .findFirst();
        if (spec.isPresent()){
            String content = spec.get().getContent().lines().map(s -> "    ".concat(s)).collect(Collectors.joining("\n"));
            result.append(content);
        }
        System.out.println(result.toString());
        return result.toString();
    }

    public String getNamespace() throws IOException {
        try {
            return Files.readString(Paths.get("/var/run/secrets/kubernetes.io/serviceaccount/namespace"));
        } catch (Exception e){
            return "karavan";
        }
    }

    public List<String> getIntegrationList(String folder) {
        return vertx.fileSystem().readDirBlocking(Paths.get(folder).toString())
                .stream()
                .filter(s -> s.endsWith(".yaml"))
                .map(s -> {
                    String[] parts = s.split(Pattern.quote(File.separator));
                    return parts[parts.length - 1];
                }).collect(Collectors.toList());
    }

    public void applyIntegration(String name, String yaml) throws GitAPIException, IOException {
        Integration i = camelk.v1().integrations().load(new ByteArrayInputStream(yaml.getBytes())).get();
        camelk.v1().integrations().createOrReplace(i);
    }

    public Boolean deleteIntegration(String name) throws IOException {
        Integration i = camelk.v1().integrations().inNamespace(getNamespace()).withName(name).get();
        return camelk.v1().integrations().delete(i);
    }


}
