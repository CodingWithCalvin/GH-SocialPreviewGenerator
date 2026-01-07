#!/usr/bin/env node

import { Command } from 'commander'
import { GitHubClient } from './github.js'
import { savePreviewToFile } from './generator.js'
import {
  uploadSocialPreviewViaBrowser,
  uploadAllViaBrowser
} from './browser.js'

const program = new Command()

program
  .name('social-preview')
  .description(
    'Generate branded social preview images for CodingWithCalvin repositories'
  )
  .version('1.0.0')

program
  .command('generate')
  .description('Generate social preview for a single repository')
  .argument('<owner>', 'Repository owner (org or user)')
  .argument('<repo>', 'Repository name')
  .option('-t, --token <token>', 'GitHub token (or use GITHUB_TOKEN env var)')
  .option(
    '-u, --upload',
    'Upload via browser (uses your logged-in Edge session)',
    false
  )
  .option('-o, --output <path>', 'Output path for image (default: <repo>.png)')
  .action(async (owner: string, repo: string, options) => {
    const token = options.token || process.env.GITHUB_TOKEN

    if (!token) {
      console.error(
        'Error: GitHub token required. Use --token or set GITHUB_TOKEN env var.'
      )
      process.exit(1)
    }

    try {
      console.log(`Generating social preview for ${owner}/${repo}...`)

      const client = new GitHubClient(token)
      const repoData = await client.fetchRepoData(owner, repo)

      console.log(`  Name: ${repoData.name}`)
      console.log(`  Stars: ${repoData.stargazersCount}`)
      console.log(`  Description: ${repoData.description || '(none)'}`)

      const outputPath = options.output || `${repo}.png`
      await savePreviewToFile(repoData, outputPath)
      console.log(`  Saved to: ${outputPath}`)

      if (options.upload) {
        console.log('  Uploading via browser...')
        const absolutePath = await import('path').then(p =>
          p.resolve(outputPath)
        )
        await uploadSocialPreviewViaBrowser(owner, repo, absolutePath)
        console.log('  Uploaded successfully!')
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`)
      process.exit(1)
    }
  })

program
  .command('generate-all')
  .description('Generate social previews for all repositories in an org')
  .argument('<owner>', 'Organization or user name')
  .option('-t, --token <token>', 'GitHub token (or use GITHUB_TOKEN env var)')
  .option(
    '-u, --upload',
    'Upload via browser (uses your logged-in Edge session)',
    false
  )
  .option(
    '-o, --output-dir <dir>',
    'Output directory for images (default: ./previews)'
  )
  .action(async (owner: string, options) => {
    const token = options.token || process.env.GITHUB_TOKEN

    if (!token) {
      console.error(
        'Error: GitHub token required. Use --token or set GITHUB_TOKEN env var.'
      )
      process.exit(1)
    }

    try {
      const client = new GitHubClient(token)
      const { mkdir } = await import('fs/promises')
      const path = await import('path')

      console.log(`Fetching repositories for ${owner}...`)
      const repos = await client.listOrgRepos(owner)
      console.log(`Found ${repos.length} repositories\n`)

      const outputDir = options.outputDir || './previews'
      await mkdir(outputDir, { recursive: true })

      const reposToUpload: {
        owner: string
        repo: string
        imagePath: string
      }[] = []
      let successCount = 0
      let errorCount = 0

      // Generate all images first
      for (const repo of repos) {
        try {
          console.log(`Generating ${owner}/${repo}...`)
          const repoData = await client.fetchRepoData(owner, repo)
          const outputPath = `${outputDir}/${repo}.png`
          await savePreviewToFile(repoData, outputPath)
          console.log(`  Saved to: ${outputPath}`)

          if (options.upload) {
            reposToUpload.push({
              owner,
              repo,
              imagePath: path.resolve(outputPath)
            })
          }
          successCount++
        } catch (error) {
          console.error(
            `  Error: ${error instanceof Error ? error.message : error}`
          )
          errorCount++
        }
      }

      console.log(
        `\nGenerated: ${successCount} successful, ${errorCount} failed`
      )

      // Upload via browser if requested
      if (options.upload && reposToUpload.length > 0) {
        console.log(`\nUploading ${reposToUpload.length} images via browser...`)
        console.log('(Edge will open - please do not close it)\n')

        const result = await uploadAllViaBrowser(
          reposToUpload,
          (current, total, repo) => {
            console.log(`Uploading ${current}/${total}: ${repo}...`)
          }
        )

        console.log(
          `\nUploaded: ${result.success} successful, ${result.failed} failed`
        )

        if (result.failed > 0) {
          process.exit(1)
        }
      }

      if (errorCount > 0) {
        process.exit(1)
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`)
      process.exit(1)
    }
  })

program.parse()
