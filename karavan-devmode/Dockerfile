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
FROM registry.access.redhat.com/ubi9/openjdk-21:1.24-2.1782292637

LABEL "org.opencontainers.image.title"="karavan-devmode"
LABEL "org.opencontainers.image.description"="Apache Camel Karavan DevMode"
LABEL "org.opencontainers.image.url"="https://camel.apache.org"
LABEL "org.opencontainers.image.licenses"="Apache 2.0"
LABEL "org.opencontainers.image.version"="4.22.0"

ENV MAVEN_HOME=/opt/maven
ENV PATH=$MAVEN_HOME/bin:$PATH

USER root
RUN microdnf update -y \
    && microdnf install -y git tar gzip jq \
    && microdnf clean all

ENV KARAVAN="/karavan"
ENV KARAVAN_LIB="$KARAVAN/lib"
ENV KARAVAN_SCRIPTS="$KARAVAN/scripts"
ENV DOCKER_CONFIG_DIR="$KARAVAN/.docker"
ENV MAVEN_CONFIG="$KARAVAN/.m2"
ENV MAVEN_REPO="$MAVEN_CONFIG/repository"
ENV BUILDER_PATH="$KARAVAN/builder"
ENV CODE_DIR="$KARAVAN/code"
ENV KAMELETS_DIR="$CODE_DIR/kamelets"

ENV RUN_IN_BUILD_MODE=false
ENV RUN_IN_COMPILE_MODE=false

RUN mkdir -p $MAVEN_REPO \
    && mkdir -p $CODE_DIR \
    && mkdir -p $DOCKER_CONFIG_DIR \
    && mkdir -p $BUILDER_PATH

COPY target/lib/*.jar $KARAVAN_LIB/
COPY target/karavan-devmode-*.jar $KARAVAN_LIB
COPY entrypoint.sh $KARAVAN/
RUN chmod +x $KARAVAN/entrypoint.sh

RUN groupadd -g 1001 karavan \
    && useradd -d $KARAVAN -s /bin/bash -g karavan -u 1001 karavan
RUN chown -R karavan:karavan $KARAVAN
RUN chown -R karavan:karavan /home/default
USER karavan

EXPOSE 8080
WORKDIR $CODE_DIR

ENTRYPOINT ["/karavan/entrypoint.sh"]