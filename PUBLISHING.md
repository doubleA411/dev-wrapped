# Publishing to NPM

## Step 1: Login to npm

```bash
npm login
```

Enter your npm username, password, and email when prompted.

## Step 2: Update Repository URL (Optional)

If you have a GitHub repository, update the URL in `package.json`:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/YOUR_USERNAME/wrap-it.git"
}
```

## Step 3: Test the Package Locally

```bash
# Build
npm run build

# Test locally
npm link
cd /path/to/test/repo
wrap-it

# Unlink when done
npm unlink -g wrap-it
```

## Step 4: Check Package Contents

```bash
npm pack --dry-run
```

This shows what will be included in the published package.

## Step 5: Publish

```bash
npm publish
```

## After Publishing

Users can install with:

```bash
# Global installation
npm install -g wrap-it

# Or use with npx
npx wrap-it
```

## Alternative Package Names

If `wrap-it` is taken, you can:
1. Use a scoped package: `@yourusername/wrap-it`
2. Try alternative names: `dev-wrapped`, `git-wrapped`, `year-wrapped`, etc.

To publish a scoped package:

```bash
# Make it public (scoped packages are private by default)
npm publish --access public
```

## Update Version

For future updates:

```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
npm publish
```

