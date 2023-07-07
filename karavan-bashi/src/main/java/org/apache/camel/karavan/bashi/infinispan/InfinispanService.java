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
package org.apache.camel.karavan.bashi.infinispan;

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.eventbus.EventBus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.infinispan.client.hotrod.RemoteCache;
import org.infinispan.client.hotrod.RemoteCacheManager;
import org.infinispan.client.hotrod.Search;
import org.infinispan.client.hotrod.configuration.ClientIntelligence;
import org.infinispan.client.hotrod.configuration.ConfigurationBuilder;
import org.infinispan.commons.api.BasicCache;
import org.infinispan.commons.configuration.StringConfiguration;
import org.infinispan.commons.marshall.ProtoStreamMarshaller;
import org.infinispan.query.dsl.QueryFactory;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.inject.Default;
import javax.inject.Inject;

import java.util.List;

import static org.apache.camel.karavan.bashi.ConductorService.ADDRESS_INFINISPAN_HEALTH;

@Default
@ApplicationScoped
public class InfinispanService  {

    @ConfigProperty(name ="quarkus.infinispan-client.hosts")
    String infinispanHosts;
    @ConfigProperty(name ="quarkus.infinispan-client.username")
    String infinispanUsername;
    @ConfigProperty(name ="quarkus.infinispan-client.password")
    String infinispanPassword;

    @Inject
    EventBus eventBus;

    private BasicCache<GroupedKey, PodStatus> podStatuses;
    private BasicCache<GroupedKey, String> runnerCommands;

    private static final String CACHE_CONFIG = "<distributed-cache name=\"%s\">"
            + " <encoding media-type=\"application/x-protostream\"/>"
            + " <groups enabled=\"true\"/>"
            + "</distributed-cache>";

    private static final Logger LOGGER = Logger.getLogger(InfinispanService.class.getName());

    @ConsumeEvent(value = ADDRESS_INFINISPAN_HEALTH, blocking = true, ordered = true)
    void startService(String infinispanHealth) {
        if (infinispanHealth.equals("healthy")) {
            LOGGER.info("InfinispanService is starting in remote mode");

            ProtoStreamMarshaller marshaller = new ProtoStreamMarshaller();
            marshaller.register(new ProjectStoreSchemaImpl());

            ConfigurationBuilder builder = new ConfigurationBuilder();
            builder.socketTimeout(1000)
                    .connectionTimeout(10000)
                    .addServers(infinispanHosts)
                    .security()
                        .authentication().enable()
                        .username(infinispanUsername)
                        .password(infinispanPassword)
                    .clientIntelligence(ClientIntelligence.BASIC)
                    .marshaller(marshaller);

            RemoteCacheManager cacheManager = new RemoteCacheManager(builder.build());
            runnerCommands = cacheManager.administration().getOrCreateCache(RunnerCommand.CACHE, new StringConfiguration(String.format(CACHE_CONFIG, RunnerCommand.CACHE)));
            podStatuses = cacheManager.administration().getOrCreateCache(PodStatus.CACHE, new StringConfiguration(String.format(CACHE_CONFIG, PodStatus.CACHE)));
            cacheManager.getCache(RunnerCommand.CACHE).addClientListener(new ClientRunnerListener(this, eventBus));
        }
    }

    public void sendRunnerCommand(String projectId, String runnerName, RunnerCommand.NAME command) {
        runnerCommands.put(GroupedKey.create(projectId, runnerName), command.name());
    }

    public String getRunnerCommand(GroupedKey key) {
        return runnerCommands.get(key);
    }

    public List<PodStatus> getPodStatuses(String projectId, String env) {
        QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) podStatuses);
        return queryFactory.<PodStatus>create("FROM karavan.PodStatus WHERE project = :project AND env = :env")
                .setParameter("project", projectId)
                .setParameter("env", env)
                .execute().list();
    }

    public List<PodStatus> getPodStatuses(String env) {
        QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) podStatuses);
        return queryFactory.<PodStatus>create("FROM karavan.PodStatus WHERE env = :env")
                .setParameter("env", env)
                .execute().list();
    }

    public void savePodStatus(PodStatus status) {
        podStatuses.put(GroupedKey.create(status.getProject(), status.getName()), status);
    }

    public void deletePodStatus(PodStatus status) {
        podStatuses.remove(GroupedKey.create(status.getProject(), status.getName()));
    }

}
