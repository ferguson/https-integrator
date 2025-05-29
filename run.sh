#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR || (echo "error!"; exit 1)
VIRTUALIZE_ACTIVATE_VIA_SCRIPT=1 source ./activate

echo "starting https-integrator"
node --env-file config.env ./https-integrator.js
# note: --env-file is a node 20.6+ thing
