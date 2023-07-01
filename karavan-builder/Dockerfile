FROM jbangdev/jbang-action:0.106.1

ENV CAMEL_VERSION=3.21.0
ENV MAVEN_SETTINGS="/karavan-config-map/maven-settings.xml"

# Add Camel-JBang
RUN jbang trust add -o --fresh --quiet https://github.com/apache/camel/blob/HEAD/dsl/camel-jbang/camel-jbang-main/dist/CamelJBang.java

# Add Maven
RUN apt-get update -y && apt-get install maven git -y && apt-get clean                              

WORKDIR /scripts
ENTRYPOINT ["entrypoint"]
