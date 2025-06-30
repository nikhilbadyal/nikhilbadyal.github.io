#!/usr/bin/env node

/**
 * Simple build script for portfolio website
 * This script can be used to combine and optimize files for production
 */

const fs = require("fs")
const path = require("path")

const BUILD_DIR = "dist"
const SOURCE_FILES = [
  "index.html",
  "assets/css/style.css",
  "assets/css/improvements.css",
  "assets/js/script.js",
  "assets/js/data-loader.js",
  "data/portfolio.json",
  "data/blog.json",
  "data/resume.json"
]

/**
 * Create build directory if it doesn't exist
 */
function createBuildDir() {
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true })
    console.log(`✅ Created ${BUILD_DIR} directory`)
  }
}

/**
 * Copy files to build directory
 */
function copyFiles() {
  SOURCE_FILES.forEach((file) => {
    if (fs.existsSync(file)) {
      const destPath = path.join(BUILD_DIR, file)
      const destDir = path.dirname(destPath)

      // Create destination directory if it doesn't exist
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }

      fs.copyFileSync(file, destPath)
      console.log(`✅ Copied ${file} to ${destPath}`)
    } else {
      console.log(`⚠️  File not found: ${file}`)
    }
  })
}

/**
 * Copy other assets (images, icons, etc.)
 */
function copyAssets() {
  const assetDirs = ["assets/images", "assets/pdfs"]
  const assetFiles = [
    "favicon.ico",
    "favicon.svg",
    "favicon-96x96.png",
    "apple-touch-icon.png",
    "site.webmanifest",
    "CNAME"
  ]

  // Copy asset directories
  assetDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      const destDir = path.join(BUILD_DIR, dir)
      fs.mkdirSync(destDir, { recursive: true })

      const files = fs.readdirSync(dir)
      files.forEach((file) => {
        const srcPath = path.join(dir, file)
        const destPath = path.join(destDir, file)

        if (fs.statSync(srcPath).isFile()) {
          fs.copyFileSync(srcPath, destPath)
        }
      })

      console.log(`✅ Copied ${dir} directory`)
    }
  })

  // Copy individual asset files
  assetFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(BUILD_DIR, file))
      console.log(`✅ Copied ${file}`)
    }
  })
}

/**
 * Optimize JSON files (minify)
 */
function optimizeJSON() {
  const jsonFiles = ["data/portfolio.json", "data/resume.json"]

  jsonFiles.forEach((file) => {
    const srcPath = file
    const destPath = path.join(BUILD_DIR, file)

    if (fs.existsSync(srcPath)) {
      const data = JSON.parse(fs.readFileSync(srcPath, "utf8"))
      fs.writeFileSync(destPath, JSON.stringify(data, null, 0))
      console.log(`✅ Optimized ${file}`)
    }
  })
}

/**
 * Main build function
 */
function build() {
  console.log("🚀 Starting build process...\n")

  try {
    createBuildDir()
    copyFiles()
    copyAssets()
    optimizeJSON()

    console.log("\n✅ Build completed successfully!")
    console.log(`📁 Output directory: ${BUILD_DIR}`)
  } catch (error) {
    console.error("❌ Build failed:", error.message)
    process.exit(1)
  }
}

// Run build if this script is executed directly
if (require.main === module) {
  build()
}

module.exports = { build }
