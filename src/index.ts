#!/usr/bin/env node

import { Command } from 'commander'
import { GitHubClient } from './github.js'
import { generateSocialPreview, savePreviewToFile } from './generator.js'

const program = new Command()

program
  .name('social-preview')
  .description(
    'Generate branded social preview images for CodingWithCalvin repositories'
  )
  .version('1.0.0')

program
  .command('generate')
  .description('Generate and upload social preview for a single repository')
  .argument('<owner>', 'Repository owner (org or user)')
  .argument('<repo>', 'Repository name')
  .option('-t, --token <token>', 'GitHub token (or use GITHUB_TOKEN env var)')
  .option('-d, --dry-run', 'Generate image locally without uploading', false)
  .option(
    '-o, --output <path>',
    'Output path for dry-run (default: <repo>.png)'
  )
  .action(async (owner: string, repo: string, options) => {
    const token = options.token || process.env.GITHUB_TOKEN

    if (!token && !options.dryRun) {
      console.error(
        'Error: GitHub token required. Use --token or set GITHUB_TOKEN env var.'
      )
      process.exit(1)
    }

    try {
      console.log(`Generating social preview for ${owner}/${repo}...`)

      const client = new GitHubClient(token || '')
      const repoData = await client.fetchRepoData(owner, repo)

      console.log(`  Name: ${repoData.name}`)
      console.log(`  Stars: ${repoData.stargazersCount}`)
      console.log(`  Description: ${repoData.description || '(none)'}`)

      if (options.dryRun) {
        const outputPath = options.output || `${repo}.png`
        await savePreviewToFile(repoData, outputPath)
        console.log(`  Saved to: ${outputPath}`)
      } else {
        const imageBuffer = await generateSocialPreview(repoData)
        await client.uploadSocialPreview(owner, repo, imageBuffer)
        console.log('  Uploaded successfully!')
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`)
      process.exit(1)
    }
  })

program
  .command('generate-all')
  .description(
    'Generate and upload social previews for all repositories in an org'
  )
  .argument('<owner>', 'Organization or user name')
  .option('-t, --token <token>', 'GitHub token (or use GITHUB_TOKEN env var)')
  .option('-d, --dry-run', 'Generate images locally without uploading', false)
  .option(
    '-o, --output-dir <dir>',
    'Output directory for dry-run (default: ./previews)'
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

      console.log(`Fetching repositories for ${owner}...`)
      const repos = await client.listOrgRepos(owner)
      console.log(`Found ${repos.length} repositories\n`)

      let successCount = 0
      let errorCount = 0

      for (const repo of repos) {
        try {
          console.log(`Processing ${owner}/${repo}...`)
          const repoData = await client.fetchRepoData(owner, repo)

          if (options.dryRun) {
            const outputDir = options.outputDir || './previews'
            const { mkdir } = await import('fs/promises')
            await mkdir(outputDir, { recursive: true })
            const outputPath = `${outputDir}/${repo}.png`
            await savePreviewToFile(repoData, outputPath)
            console.log(`  Saved to: ${outputPath}`)
          } else {
            const imageBuffer = await generateSocialPreview(repoData)
            await client.uploadSocialPreview(owner, repo, imageBuffer)
            console.log('  Uploaded!')
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
        `\nCompleted: ${successCount} successful, ${errorCount} failed`
      )

      if (errorCount > 0) {
        process.exit(1)
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`)
      process.exit(1)
    }
  })

program.parse()
