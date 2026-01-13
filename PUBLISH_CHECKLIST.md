# Publishing Checklist - Quick Reference

## ✅ Pre-Publishing Checklist

- [x] npm account created at https://www.npmjs.com/signup
- [x] Verified email address
- [x] Node.js and npm installed
- [x] Logged in to npm: `npm login`
- [x] Verified login: `npm whoami`

## ✅ Package Preparation

- [x] `package/package.json` configured correctly
- [x] Version set to `1.0.1` (or appropriate version)
- [x] `npm run build` runs successfully
- [x] `package/dist/` folder exists with compiled files
- [x] `package/LICENSE` file exists
- [x] `package/README.md` exists
- [x] `package/SETUP.md` exists
- [x] `package/.npmignore` exists

## ✅ Final Verification

```bash
# Navigate to package directory
cd package

# Verify build
npm run build

# Check what will be published
npm pack --dry-run

# Verify files
ls -la dist/
```

## 🚀 Publishing Steps

### Step 1: Navigate to package directory
```bash
cd package
```

### Step 2: Verify you're logged in
```bash
npm whoami
```
Should output your npm username.

### Step 3: Publish to npm
```bash
npm publish --access public
```

### Step 4: Verify publication
```bash
npm view gravity-core
```

Should show package details.

### Step 5: Test installation
```bash
npm install gravity-core
```

Should install from npm registry.

## 📊 Expected Output

When publishing, you should see:
```
npm notice 📦 gravity-core@1.0.1
npm notice === Tarball Contents ===
npm notice 123.4kB dist/index.js
npm notice 45.6kB dist/bridge.js
...
npm notice Publishing to https://registry.npmjs.org/
+ gravity-core@1.0.1
```

## ✅ Post-Publishing Verification

- [ ] Package visible on npm: https://www.npmjs.com/package/gravity-core
- [ ] Installation works: `npm install gravity-core`
- [ ] CLI works: `npx gravity-core`
- [ ] README displays correctly on npm
- [ ] Version shows as 1.0.1

## 🔄 For Future Updates

When publishing updates:

1. Update version:
```bash
npm version patch    # 1.0.1 → 1.0.1
npm version minor    # 1.0.1 → 1.1.0
npm version major    # 1.0.1 → 2.0.0
```

2. Rebuild:
```bash
npm run build
```

3. Publish:
```bash
npm publish
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Not logged in" | Run `npm login` |
| "Package name taken" | Use different name or scoped package |
| "dist folder not found" | Run `npm run build` |
| "Permission denied" | Check npm account permissions |
| "Authentication failed" | Run `npm logout` then `npm login` |

## 📞 Need Help?

- npm Docs: https://docs.npmjs.com/
- npm CLI Help: `npm help publish`
- npm Support: https://www.npmjs.com/support

## 🎉 Success!

Once published, users can install with:
```bash
npm install gravity-core
```

---

**Ready to publish? Follow the steps above!**
