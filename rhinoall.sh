#!/usr/bin/env bash

# This runs the test for many versions. See "rhinotest.sh" to run just one

curl https://raw.githubusercontent.com/kangax/compat-table/gh-pages/data-es6.js > data-es6.js
curl https://raw.githubusercontent.com/kangax/compat-table/gh-pages/data-es2016plus.js > data-es2016plus.js
curl https://raw.githubusercontent.com/kangax/compat-table/gh-pages/data-esnext.js > data-esnext.js

echo
echo 'extracting testers...'
node extract.js ./data-es6.js > ./testers-es6.json
node extract.js ./data-es2016plus.js > ./testers-es2016plus.json
node extract.js ./data-esnext.js > ./testers-esnext.json
node testers.js > testers.json

if [ ! -d ./jars ]
then
  mkdir ./jars
fi

runTests() {
  version=$1
  supportVersion=$2
  jar=$3
  echo "Testing ${version}"
  if [ ${supportVersion} -gt 13 ]
  then
    echo "supportVersion=${supportVersion}; load('rhinotest.js');" > tmptest.$$
  else
    echo "supportVersion=${supportVersion}; load('obsoleterhinotest.js');" > tmptest.$$
  fi
  java -jar ${jar} -version 0 tmptest.$$ > rhino-results/${version}.json
  if [ ${supportVersion} -gt 5 ]
  then
    echo "Testing ${version} -version 200"
    java -jar ${jar} -version 200 tmptest.$$ > rhino-results/${version}-es6.json
  fi
}

fetchAndRunUrl() {
  version=$1
  rhinoVersion=$2
  url=$3

  fn=rhino-${version}.jar
  if [ ! -f ./jars/${fn} ]
  then
    echo "Fetching ${version}"...
    (cd jars; wget ${url})
  fi
  
  runTests ${version} ${rhinoVersion} ./jars/${fn}
}

fetchAndRunUrl 1.7R4 4 https://repo1.maven.org/maven2/org/mozilla/rhino/1.7R4/rhino-1.7R4.jar
fetchAndRunUrl 1.7R5 5 https://repo1.maven.org/maven2/org/mozilla/rhino/1.7R5/rhino-1.7R5.jar
fetchAndRunUrl 1.7.7.2 7 https://repo1.maven.org/maven2/org/mozilla/rhino/1.7.7.2/rhino-1.7.7.2.jar
fetchAndRunUrl 1.7.10 10 https://repo1.maven.org/maven2/org/mozilla/rhino/1.7.10/rhino-1.7.10.jar
fetchAndRunUrl 1.7.11 11 https://repo1.maven.org/maven2/org/mozilla/rhino/1.7.11/rhino-1.7.11.jar
fetchAndRunUrl 1.7.12 12 https://repo1.maven.org/maven2/org/mozilla/rhino/1.7.12/rhino-1.7.12.jar
fetchAndRunUrl 1.7.13 13 https://repo1.maven.org/maven2/org/mozilla/rhino/1.7.13/rhino-1.7.13.jar

runTests 1.7.14 14 ~/src/rhino/buildGradle/libs/rhino-1.7.14.jar

rm -f tmptest.$$

echo 'Building HTML'
node buildrhino.js
