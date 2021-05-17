#!/usr/bin/env zx

// Configuration
const DIST_PATH = "./dist";
const NOTES_DIR = `${process.env.HOME}/notes`;

// Run script
await $`DIST_PATH=${DIST_PATH} NOTES_DIR=${NOTES_DIR} node script.js`;

// Deploy
await $`vercel --prod`;
