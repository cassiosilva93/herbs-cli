const generator = require('../generators')
const fs = require('fs')
const { system } = require('gluegun')
const inquirer = require('inquirer')
const checkNewVersion = require('../generators/check-version')

function isEmpty(obj) {
  return Object.keys(obj).length === 0
}

const username = require('git-user-name')
const questions = [
  {
    type: 'input',
    name: 'name',
    message: 'Project name?',
    filter(val) {
      return val.toLowerCase()
    },
    default: 'herbs-project',
  },
  {
    type: 'input',
    name: 'description',
    message: 'Project description?',
    filter(val) {
      return val.toLowerCase()
    },
    default: 'Project generated by herbs-cli',
  },
  {
    type: 'input',
    name: 'author',
    message: "Project author's name?",
    filter(val) {
      return val.toLowerCase()
    },
    default: username ? username() : 'Herbs CLI',
  },
  {
    type: 'list',
    name: 'license',
    message: 'What license do you want to use?',
    choices: ['MIT', 'BSD', 'GNU'],
    default: '',
  },
  {
    type: 'confirm',
    name: 'graphql',
    message: 'Generate graphql layer?',
    default: true,
  },
  {
    type: 'confirm',
    name: 'rest',
    message: 'Generate rest layer?',
    default: true,
  },
  {
    type: 'list',
    name: 'database',
    message: 'What database do you want to use?',
    choices: ['Postgres', 'Mongo', 'SQLServer', 'MySQL'],
    default: 'Postgres',
    filter(val) {
      return val.toLowerCase()
    },
  },
  {
    type: 'confirm',
    name: 'git',
    message: 'Do you want to initialize a Git repository?',
    default: false,
  },
]

const cmd = {
  name: 'new',
  description: 'Create a new back-end structure based on pre defined entities',
  alias: ['n'],
  run: async (toolbox) => {
    let { options } = toolbox.parameters
    if (isEmpty(options)) {
      options = await inquirer.prompt(questions)
      options.postgres = options.database === 'postgres'
      options.mongo = options.database === 'mongo'
      options.sqlserver = options.database === 'sqlserver'
      options.mysql = options.database === 'mysql'
    }

    const dir = `${toolbox.filesystem.cwd()}/${options.name}`
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    process.chdir(dir)
    toolbox.parameters.options = options
    const generators = (await generator(toolbox)).new
    for (const layer of Object.keys(generators)) {
      await generators[layer]()
    }
    const nextstep = `
    A initial Herbs project was created! 🤩
    You are ready to unlock your domain! 🌿

    Next steps:

    $ cd ${options.name}
    $ npm install
    $ herbs update
    $ npm start
        `
    toolbox.print.success(nextstep)

    let npmOptions = options
    if (options?.npmInstall == undefined) {
      npmOptions = await inquirer.prompt([
        {
          type: 'list',
          name: 'npmInstall',
          message: 'Run it now?',
          choices: ['Yeah, please', 'No, let me handle this'],
          default: 'Yeah, please',
        },
      ])
    }

    async function exec(cmd) {
      toolbox.print.info(`${cmd}: running...`)
      try {
        await system.run(cmd)
        toolbox.print.info(`${cmd}: ok`)
      } catch (error) {
        toolbox.print.info(`${cmd} output:`, error.stdout)
        toolbox.print.info(`Exit code:`, error.code)
      }
    }

    if (npmOptions.npmInstall === 'Yeah, please' || npmOptions.npmInstall === 'yes') {
      await exec('npm install')    
      await exec('herbs update')
     
    }
    await checkNewVersion()
  },
}

module.exports = cmd
