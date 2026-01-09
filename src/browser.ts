import puppeteer from 'puppeteer-core'
import * as path from 'path'
import * as os from 'os'

// Helper function to delay execution
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getEdgePath(): string {
  if (process.platform === 'win32') {
    return 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  } else if (process.platform === 'darwin') {
    return '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
  } else {
    return '/usr/bin/microsoft-edge'
  }
}

function getEdgeUserDataDir(): string {
  // Use a dedicated profile directory to avoid WebView2 conflicts
  // Extensions need to be installed once in this profile
  if (process.platform === 'win32') {
    return path.join(
      os.homedir(),
      'AppData',
      'Local',
      'GH-SocialPreviewGenerator',
      'EdgeProfile'
    )
  } else if (process.platform === 'darwin') {
    return path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'GH-SocialPreviewGenerator'
    )
  } else {
    return path.join(os.homedir(), '.config', 'gh-social-preview-generator')
  }
}

export async function uploadSocialPreviewViaBrowser(
  owner: string,
  repo: string,
  imagePath: string
): Promise<void> {
  const browser = await puppeteer.launch({
    executablePath: getEdgePath(),
    userDataDir: getEdgeUserDataDir(),
    headless: false,
    defaultViewport: null,
    args: ['--no-first-run', '--no-default-browser-check'],
    ignoreDefaultArgs: ['--disable-extensions']
  })

  try {
    const page = await browser.newPage()

    // Navigate to repo settings
    const settingsUrl = `https://github.com/${owner}/${repo}/settings`
    await page.goto(settingsUrl, { waitUntil: 'networkidle2' })

    // Check if we're logged in by looking for the settings form
    const settingsForm = await page.$('form[data-turbo="false"], main h2')
    if (!settingsForm) {
      console.log('\n  Please log into GitHub in the browser window...')
      console.log('  (Waiting up to 2 minutes for login)\n')
      await page.waitForSelector('form[data-turbo="false"], main h2', {
        timeout: 120000
      })
    }

    await delay(1000)

    // Scroll down to find Social preview section
    await page.evaluate(() => {
      const labels = document.querySelectorAll('label, h3, summary')
      for (const label of labels) {
        if (label.textContent?.includes('Social preview')) {
          label.scrollIntoView({ behavior: 'smooth', block: 'center' })
          break
        }
      }
    })

    await delay(1000)

    // Click the Edit button or summary to expand the social preview section
    const editClicked = await page.evaluate(() => {
      const summaries = document.querySelectorAll('summary, button')
      for (const el of summaries) {
        if (
          el.textContent?.includes('Edit') &&
          el.closest('[class*="social"]')
        ) {
          ;(el as HTMLElement).click()
          return true
        }
      }
      // Try clicking any Edit button near Social preview text
      const labels = document.querySelectorAll('label, h3')
      for (const label of labels) {
        if (label.textContent?.includes('Social preview')) {
          const parent = label.closest('div')
          const btn = parent?.querySelector('summary, button')
          if (btn) {
            ;(btn as HTMLElement).click()
            return true
          }
        }
      }
      return false
    })

    if (editClicked) {
      await delay(1000)
    }

    // Find the file input (might be hidden, use a more general selector)
    let fileInput = await page.$('input[type="file"]')
    if (!fileInput) {
      // Wait a bit more for it to appear
      await page.waitForSelector('input[type="file"]', { timeout: 5000 })
      fileInput = await page.$('input[type="file"]')
    }

    if (!fileInput) {
      throw new Error('Could not find file input for social preview upload')
    }

    await fileInput.uploadFile(imagePath)
    await delay(3000)

    // Look for and click save button
    const buttons = await page.$$('button[type="submit"], button')
    for (const button of buttons) {
      try {
        const text = await button.evaluate(
          el => el.textContent?.toLowerCase() || ''
        )
        if (text.includes('save') || text.includes('update')) {
          await button.click()
          await delay(2000)
          break
        }
      } catch {
        // Skip buttons that aren't clickable
      }
    }

    await page.close()
  } finally {
    await browser.close()
  }
}

