FROM jbangdev/jbang-action:0.106.1

# Add Camel-JBang
RUN jbang trust add -o --fresh --quiet https://github.com/apache/camel/blob/HEAD/dsl/camel-jbang/camel-jbang-main/dist/CamelJBang.java

# Add Maven
RUN apt-get update -y && apt-get install maven git -y && apt-get clean                              

WORKDIR /scripts
ENTRYPOINT ["entrypoint", "-Dcamel.jbang.version=3.20.6", "camel@apache/camel"]
