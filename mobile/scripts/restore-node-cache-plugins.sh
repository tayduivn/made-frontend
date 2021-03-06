#!/usr/bin/env bash

export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$AWS_SECURE_KEY"
cd $TRAVIS_BUILD_DIR/mobile/$APP_TYPE
sudo pip install awscli

# only restore node on linux (i.e. android) builds. This persists between two
# stages in the same build, no build-to-build persistency
if [[ $TRAVIS_OS_NAME == "linux" ]]; then
    NODE_MODULES_ARCHIVE_FILENAME=$TRAVIS_BUILD_NUMBER-$APP_TYPE-$MB_ENV-node_modules.tar.gz
    echo "Restore node_modules from previous build phase"
    aws s3 cp s3://made-travis-cache/node-modules-cache/$NODE_MODULES_ARCHIVE_FILENAME $TRAVIS_BUILD_DIR/mobile/$APP_TYPE/$NODE_MODULES_ARCHIVE_FILENAME || true
    tar -xzf $NODE_MODULES_ARCHIVE_FILENAME || true
fi

# Android seems to be unstable with build-to-build plugin folder persistency. For now
# we will only restore plugins build-to-build on osx builds
if [[ $TRAVIS_OS_NAME == "osx" ]]; then
    PLUGIN_ARCHIVE_FILENAME=$APP_TYPE-$MB_ENV-$TRAVIS_OS_NAME-plugins.tar.gz
    echo "Restore Cordova plugins cache"
    aws s3 cp s3://made-travis-cache/plugin-cache/$PLUGIN_ARCHIVE_FILENAME $TRAVIS_BUILD_DIR/mobile/$APP_TYPE/$PLUGIN_ARCHIVE_FILENAME || true
    tar -xzf $PLUGIN_ARCHIVE_FILENAME || true
fi