export async function uploadAllViaBrowser(
  repos: { owner: string; repo: string; imagePath: string }[],
  onProgress?: (current: number, total: number, repo: string) => void
): Promise<{ success: number; failed: number }> {
  const browser = await puppeteer.launch({
    executablePath: getEdgePath(),
    userDataDir: getEdgeUserDataDir(),
    headless: false,
    defaultViewport: null,
    args: ['--no-first-run', '--no-default-browser-check'],
    ignoreDefaultArgs: ['--disable-extensions']
  })

  let success = 0
  let failed = 0

  try {
    const page = await browser.newPage()

    for (let i = 0; i < repos.length; i++) {
      const { owner, repo, imagePath } = repos[i]

      if (onProgress) {
        onProgress(i + 1, repos.length, repo)
      }

      try {
        // Navigate to repo settings
        const settingsUrl = `https://github.com/${owner}/${repo}/settings`
        await page.goto(settingsUrl, { waitUntil: 'networkidle2' })

        // Look for the social preview edit button or file input
        // GitHub's settings page has a "Social preview" section with an Edit button

        // Check if we're logged in by looking for the settings form
        const settingsForm = await page.$('form[data-turbo="false"], main h2')
        if (!settingsForm) {
          console.log('\n  Please log into GitHub in the browser window...')
          console.log('  (Waiting up to 2 minutes for login)\n')
          await page.waitForSelector('form[data-turbo="false"], main h2', {
            timeout: 120000
          })
        }

        await delay(1000)

        // Scroll down to find Social preview section
        await page.evaluate(() => {
          const labels = document.querySelectorAll('label, h3, summary')
          for (const label of labels) {
            if (label.textContent?.includes('Social preview')) {
              label.scrollIntoView({ behavior: 'smooth', block: 'center' })
              break
            }
          }
        })

        await delay(1000)

        // Click the Edit button or summary to expand the social preview section
        const editClicked = await page.evaluate(() => {
          const summaries = document.querySelectorAll('summary, button')
          for (const el of summaries) {
            if (
              el.textContent?.includes('Edit') &&
              el.closest('[class*="social"]')
            ) {
              ;(el as HTMLElement).click()
              return true
            }
          }
          // Try clicking any Edit button near Social preview text
          const labels = document.querySelectorAll('label, h3')
          for (const label of labels) {
            if (label.textContent?.includes('Social preview')) {
              const parent = label.closest('div')
              const btn = parent?.querySelector('summary, button')
              if (btn) {
                ;(btn as HTMLElement).click()
                return true
              }
            }
          }
          return false
        })

        if (editClicked) {
          await delay(1000)
        }

        // Find the file input (might be hidden, use a more general selector)
        let fileInput = await page.$('input[type="file"]')
        if (!fileInput) {
          // Wait a bit more for it to appear
          await page.waitForSelector('input[type="file"]', { timeout: 5000 })
          fileInput = await page.$('input[type="file"]')
        }

        if (!fileInput) {
          throw new Error('Could not find file input for social preview upload')
        }

        await fileInput.uploadFile(imagePath)
        await delay(3000)

        // Look for and click save button
        const buttons = await page.$$('button[type="submit"], button')
        for (const button of buttons) {
          try {
            const text = await button.evaluate(
              el => el.textContent?.toLowerCase() || ''
            )
            if (text.includes('save') || text.includes('update')) {
              await button.click()
              await delay(2000)
              break
            }
          } catch {
            // Skip buttons that aren't clickable
          }
        }

        await delay(1000)
        success++
      } catch (error) {
        console.error(
          `  Error uploading to ${owner}/${repo}: ${error instanceof Error ? error.message : error}`
        )
        failed++
      }
    }

    await page.close()
  } finally {
    await browser.close()
  }

  return { success, failed }
}
