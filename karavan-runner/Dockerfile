FROM jbangdev/jbang-action:0.106.1

ENV CAMEL_VERSION=3.20.4

# Install Git and Camel-JBang
RUN apt-get update && apt-get install -y git 
RUN jbang trust add -o --fresh --quiet https://github.com/apache/camel/blob/camel-$CAMEL_VERSION/dsl/camel-jbang/camel-jbang-main/dist/CamelJBang.java
RUN jbang alias add --name camel https://github.com/apache/camel/blob/camel-$CAMEL_VERSION/dsl/camel-jbang/camel-jbang-main/dist/CamelJBang.java

# Add scripts
COPY docker-entrypoint.sh /scripts/docker-entrypoint.sh
RUN chmod +x /scripts/docker-entrypoint.sh

WORKDIR /scripts
ENTRYPOINT ["bash", "/scripts/docker-entrypoint.sh"]
