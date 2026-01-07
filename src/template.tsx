import type { RepoData } from './github.js'

// Brand colors
const COLORS = {
  blue: '#3B8DBD',
  orange: '#F5A623',
  gray: '#6D6E71',
  white: '#FFFFFF',
  lightGray: '#F5F5F5'
}

interface TemplateProps {
  repo: RepoData
  logoBase64: string
  logoFullBase64: string
  calvinBase64: string
}

function formatNumber(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

function truncateDescription(desc: string | null, maxLength = 120): string {
  if (!desc) return 'A CodingWithCalvin project'
  if (desc.length <= maxLength) return desc
  return desc.substring(0, maxLength - 3) + '...'
}

export function SocialPreviewTemplate({
  repo,
  logoFullBase64,
  calvinBase64
}: TemplateProps) {
  const repoUrl = `https://www.github.com/${repo.owner}/${repo.name}`

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.white,
        fontFamily: 'Inter, sans-serif',
        position: 'relative'
      }}>
      {/* Background Watermark Logo */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: 0,
          left: '500px',
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 0.08
        }}>
        <img src={logoFullBase64} width={650} height={338} />
      </div>

      {/* Left Stats Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: COLORS.blue,
          padding: '30px 25px',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '40px',
          width: '120px'
        }}>
        {/* Stars */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}>
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="#FFD700"
            style={{ flexShrink: 0 }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span
            style={{ color: COLORS.white, fontSize: '32px', fontWeight: 800 }}>
            {formatNumber(repo.stargazersCount)}
          </span>
        </div>

        {/* Forks */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}>
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke={COLORS.white}
            strokeWidth="2"
            style={{ flexShrink: 0 }}>
            <circle cx="5" cy="6" r="2" />
            <circle cx="19" cy="6" r="2" />
            <circle cx="12" cy="20" r="2" />
            <path d="M5 8v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M12 14v4" />
          </svg>
          <span
            style={{ color: COLORS.white, fontSize: '32px', fontWeight: 800 }}>
            {formatNumber(repo.forksCount)}
          </span>
        </div>

        {/* Commits */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}>
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke={COLORS.white}
            strokeWidth="2"
            style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v6m0 8v6" />
          </svg>
          <span
            style={{ color: COLORS.white, fontSize: '32px', fontWeight: 800 }}>
            {formatNumber(repo.commitsCount)}
          </span>
        </div>

        {/* Contributors */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}>
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke={COLORS.white}
            strokeWidth="2"
            style={{ flexShrink: 0 }}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span
            style={{ color: COLORS.white, fontSize: '32px', fontWeight: 800 }}>
            {formatNumber(repo.contributorsCount)}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}>
        {/* Body */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            padding: '30px 30px 0',
            alignItems: 'stretch'
          }}>
          {/* Calvin Avatar */}
          <div
            style={{
              display: 'flex',
              width: '400px',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            <img src={calvinBase64} width={380} height={475} />
          </div>

          {/* Repo Info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              paddingLeft: '20px',
              paddingTop: '20px'
            }}>
            {/* Repo Name */}
            <span
              style={{
                color: COLORS.blue,
                fontSize: '58px',
                fontWeight: 900,
                lineHeight: 1.1
              }}>
              {repo.name}
            </span>

            {/* Blue Divider Line */}
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: COLORS.blue,
                marginTop: '16px',
                borderRadius: '2px'
              }}
            />

            {/* Description */}
            <span
              style={{
                color: COLORS.gray,
                fontSize: '26px',
                lineHeight: 1.5,
                marginTop: '16px'
              }}>
              {truncateDescription(repo.description, 200)}
            </span>
          </div>
        </div>

        {/* Footer - Hashtags and URL */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 30px 25px',
            gap: '12px'
          }}>
          {/* Topics/Labels */}
          {repo.topics.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '16px'
              }}>
              {repo.topics.slice(0, 5).map(topic => (
                <span
                  key={topic}
                  style={{
                    color: COLORS.blue,
                    fontSize: '20px',
                    fontWeight: 600
                  }}>
                  #{topic}
                </span>
              ))}
            </div>
          )}

          {/* URL */}
          <span
            style={{
              color: COLORS.orange,
              fontSize: '32px',
              fontWeight: 900
            }}>
            {repoUrl}
          </span>
        </div>
      </div>
    </div>
  )
}
