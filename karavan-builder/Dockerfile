FROM jbangdev/jbang-action

# Add Camel-JBang
RUN jbang trust add -o --fresh --quiet https://github.com/apache/camel/blob/HEAD/dsl/camel-jbang/camel-jbang-main/dist/CamelJBang.java

# Add Maven Daemon
ADD https://github.com/mvndaemon/mvnd/releases/download/0.7.1/mvnd-0.7.1-linux-amd64.zip .

RUN mkdir /opt/mvnd && \        
    apt-get update -y && apt-get install unzip git -y && apt-get clean && \                                
    unzip mvnd-0.7.1-linux-amd64.zip && \                       
    mv mvnd-0.7.1-linux-amd64/* /opt/mvnd  

WORKDIR /scripts
ENTRYPOINT ["entrypoint", "-Dcamel.jbang.version=3.18.0-SNAPSHOT", "camel@apache/camel"]