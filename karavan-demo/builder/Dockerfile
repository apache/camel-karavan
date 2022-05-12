# FROM jbangdev/jbang-action
# RUN jbang trust add https://github.com/apache/camel/blob/HEAD/dsl/camel-jbang

FROM groovy:jdk11

ARG MAVEN_VERSION=3.8.5
ARG USER_HOME_DIR="/home/groovy"
ARG SHA=89ab8ece99292476447ef6a6800d9842bbb60787b9b8a45c103aa61d2f205a971d8c3ddfb8b03e514455b4173602bd015e82958c0b3ddc1728a57126f773c743
ARG BASE_URL=https://apache.osuosl.org/maven/maven-3/${MAVEN_VERSION}/binaries

RUN mkdir -p /usr/share/maven /usr/share/maven/ref \
  && curl -fsSL -o /tmp/apache-maven.tar.gz ${BASE_URL}/apache-maven-${MAVEN_VERSION}-bin.tar.gz \
  && echo "${SHA}  /tmp/apache-maven.tar.gz" | sha512sum -c - \
  && tar -xzf /tmp/apache-maven.tar.gz -C /usr/share/maven --strip-components=1 \
  && rm -f /tmp/apache-maven.tar.gz \
  && ln -s /usr/share/maven/bin/mvn /usr/bin/mvn

ENV MAVEN_HOME /usr/share/maven
ENV MAVEN_CONFIG "$USER_HOME_DIR/.m2"

COPY mvn-entrypoint.sh /usr/local/bin/mvn-entrypoint.sh
COPY settings-docker.xml /usr/share/maven/ref/

RUN curl -Ls https://sh.jbang.dev | bash -s - app setup
ENV PATH="${PATH}:/home/groovy/.jbang/bin"
ENV JBANG_DIR="/home/groovy/.jbang"
ENV CAMEL_VERSION="3.17.0-SNAPSHOT"

COPY --chown=groovy builder-demo.yaml /home/groovy/scripts/
COPY --chown=groovy grapeConfig.xml /home/groovy/.groovy/
RUN jbang trust add https://github.com/apache/camel/blob/HEAD/dsl/camel-jbang

# RUN jbang run -Dcamel.jbang.version=$CAMEL_VERSION camel@apache/camel \
#     run /home/groovy/scripts/builder-demo.yaml --max-messages=1 \
#     --deps=org.apache.camel:camel-core:$CAMEL_VERSION,org.apache.camel:camel-rest:$CAMEL_VERSION

RUN ls -la $HOME/.m2/repository/org/apache/camel
RUN ls -la $HOME/.m2/repository/org/apache/camel

CMD ["jbang", "-Dcamel.jbang.version=$CAMEL_VERSION", "camel@apache/camel", "run", "/home/groovy/scripts/builder-demo.yaml"]

