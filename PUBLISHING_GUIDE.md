# Publishing Gravity to npm

Complete guide to publish `gravity-core` to the npm registry.

## 📋 Prerequisites

Before publishing, you need:

1. **npm account** - Create at https://www.npmjs.com/signup
2. **Node.js & npm** - Already installed (you have it)
3. **Git** - For version control (optional but recommended)
4. **GitHub account** - For repository (optional but recommended)

## 🔑 Step 1: Create npm Account

If you don't have an npm account:

1. Go to https://www.npmjs.com/signup
2. Fill in username, email, password
3. Verify your email
4. ✅ Account created

## 🔐 Step 2: Login to npm

In your terminal, login to npm:

```bash
npm login
```

You'll be prompted for:
- **Username** - Your npm username
- **Password** - Your npm password
- **Email** - Your email address

After successful login, you'll see:
```
Logged in as [your-username] on https://registry.npmjs.org/.
```

**Verify login:**
```bash
npm whoami
```

Should output your username.

## 📦 Step 3: Prepare Package

### Check package.json

Verify your `package/package.json` has:

```json
{
  "name": "gravity-core",
  "version": "1.0.1",
  "description": "Gravity - AI-powered CSS layout diagnostics for any IDE",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "gravity": "./dist/cli.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "SETUP.md"
  ],
  "keywords": [
    "devtools",
    "browser",
    "debugging",
    "layout",
    "diagnostics",
    "ai",
    "mcp",
    "css",
    "vscode",
    "cursor",
    "ide"
  ],
  "author": "Gravity Contributors",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/gravity/core"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "dependencies": {
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "@types/ws": "^8.5.13",
    "typescript": "^5.7.3"
  }
}
```

### Update version (if needed)

If this is not your first release, update the version:

```bash
npm version patch    # 1.0.1 → 1.0.1 (bug fixes)
npm version minor    # 1.0.1 → 1.1.0 (new features)
npm version major    # 1.0.1 → 2.0.0 (breaking changes)
```

### Build the package

```bash
npm run build
```

Verify `dist/` folder has all compiled files.

### Create .npmignore (optional)

Create `package/.npmignore` to exclude files from npm:

```
src/
tsconfig.json
*.test.ts
.gitignore
PUBLISHING_GUIDE.md
```

This keeps the package smaller.

## 📄 Step 4: Add License

Create `package/LICENSE` file:

```
MIT License

Copyright (c) 2026 Gravity Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🚀 Step 5: Publish to npm

### Option A: Publish from Command Line

```bash
cd package
npm publish
```

You'll see output like:
```
npm notice 📦 gravity-core@1.0.1
npm notice === Tarball Contents ===
npm notice 123.4kB dist/index.js
npm notice 45.6kB dist/bridge.js
...
npm notice === Tarball Details ===
npm notice name:          gravity-core
npm notice version:       1.0.1
npm notice package size:  234.5 kB
npm notice unpacked size: 567.8 kB
npm notice shasum:        abc123def456...
npm notice integrity:     sha512-abc123...
npm notice total files:   42
npm notice
npm notice Publishing to https://registry.npmjs.org/
+ gravity-core@1.0.1
```

✅ **Published!**

### Option B: Publish with npm CLI

```bash
cd package
npm publish --access public
```

The `--access public` flag makes it publicly available (required for scoped packages).

## ✅ Step 6: Verify Publication

### Check npm Registry

Visit: https://www.npmjs.com/package/gravity-core

You should see:
- Package name
- Version
- Description
- README
- Installation instructions

### Install from npm

Test installation:

```bash
npm install gravity-core
```

Should download from npm registry.

### Verify CLI

```bash
npx gravity-core --help
```

Should show MCP server help.

## 🔄 Step 7: Update Version for Next Release

After publishing, update version for next development:

```bash
npm version prerelease --preid=dev
```

This changes `1.0.1` to `1.0.1-dev.0` for development.

## 📝 Step 8: Create GitHub Repository (Optional)

For better discoverability:

1. Create repository on GitHub: https://github.com/new
2. Name: `gravity-core`
3. Add description: "AI-powered CSS layout diagnostics for any IDE"
4. Initialize with README
5. Push code:

```bash
git init
git add .
git commit -m "Initial commit: Gravity npm package"
git branch -M main
git remote add origin https://github.com/[username]/gravity-core.git
git push -u origin main
```

6. Update `package.json` repository URL:
```json
"repository": {
  "type": "git",
  "url": "https://github.com/[username]/gravity-core.git"
}
```

7. Republish:
```bash
npm publish
```

## 🏷️ Step 9: Add Tags (Optional)

Add git tags for releases:

```bash
git tag -a v1.0.1 -m "Release version 1.0.1"
git push origin v1.0.1
```

## 📢 Step 10: Announce (Optional)

Share your package:

1. **npm Registry** - Already published
2. **GitHub** - Create release
3. **Twitter/X** - Tweet about it
4. **Dev.to** - Write a blog post
5. **Reddit** - Share on r/javascript
6. **Hacker News** - Submit to Show HN
7. **awesome-mcp-servers** - Add to list

## 🔐 Security: Two-Factor Authentication

For added security, enable 2FA on npm:

```bash
npm profile enable-2fa auth-and-writes
```

This requires 2FA for publishing.

## 🐛 Troubleshooting

### "Package name already exists"
- Choose a different name
- Or use a scoped package: `@your-org/package-name`

### "You do not have permission to publish"
- Make sure you're logged in: `npm whoami`
- Check package name isn't taken
- Verify you own the scoped namespace

### "dist folder not found"
- Run `npm run build` first
- Check `tsconfig.json` output directory

### "Missing required fields"
- Ensure `package.json` has: name, version, description
- Add LICENSE file
- Add README.md

### "Authentication failed"
- Run `npm logout` then `npm login` again
- Check npm credentials
- Verify 2FA if enabled

## 📊 After Publishing

### Monitor Package

Check downloads and stats:
- https://www.npmjs.com/package/gravity-core/stats

### Update Package

To publish updates:

1. Make changes to code
2. Update version: `npm version patch`
3. Rebuild: `npm run build`
4. Publish: `npm publish`

### Deprecate Old Versions

If needed, deprecate old versions:

```bash
npm deprecate gravity-core@1.0.1 "Use version 1.1.0 instead"
```

## 📋 Publishing Checklist

- [ ] npm account created
- [ ] Logged in to npm (`npm login`)
- [ ] `package.json` configured correctly
- [ ] Version number set (1.0.1)
- [ ] `npm run build` successful
- [ ] `dist/` folder has all files
- [ ] LICENSE file created
- [ ] README.md in package folder
- [ ] SETUP.md in package folder
- [ ] `.npmignore` created (optional)
- [ ] `npm publish` successful
- [ ] Package visible on npm registry
- [ ] Installation works: `npm install gravity-core`
- [ ] CLI works: `npx gravity-core`

## 🎉 You're Published!

Your package is now available to the world!

Users can install with:
```bash
npm install gravity-core
```

## 📚 Next Steps

1. **Monitor** - Check npm stats and feedback
2. **Improve** - Fix bugs and add features
3. **Document** - Keep docs up to date
4. **Promote** - Share with community
5. **Maintain** - Respond to issues

## 🔗 Useful Links

- **npm Registry**: https://www.npmjs.com/package/gravity-core
- **npm Docs**: https://docs.npmjs.com/
- **Semantic Versioning**: https://semver.org/
- **npm CLI**: https://docs.npmjs.com/cli/

---

**Congratulations on publishing your package! 🎉**
