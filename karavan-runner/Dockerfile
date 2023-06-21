FROM jbangdev/jbang-action:0.106.1

ENV CAMEL_VERSION=3.20.6
ENV MAVEN_SETTINGS="/karavan/maven-settings.xml"
ENV KAMELETS_DIR="/scripts/kamelets"
ENV CODE_DIR="/scripts/code"

RUN mkdir -p $CODE_DIR \
    && mkdir -p $KAMELETS_DIR \
    && jbang trust add  --quiet  https://github.com/apache/camel \
    && jbang app install camel@apache/camel

EXPOSE 8080

ENTRYPOINT jbang -Dcamel.jbang.version=$CAMEL_VERSION camel@apache/camel run --source-dir=$CODE_DIR --console --local-kamelet-dir=$KAMELETS_DIR --maven-settings=$MAVEN_SETTINGS