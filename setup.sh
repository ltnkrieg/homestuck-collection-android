#!/bin/sh
# Fetch the base web app and assemble the source tree in base/.
set -e
cd "$(dirname "$0")"

if [ -d base ]; then
  echo "base/ already exists. Delete it to start over."
  exit 1
fi

git clone https://github.com/jennymaeleidig/unofficial-homestuck-collection-web base
cd base
git checkout 1cf4339
git apply ../patches/port.patch
cp -r ../overlay/. .
cd ..
echo "Done. Run build.sh next."
