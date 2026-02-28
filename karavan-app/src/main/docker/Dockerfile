# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at

#      http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM eclipse-temurin:21-jdk

LABEL "org.opencontainers.image.title"="karavan"
LABEL "org.opencontainers.image.description"="Apache Camel Karavan"
LABEL "org.opencontainers.image.url"="https://camel.apache.org"
LABEL "org.opencontainers.image.licenses"="Apache 2.0"
LABEL "org.opencontainers.image.version"="4.18.0"
LABEL "org.apache.camel.karavan/type"="internal"

USER root
ARG DOCKER_GROUP_ID=999
RUN groupadd -g ${DOCKER_GROUP_ID} docker && usermod -aG docker default
RUN mkdir -p /opt/app/data && chown -R default:0 /opt/app
USER default

COPY target/*-runner.jar /opt/app/karavan.jar
ENV JAVA_TOOL_OPTIONS="-Dquarkus.http.host=0.0.0.0 \
-Djava.util.logging.manager=org.jboss.logmanager.LogManager \
-XX:+UseContainerSupport \
-XX:InitialRAMPercentage=25 -XX:MaxRAMPercentage=70 \
-XX:+ExitOnOutOfMemoryError \
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heapdump.hprof"

EXPOSE 8080

CMD ["java", "-jar", "/opt/app/karavan.jar"]
