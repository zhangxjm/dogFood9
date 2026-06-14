FROM flink:1.17.2-java11

USER root

RUN mkdir -p /opt/flink/plugins/hudi && \
    curl -L -o /opt/flink/lib/hudi-flink1.17-bundle-0.14.1.jar \
    "https://repo1.maven.org/maven2/org/apache/hudi/hudi-flink1.17-bundle/0.14.1/hudi-flink1.17-bundle-0.14.1.jar" || \
    echo "Hudi JAR download failed, will retry at runtime"

RUN curl -L -o /opt/flink/lib/flink-sql-connector-kafka-1.17.2.jar \
    "https://repo1.maven.org/maven2/org/apache/flink/flink-sql-connector-kafka/1.17.2/flink-sql-connector-kafka-1.17.2.jar" || \
    echo "Kafka connector download failed"

USER flink
