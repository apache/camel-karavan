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
package org.apache.camel.karavan;

import io.quarkus.runtime.StartupEvent;
import org.apache.camel.karavan.service.FileSystemService;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import java.io.IOException;
import java.net.URISyntaxException;

@ApplicationScoped
public class KaravanLifecycleBean {

    @ConfigProperty(name = "karavan.mode", defaultValue = "local")
    String mode;

    @Inject
    FileSystemService fileSystemService;

    private static final Logger LOGGER = Logger.getLogger(KaravanLifecycleBean.class.getName());

    void onStart(@Observes StartupEvent ev) throws IOException, GitAPIException, URISyntaxException {
        LOGGER.info("Karavan is starting in " + mode + " mode");
        if (mode.equals("local")) {
            fileSystemService.createIntegrationsFolder();
        }
    }
}
