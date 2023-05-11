FROM jbangdev/jbang-action:0.106.1

ENV CAMEL_VERSION=3.21.0-SNAPSHOT
ENV KAMELETS_DIR="/kamelets"
RUN mkdir /kamelets

# Install Camel-JBang
RUN jbang trust add -o --fresh --quiet https://github.com/apache/camel/blob/camel-$CAMEL_VERSION/dsl/camel-jbang/camel-jbang-main/dist/CamelJBang.java
RUN jbang trust add -o --fresh --quiet https://github.com/apache/camel/blob/HEAD/dsl/camel-jbang/camel-jbang-main/dist/CamelJBang.java

# Add demo routes
# COPY demo.camel.yaml /scripts/demo.camel.yaml

WORKDIR /scripts
ENTRYPOINT jbang -Dcamel.jbang.version=$CAMEL_VERSION camel@apache/camel run --source-dir=/scripts --console --local-kamelet-dir=$KAMELETS_DIR