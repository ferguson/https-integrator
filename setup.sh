#!/bin/bash

export VIRTUALIZE_NODE_VERSION=24.1

# install git submodules
git submodule init
git submodule update
virtualize/setup.sh

source ./activate

### node
if [[ -f package.json && -d virtualize-node ]]; then
    yarn install
fi   
