#!/usr/bin/env node
const meow = require('meow')
const ghch = require('./ghch').default

const cli = meow(
  `
	Usage
    $ ghch <options>

	Options
    --github-token=<token>       Github API Token, must have repository scope
    --clubhouse-token=<token>    Clubhouse API Token
    --github-repo=<name>         Github repository name, e.g. frontend (Do not include Datasembly/)
    --clubhouse-project=<id>     ID of Clubhouse Project to import issues into
    --state=<open|closed|all>    Github issue state to import
    --label=<label>              Github label to import

	Examples
    $ ghch --state=open --label=migrate --github-repo=frontend --clubhouse-project=4 --github-token=xxx --clubhouse-token=xxx
`,
  {
    flags: {
      githubToken: {
        type: 'string',
      },
      clubhouseToken: {
        type: 'string',
      },
      githubRepo: {
        type: 'string',
      },
      clubhouseProject: {
        type: 'string',
      },
      state: {
        type: 'string',
        default: 'open',
      },
      label: {
        type: 'string'
      },
    },
  }
)

ghch(cli.flags)
