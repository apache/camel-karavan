FROM jbangdev/jbang-action:0.106.1

ENV CAMEL_VERSION=3.20.4
ENV KAMELETS_DIR="/kamelets"
RUN mkdir /kamelets

# Install Camel-JBang
RUN jbang trust add -o --fresh --quiet https://github.com/apache/camel/blob/camel-$CAMEL_VERSION/dsl/camel-jbang/camel-jbang-main/dist/CamelJBang.java
RUN jbang alias add --name camel https://github.com/apache/camel/blob/camel-$CAMEL_VERSION/dsl/camel-jbang/camel-jbang-main/dist/CamelJBang.java

# Add demo routes
COPY demo.camel.yaml /scripts/demo.camel.yaml

WORKDIR /scripts
ENTRYPOINT jbang -Dcamel.jbang.version=$CAMEL_VERSION camel run * --console --local-kamelet-dir=$KAMELETS_DIR