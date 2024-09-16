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

FROM eclipse-temurin:17-jdk

LABEL "org.opencontainers.image.title"="karavan"
LABEL "org.opencontainers.image.description"="Apache Camel Karavan"
LABEL "org.opencontainers.image.url"="https://camel.apache.org"
LABEL "org.opencontainers.image.licenses"="Apache 2.0"
LABEL "org.opencontainers.image.version"="4.8.0"
LABEL "org.apache.camel.karavan/type"="internal"

RUN mkdir /opt/app
COPY target/*-runner.jar /opt/app/karavan.jar
EXPOSE 8080

CMD exec "java" \
    ${JAVA_OPTS} \
    "-jar" "/opt/app/karavan.jar"

