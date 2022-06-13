FROM adoptopenjdk/maven-openjdk11

# Install JBang
RUN curl -Ls "https://github.com/jbangdev/jbang/releases/download/v0.95.0/jbang-0.95.0.zip" --output jbang-0.95.0.zip && \
    apt-get update -y && apt-get install unzip git -y && apt-get clean && \
    unzip jbang-0.95.0.zip && \
    rm jbang-0.95.0.zip && \
    chmod +x jbang-0.95.0/bin/jbang    

# Environment variables
ENV PATH="${PATH}:/jbang-0.95.0/bin"
ENV JBANG_VERSION 0.95.0
ENV JBANG_PATH=/jbang/bin
ENV PATH="${PATH}:/jbang/bin"
ENV JBANG_DIR="/jbang/.jbang"

# Install Camel-JBang
RUN jbang trust add -o --fresh --quiet https://github.com/apache/camel/blob/HEAD/dsl/camel-jbang/camel-jbang-main/dist/CamelJBang.java && \
    jbang -Dcamel.jbang.version=3.18.0-SNAPSHOT camel@apache/camel --version 


WORKDIR /ws
ENTRYPOINT ["/jbang-0.95.0/bin/jbang"]