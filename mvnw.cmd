@echo off
setlocal
set "MAVEN_PROJECTBASEDIR=%~dp0"
set "MAVEN_WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar"
java %JVM_CONFIG_MAVEN_PROPS% %MAVEN_OPTS% -jar "%MAVEN_WRAPPER_JAR%" %*
endlocal
