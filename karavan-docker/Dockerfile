FROM jbangdev/jbang-action

WORKDIR /ws

RUN jbang trust add -o --fresh --quiet https://github.com/apache/camel/blob/HEAD/dsl/camel-jbang/camel-jbang-main/dist/CamelJBang.java
RUN jbang -Dcamel.jbang.version=3.18.0-SNAPSHOT camel@apache/camel --version 

ENTRYPOINT ["entrypoint"]