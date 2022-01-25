require('dotenv').config()
const fetch = require('node-fetch')

class VersionCloser {
  constructor () {
    this.redmineApiKey = process.env.REDMINE_API_KEY
    this.redmineApiUrl = process.env.REDMINE_API_URL
    this.projectName = process.env.REDMINE_PROJECT_NAME
  }

  async run () {
    const versions = await this.fetchVersions()
    for (const version of versions) {
      const issues = await this.fetchIssues(version)
      if (issues.length === 0) {
        try {
          await this.terminateVersion(version)
          console.info(`Success terminate version ${version.name}`)
        } catch (e) {
          console.error(`Fail terminate version ${version.name}: ${e.message}`)
        }
      }
    }
  }

  async fetchVersions () {
    return fetch(
      `${this.redmineApiUrl}/projects/${this.projectName}/versions.json`,
      {
        headers: {
          'X-Redmine-API-Key': this.redmineApiKey
        }
      }
    )
      .then((res) => res.json())
      .then((data) =>
        data.versions.filter((version) => version.status === 'open')
      )
  }

  async fetchIssues (version) {
    return fetch(
      `${this.redmineApiUrl}/issues.json?fixed_version_id=${version.id}`,
      {
        headers: {
          'X-Redmine-API-Key': this.redmineApiKey
        }
      }
    )
      .then((res) => res.json())
      .then((data) => data.issues)
  }

  async terminateVersion (version) {
    return fetch(`${this.redmineApiUrl}/versions/${version.id}.json`, {
      headers: {
        'X-Redmine-API-Key': this.redmineApiKey,
        'Content-Type': 'application/json'
      },
      method: 'PUT',
      body: JSON.stringify({
        version: {
          status: 'closed'
        }
      })
    }).then((res) => {
      if (res.status !== 200) {
        throw new Error(`response status ${res.status}`)
      }
    })
  }
}

new VersionCloser().run()
