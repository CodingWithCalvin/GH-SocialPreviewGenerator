# 🖼️ GH-SocialPreviewGenerator

> ✨ Automagically generate stunning social preview images for all your GitHub repositories!

Give every repo in your organization a polished, branded first impression. No more boring auto-generated previews!

## 🎨 What It Does

This CLI tool generates beautiful **1280x640** social preview images featuring:

- 📊 **Live Stats** - Stars, forks, commits, and contributors
- 📝 **Repo Info** - Name, description, and topics as hashtags
- 🔗 **Full URL** - Easy to find your project
- 🎭 **Custom Branding** - Your logo and mascot
- 🌊 **Watermark Background** - Subtle branded backdrop

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Generate a preview (dry run)
node dist/index.js generate CodingWithCalvin MyAwesomeRepo --dry-run

# Generate and upload to GitHub
node dist/index.js generate CodingWithCalvin MyAwesomeRepo --token ghp_xxx
```

## 📖 Usage

### Single Repository

```bash
# Generate and upload
node dist/index.js generate <owner> <repo> --token ghp_xxx

# Dry run (save locally without uploading)
node dist/index.js generate <owner> <repo> --dry-run

# Specify output path
node dist/index.js generate <owner> <repo> --dry-run --output preview.png
```

### All Repositories in Org 🏢

```bash
# Generate and upload all public repos
node dist/index.js generate-all <owner> --token ghp_xxx

# Dry run all
node dist/index.js generate-all <owner> --dry-run --output-dir ./previews
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub token (alternative to `--token` flag) |

### Token Permissions 🔐

Your GitHub token needs the `admin:repo` scope to upload social previews.

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run all checks (format, lint, test, build)
npm run all
```

## 🤖 Automated Updates

A weekly workflow runs every **Sunday at midnight UTC** to refresh all social previews across the organization - keeping your stats up to date!

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

Made with 💙 by [Coding With Calvin](https://codingwithcalvin.net)
