import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import * as fs from 'fs'
import * as path from 'path'
import { SocialPreviewTemplate } from './template.js'
import type { RepoData } from './github.js'

const IMAGE_WIDTH = 1280
const IMAGE_HEIGHT = 640

// Cache for loaded assets
let cachedLogo: string | null = null
let cachedLogoFull: string | null = null
let cachedCalvin: string | null = null
let cachedFont: ArrayBuffer | null = null

function loadImageAsBase64(imagePath: string): string {
  const absolutePath = path.resolve(imagePath)
  const buffer = fs.readFileSync(absolutePath)
  const ext = path.extname(imagePath).toLowerCase()
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg'
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

function getAssetsDir(): string {
  // When running from dist, assets are in the parent directory
  const distPath = path.join(__dirname, '..', 'assets')
  if (fs.existsSync(distPath)) {
    return distPath
  }
  // When running from src during development
  const srcPath = path.join(__dirname, '..', '..', 'assets')
  if (fs.existsSync(srcPath)) {
    return srcPath
  }
  throw new Error('Assets directory not found')
}

async function loadFont(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont

  // Fetch Inter font from Google Fonts
  const fontUrl =
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff'

  const response = await fetch(fontUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch font: ${response.statusText}`)
  }

  cachedFont = await response.arrayBuffer()
  return cachedFont
}

function loadAssets(): { logo: string; logoFull: string; calvin: string } {
  if (cachedLogo && cachedLogoFull && cachedCalvin) {
    return { logo: cachedLogo, logoFull: cachedLogoFull, calvin: cachedCalvin }
  }

  const assetsDir = getAssetsDir()
  cachedLogo = loadImageAsBase64(path.join(assetsDir, 'logo.png'))
  cachedLogoFull = loadImageAsBase64(path.join(assetsDir, 'logo-full.png'))
  cachedCalvin = loadImageAsBase64(
    path.join(assetsDir, 'infographic-calvin.png')
  )

  return { logo: cachedLogo, logoFull: cachedLogoFull, calvin: cachedCalvin }
}

export async function generateSocialPreview(repo: RepoData): Promise<Buffer> {
  const font = await loadFont()
  const { logo, logoFull, calvin } = loadAssets()

  const element = SocialPreviewTemplate({
    repo,
    logoBase64: logo,
    logoFullBase64: logoFull,
    calvinBase64: calvin
  })

  const svg = await satori(element, {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    fonts: [
      {
        name: 'Inter',
        data: font,
        weight: 400,
        style: 'normal'
      },
      {
        name: 'Inter',
        data: font,
        weight: 600,
        style: 'normal'
      },
      {
        name: 'Inter',
        data: font,
        weight: 700,
        style: 'normal'
      }
    ]
  })

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: IMAGE_WIDTH
    }
  })

  const pngData = resvg.render()
  return Buffer.from(pngData.asPng())
}

export async function savePreviewToFile(
  repo: RepoData,
  outputPath: string
): Promise<void> {
  const buffer = await generateSocialPreview(repo)
  fs.writeFileSync(outputPath, buffer)
}
