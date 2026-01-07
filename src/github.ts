import { Octokit } from '@octokit/rest'

export interface RepoData {
  name: string
  description: string | null
  stargazersCount: number
  forksCount: number
  contributorsCount: number
  commitsCount: number
  topics: string[]
  owner: string
}

export class GitHubClient {
  private octokit: Octokit

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token })
  }

  async fetchRepoData(owner: string, repo: string): Promise<RepoData> {
    const { data } = await this.octokit.repos.get({ owner, repo })

    // Fetch contributors count
    let contributorsCount = 0
    try {
      const contributors = await this.octokit.repos.listContributors({
        owner,
        repo,
        per_page: 1,
        anon: 'false'
      })
      // Get total from Link header or count
      const linkHeader = contributors.headers.link
      if (linkHeader) {
        const match = linkHeader.match(/page=(\d+)>; rel="last"/)
        if (match) {
          contributorsCount = parseInt(match[1], 10)
        }
      } else {
        contributorsCount = contributors.data.length
      }
    } catch {
      contributorsCount = 0
    }

    // Fetch commits count (from default branch)
    let commitsCount = 0
    try {
      const commits = await this.octokit.repos.listCommits({
        owner,
        repo,
        per_page: 1
      })
      const linkHeader = commits.headers.link
      if (linkHeader) {
        const match = linkHeader.match(/page=(\d+)>; rel="last"/)
        if (match) {
          commitsCount = parseInt(match[1], 10)
        }
      } else {
        commitsCount = commits.data.length
      }
    } catch {
      commitsCount = 0
    }

    return {
      name: data.name,
      description: data.description,
      stargazersCount: data.stargazers_count,
      forksCount: data.forks_count,
      contributorsCount,
      commitsCount,
      topics: data.topics || [],
      owner: data.owner.login
    }
  }

  async listOrgRepos(org: string): Promise<string[]> {
    const repos: string[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const { data } = await this.octokit.repos.listForOrg({
        org,
        type: 'public',
        per_page: perPage,
        page
      })

      if (data.length === 0) break

      for (const repo of data) {
        if (!repo.archived) {
          repos.push(repo.name)
        }
      }

      if (data.length < perPage) break
      page++
    }

    return repos.sort()
  }

  async uploadSocialPreview(
    owner: string,
    repo: string,
    imageBuffer: Buffer
  ): Promise<void> {
    // The social preview upload endpoint requires a multipart form upload
    // Using the undocumented but stable endpoint
    await this.octokit.request('PUT /repos/{owner}/{repo}/social-preview', {
      owner,
      repo,
      headers: {
        'content-type': 'image/png'
      },
      data: imageBuffer
    })
  }
}
