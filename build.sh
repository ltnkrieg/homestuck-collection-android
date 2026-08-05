#!/bin/sh
# Build the web bundle, stage it, build the APK.
# Needs Node 18, yarn, JDK 17, Android SDK 34, Gradle 8.7.
set -e
cd "$(dirname "$0")"

[ -f base/package.json ] || { echo "No base/. Run setup.sh first."; exit 1; }

if [ -f keys/release.keystore ]; then
  export ANDROID_KEYSTORE_PATH="$(pwd)/keys/release.keystore"
  export ANDROID_KEYSTORE_PASSWORD="$(cat keys/keystore_password.txt)"
  export ANDROID_KEY_ALIAS=tuhc
  export ANDROID_KEY_PASSWORD="$ANDROID_KEYSTORE_PASSWORD"
fi

cd base
[ -d node_modules ] || yarn install --frozen-lockfile --ignore-engines
node build/genModTrees.js
ASSET_PACK_HREF=/assetpack/ NODE_OPTIONS=--max_old_space_size=8192 \
  node node_modules/@vue/cli-service/bin/vue-cli-service.js build webapp/browser.js
cd ..

rm -rf android/app/src/main/assets
mkdir -p android/app/src/main/assets
cp -r base/dist android/app/src/main/assets/www
cp -r base/src/imods android/app/src/main/assets/imods

cd android
gradle assembleRelease

echo
echo "APK: android/app/build/outputs/apk/release/app-release.apk"
