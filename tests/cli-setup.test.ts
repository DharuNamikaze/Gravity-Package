/**
 * CLI Setup Tests
 * Tests for CLI setup commands and utilities
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir, tmpdir } from 'os';
import {
  getGravityExtensionDir,
  getGravityHostDir,
  getChromeProfileDirs,
  getBraveProfileDirs,
  detectGravityExtensionId,
  patchManifest,
  writeRegistryKey,
  registryKeyExists,
  getRegistryKeyValue,
  validateManifest,
  nat