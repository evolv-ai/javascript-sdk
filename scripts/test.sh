#!/bin/bash

npm ci
npm test
npm run lint
npm run build
