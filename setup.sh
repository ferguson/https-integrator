#!/bin/bash

export VIRTUALIZE_NODE_VERSION=24.1

# install git submodules
git submodule init
git submodule update
virtualize/setup.sh

source ./activate

yarn install
(cd https-reflector; yarn install)
(cd https-director; yarn install)
