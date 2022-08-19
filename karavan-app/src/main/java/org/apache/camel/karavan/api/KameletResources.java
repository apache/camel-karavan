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
package org.apache.camel.karavan.api;

import io.vertx.core.Vertx;
import org.apache.camel.karavan.service.InfinispanService;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Path("/kamelet")
public class KameletResources {

    @Inject
    InfinispanService infinispanService;

    @Inject
    Vertx vertx;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<String> getList() throws Exception {
        List<String> kameletList = getBuildInKameletsList();
        kameletList.addAll(infinispanService.getKameletNames());
        return kameletList;
    }

    private List<String> getBuildInKameletsList() {
        String list = getResourceFile("kamelets.properties");
        return List.of(list.split(System.getProperty("line.separator"))).stream()
                .map(s -> s + ".kamelet.yaml").collect(Collectors.toList());
    }

    private String getResourceFile(String path) {
        try {
            InputStream inputStream = KameletResources.class.getResourceAsStream("/kamelets/" + path);
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
            return data;
        } catch (Exception e) {
            return null;
        }
    }


    @GET
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/{name}")
    public String getYaml(@PathParam("name") String name) {
        if (infinispanService.getKameletNames().contains(name)) {
            return infinispanService.getKameletYaml(name);
        } else {
            return getResourceFile(name);
        }
    }
}
