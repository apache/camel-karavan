FROM jbangdev/jbang-action:0.105.2

# Add Camel-JBang
RUN jbang trust add -o --fresh --quiet https://github.com/apache/camel/blob/HEAD/dsl/camel-jbang/camel-jbang-main/dist/CamelJBang.java

# Add Maven Daemon
ADD https://dist.apache.org/repos/dist/release/maven/mvnd/1.0-m6/maven-mvnd-1.0-m6-m39-linux-amd64.zip .

RUN mkdir /opt/mvnd && \        
    apt-get update -y && apt-get install unzip git -y && apt-get clean && \                                
    unzip maven-mvnd-1.0-m6-m39-linux-amd64.zip && \                       
    mv maven-mvnd-1.0-m6-m39-linux-amd64/* /opt/mvnd  

WORKDIR /scripts
ENTRYPOINT ["entrypoint", "-Dcamel.jbang.version=3.20.3", "camel@apache/camel"]
