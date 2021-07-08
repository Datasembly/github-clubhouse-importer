const { Octokit } = require('@octokit/rest')
const Clubhouse = require('clubhouse-lib')
const chalk = require('chalk')

const log = console.log

async function fetchGithubIssues(options) {
  const octokit = new Octokit({
    auth: options.githubToken,
  })

  const repo = options.githubRepo
  const owner = 'Datasembly'
  const label = options.label
  const q = `label:"${label}"+state:open+org:${owner}+repo:${owner}/${repo}`

  log(chalk.green(`Constructed search query: ${q}`))

  const { data: data } = await octokit.rest.search.issuesAndPullRequests({
    q,
    per_page: 10,
  })
  return data
}

function importIssuesToClubhouse(issues, options) {
  const clubhouse = Clubhouse.create(options.clubhouseToken)
  return clubhouse
    .getProject(options.clubhouseProject)
    .then((project) => {
      let issuesImported = 0
      return Promise.all(
        issues.map(
          ({ created_at, updated_at, labels, title, body, html_url }) => {
            const story_type = getStoryType(labels)
            return reflect(
              clubhouse
                .createStory({
                  created_at,
                  updated_at,
                  story_type,
                  name: title,
                  description: body,
                  external_id: html_url,
                  external_links: [html_url],
                  project_id: project.id,
                })
                .then(() => (issuesImported = issuesImported + 1))
                .catch(() => {
                  log(chalk.red(`Failed to import issue #${issue.number}`))
                })
            )
          }
        )
      ).then(() => {
        return issuesImported
      })
    })
    .catch(() => {
      log(
        chalk.red(
          `Clubhouse Project ID ${options.clubhouseProject} could not be found`
        )
      )
    })
}

const githubClubhouseImport = async (options) => {
  validateOptions(options)

  const issues = await fetchGithubIssues(options)
  log(`Retrieved ${chalk.bold(issues.total_count)} issues from Github`)

  log(`Importing issues to Clubhouse`)
  importIssuesToClubhouse(issues.items, options)
}

const validateOptions = (options) => {
  let hasError = false
  if (!options.githubToken) {
    hasError = true
    log(chalk.red(`Usage: ${chalk.bold('--github-token')} arg is required`))
  }

  if (!options.clubhouseToken) {
    hasError = true
    log(chalk.red(`Usage: ${chalk.bold('--clubhouse-token')} arg is required`))
  }

  if (!options.clubhouseProject) {
    hasError = true
    log(
      chalk.red(`Usage: ${chalk.bold('--clubhouse-project')} arg is required`)
    )
  }

  if (!options.githubRepo) {
    hasError = true
    log(chalk.red(`Usage: ${chalk.bold('--github-repo')} arg is required`))
  }

  if (!options.label) {
    hasError = true
    log(chalk.red(`Usage: ${chalk.bold('--label')} arg is required`))
  }

  if (!['open', 'closed', 'all'].includes(options.state.toLowerCase())) {
    hasError = true
    log(
      chalk.red(
        `Usage: ${chalk.bold('--state')} must be one of open | closed | all`
      )
    )
  }

  if (hasError) {
    log()
    process.exit(1)
  }
}

function getStoryType(labels) {
  if (labels.find((label) => label.name.includes('bug'))) return 'bug'
  if (labels.find((label) => label.name.includes('chore'))) return 'chore'
  return 'feature'
}

const reflect = (p) =>
  p.then(
    (v) => ({ v, status: 'fulfilled' }),
    (e) => ({ e, status: 'rejected' })
  )

module.exports.default = githubClubhouseImport
