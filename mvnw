#!/bin/sh
# Maven Wrapper script
set -e
MAVEN_PROJECTBASEDIR=$(cd "$(dirname "$0")" && pwd)
MAVEN_WRAPPER_JAR="$MAVEN_PROJECTBASEDIR/.mvn/wrapper/maven-wrapper.jar"
exec java $JVM_CONFIG_MAVEN_PROPS $MAVEN_OPTS -jar "$MAVEN_WRAPPER_JAR" "$@"
