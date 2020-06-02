#!/bin/bash

echo "Beginning javascript-sdk release to $EVOLV_STAGE!"

npm ci
npm test
npm run build

if [[ "$EVOLV_STAGE" == "prod" ]]; then
	echo "Releasing javascript-sdk to prod"
	npm run release
	echo "Done releasing javascript-sdk to prod"
elif [[ "$EVOLV_STAGE" == "staging" ]]; then
	echo "Releasing javascript-sdk to staging"
	npm run staging:release
	echo "Done releasing javascript-sdk to staging"
else
	echo "EVOLV_STAGE '$EVOLV_STAGE' not recognized. Doing nothing."
fi
