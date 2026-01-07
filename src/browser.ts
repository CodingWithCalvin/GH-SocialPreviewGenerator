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
  if (process.platform === 'win32') {
    return path.join(
      os.homedir(),
      'AppData',
      'Local',
      'Microsoft',
      'Edge',
      'User Data'
    )
  } else if (process.platform === 'darwin') {
    return path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'Microsoft Edge'
    )
  } else {
    return path.join(os.homedir(), '.config', 'microsoft-edge')
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
    headless: false, // Need to be visible for user to see progress
    defaultViewport: null,
    args: ['--no-first-run', '--no-default-browser-check']
  })

  try {
    const page = await browser.newPage()

    // Navigate to repo settings
    const settingsUrl = `https://github.com/${owner}/${repo}/settings`
    await page.goto(settingsUrl, { waitUntil: 'networkidle2' })

    // Wait for the page to load and find the social preview section
    // The "Edit" button is in the Social preview section
    await page.waitForSelector('details-dialog input[type="file"]', {
      timeout: 10000
    })

    // Find and click the Edit button for social preview
    const editButton = await page.$('button[aria-label="Edit social preview"]')
    if (editButton) {
      await editButton.click()
      await page.waitForSelector('input[type="file"]', {
        visible: true,
        timeout: 5000
      })
    }

    // Upload the file
    const fileInput = await page.$('input[type="file"]')
    if (!fileInput) {
      throw new Error('Could not find file input for social preview upload')
    }

    await fileInput.uploadFile(imagePath)

    // Wait for upload to process
    await delay(2000)

    // Click the Save/Update button
    const saveButton = await page.$(
      'button[type="submit"]:has-text("Save"), button:has-text("Update social preview")'
    )
    if (saveButton) {
      await saveButton.click()
      await delay(2000)
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
    args: ['--no-first-run', '--no-default-browser-check']
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

        // Wait for page to be ready
        await page.waitForSelector('main', { timeout: 10000 })

        // Scroll to social preview section if needed
        await page.evaluate(() => {
          const heading = Array.from(
            document.querySelectorAll('h2, h3, label')
          ).find(el => el.textContent?.includes('Social preview'))
          if (heading) {
            heading.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        })

        await delay(500)

        // Click Edit button if there's a summary/details element
        const editButton = await page.$(
          'button[aria-label="Edit repository image"]'
        )
        if (editButton) {
          await editButton.click()
          await delay(500)
        }

        // Find the file input (might be hidden)
        const fileInput = await page.$('input[type="file"][accept*="image"]')
        if (!fileInput) {
          throw new Error('Could not find file input')
        }

        // Upload the file
        await fileInput.uploadFile(imagePath)

        // Wait for upload to complete
        await delay(3000)

        // Look for and click save/submit button
        const buttons = await page.$$(
          'button[type="submit"], button[type="button"]'
        )
        for (const button of buttons) {
          const text = await button.evaluate(
            el => el.textContent?.toLowerCase() || ''
          )
          if (text.includes('save') || text.includes('update')) {
            await button.click()
            break
          }
        }

        await delay(2000)
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
