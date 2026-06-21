#!/usr/bin/env node
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const hooks = ['commit-msg', 'pre-commit', 'pre-push', 'post-checkout'];
const hooksSourceDir = path.resolve('tools/git-hooks');
const hooksSourceDisplayDir = 'tools/git-hooks';
const gitHooksDir = resolveGitHooksDir();
const [action, requestedHookName] = process.argv.slice(2);

if (process.env.GIT_HOOKS === '0') {
  if (action === 'setup') {
    console.log('Git hooks setup skipped because GIT_HOOKS=0');
    process.exit(0);
  }
}

if (!gitHooksDir) {
  if (action === 'setup') {
    console.log('Git hooks setup skipped outside a Git repository');
    process.exit(0);
  }

  console.error('Git hooks management requires a Git repository');
  process.exit(1);
}

const disabledHooksFile = path.join(gitHooksDir, '.disabled-hooks');

function resolveGitHooksDir() {
  let gitHooksPath;
  try {
    gitHooksPath = execFileSync('git', ['rev-parse', '--git-path', 'hooks'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return null;
  }

  return path.resolve(gitHooksPath);
}

function showUsage() {
  console.log(`
Usage: node tools/git-hooks/manage-hooks.js <action> [hook-name]

Actions:
  setup               Setup Git hooks (respects intentionally disabled hooks)
  enable-all          Enable all Git hooks (force)
  disable-all         Disable all Git hooks
  enable <hook>       Enable specific hook
  disable <hook>      Disable specific hook
  status              Show status of all hooks

Available hooks: ${hooks.join(', ')}

Examples:
  node tools/git-hooks/manage-hooks.js disable-all
  node tools/git-hooks/manage-hooks.js enable pre-commit
  node tools/git-hooks/manage-hooks.js disable commit-msg
  node tools/git-hooks/manage-hooks.js status
`);
}

function getDisabledHooks() {
  if (!fs.existsSync(disabledHooksFile)) {
    return new Set();
  }
  const content = fs.readFileSync(disabledHooksFile, 'utf-8');
  return new Set(content.split('\n').filter((line) => line.trim()));
}

function markHookAsDisabled(hookName) {
  fs.mkdirSync(gitHooksDir, { recursive: true });
  const disabled = getDisabledHooks();
  disabled.add(hookName);
  fs.writeFileSync(disabledHooksFile, `${Array.from(disabled).join('\n')}\n`);
}

function unmarkHookAsDisabled(hookName) {
  const disabled = getDisabledHooks();
  disabled.delete(hookName);
  if (disabled.size > 0) {
    fs.writeFileSync(disabledHooksFile, `${Array.from(disabled).join('\n')}\n`);
  } else if (fs.existsSync(disabledHooksFile)) {
    fs.unlinkSync(disabledHooksFile);
  }
}

function isHookDisabled(hookName) {
  return getDisabledHooks().has(hookName);
}

/**
 * Check if a Git hook is enabled (symlink exists and target is executable)
 * @param {string} hookName - The name of the hook to check
 * @returns {boolean} True if hook is enabled
 */
function isHookEnabled(hookName) {
  const hookPath = path.join(gitHooksDir, hookName);

  try {
    // Check if symlink exists (use lstat to check the link itself)
    const linkStats = fs.lstatSync(hookPath);
    if (!linkStats.isSymbolicLink() && !linkStats.isFile()) {
      return false;
    }

    // Check if target is executable (use stat to follow symlink)
    const stats = fs.statSync(hookPath);
    return !!(stats.mode & 0o100); // Check if executable
  } catch {
    return false;
  }
}

/**
 * Enable a Git hook by creating a symlink to the source hook file
 * @param {string} hookName - The name of the hook to enable
 */
function enableHook(hookName) {
  const sourcePath = path.join(hooksSourceDir, hookName);
  const hookPath = path.join(gitHooksDir, hookName);

  if (fs.existsSync(sourcePath)) {
    fs.mkdirSync(gitHooksDir, { recursive: true });

    // Remove existing hook if present (could be old copy or broken symlink)
    if (
      fs.existsSync(hookPath) ||
      fs.lstatSync(hookPath, { throwIfNoEntry: false })
    ) {
      fs.unlinkSync(hookPath);
    }

    // Create relative symlink from Git's resolved hooks directory to tools/git-hooks
    const relativeSourcePath = path.relative(gitHooksDir, sourcePath);
    fs.symlinkSync(relativeSourcePath, hookPath);

    // Remove from disabled list when enabling
    unmarkHookAsDisabled(hookName);
    console.log(`✅ Enabled ${hookName} hook`);
  } else {
    console.log(
      `❌ Hook file ${path.join(hooksSourceDisplayDir, hookName)} not found`,
    );
  }
}

function disableHook(hookName) {
  const hookPath = path.join(gitHooksDir, hookName);
  if (fs.existsSync(hookPath)) {
    fs.unlinkSync(hookPath);
    // Mark as intentionally disabled
    markHookAsDisabled(hookName);
    console.log(`🚫 Disabled ${hookName} hook`);
  } else {
    console.log(`❌ Hook file ${hookPath} not found`);
  }
}

function showStatus() {
  console.log('\n📋 Git Hooks Status:');
  console.log('===================');

  hooks.forEach((hook) => {
    const enabled = isHookEnabled(hook);
    const disabled = isHookDisabled(hook);
    let status;
    if (enabled) {
      status = '✅ Enabled';
    } else if (disabled) {
      status = '🚫 Disabled (intentional)';
    } else {
      status = '⚪ Not installed';
    }
    console.log(`${hook.padEnd(15)} ${status}`);
  });
  console.log();
}

if (!action) {
  showUsage();
  process.exit(1);
}

switch (action) {
  case 'enable-all':
    // Ensure Git uses its default resolved hooks directory
    try {
      execSync('git config --unset core.hooksPath', { stdio: 'ignore' });
    } catch {
      // Ignore error if hooksPath wasn't set
    }
    hooks.forEach(enableHook);
    console.log('✅ All hooks enabled');
    break;

  case 'setup': {
    // Ensure Git uses its default resolved hooks directory
    try {
      execSync('git config --unset core.hooksPath', { stdio: 'ignore' });
    } catch {
      // Ignore error if hooksPath wasn't set
    }

    // Check if all hooks are already set up
    const allHooksReady = hooks.every(
      (hook) => isHookDisabled(hook) || isHookEnabled(hook),
    );

    if (allHooksReady) {
      // All hooks already configured - show brief confirmation
      console.log('✅ Git hooks already configured');
      process.exit(0);
    }

    // Only enable hooks that don't exist AND weren't intentionally disabled
    hooks.forEach((hook) => {
      if (isHookDisabled(hook)) {
        console.log(`⏭️  Skipped ${hook} hook (intentionally disabled)`);
      } else if (!isHookEnabled(hook)) {
        enableHook(hook);
      } else {
        console.log(`⏭️  Skipped ${hook} hook (already exists)`);
      }
    });
    console.log('✅ Git hooks setup complete');
    break;
  }

  case 'disable-all':
    hooks.forEach(disableHook);
    console.log('🚫 All hooks disabled');
    break;

  case 'enable':
    if (!requestedHookName || !hooks.includes(requestedHookName)) {
      console.log(`❌ Please specify a valid hook: ${hooks.join(', ')}`);
      process.exit(1);
    }
    enableHook(requestedHookName);
    break;

  case 'disable':
    if (!requestedHookName || !hooks.includes(requestedHookName)) {
      console.log(`❌ Please specify a valid hook: ${hooks.join(', ')}`);
      process.exit(1);
    }
    disableHook(requestedHookName);
    break;

  case 'status':
    showStatus();
    break;

  default:
    console.log(`❌ Unknown action: ${action}`);
    showUsage();
    process.exit(1);
}
