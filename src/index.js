import assert from 'node:assert'
import {configr} from '@watchmen/configr'
import _ from 'lodash'
import debug from '@watchmen/debug'
import {withImages} from '@watchmen/containr'
import {pretty} from '@watchmen/helpr'
import {getUid, toFlags} from '@watchmen/containr/util'
import fs from 'fs-extra'

const dbg = debug(import.meta.url)

async function main() {
  // this example represents a scenario where the current directory
  // is the work directory and it's assumed to be populated with files of interest
  // think a git-hub-action work folder after a checkout action has been performed
  //
  const user = await getUid()
  dbg('user=%o', user)

  const images = configr.containr.images
  dbg('images=%o', images)

  dbg('push=%o', configr.push)
  const {path, targets, annotations} = configr.push
  assert(path, 'path required')
  assert(targets, 'targets required')

  const out = configr.output
  dbg('out=%s', out)
  fs.ensureFileSync(out)

  await withImages({
    images,
    user,
    async closure(withContainer) {
      // this example just uses oras to push an oci image, but
      // but important pre-requisites to the push can also be included here
      // such that the push would only occur if they succeed...
      //

      // defining custom with-function not required,
      // just illustrating pattern to enhance code readability
      // when using same image for multiple calls in a code block.
      //
      // can also just call withContainer multiple times passing in same image name
      //
      const withOras = (args) => withContainer({...args, image: 'oras'})

      // this shows that files from container are present
      //
      const oras = await withOras({input: 'which oras'})
      dbg('oras=%s', oras)
      assert(oras, 'oras binary should b on path')

      // this shows that files from work folder (in this case current working directory)
      // are also present
      //
      const _targets = await withOras({input: `ls -la ${targets.join(' ')}`})
      dbg('targets=%s', pretty(_targets))
      assert(_targets, 'target files should b found')

      // pass withContainer into utility function for use there
      //
      const image = await getImageMeta(withContainer)
      dbg('image=%s', pretty(image))
      fs.appendFileSync(out, `image=${image.name}\n`)

      const _annotations = {...annotations, ...image}

      await withOras({
        input: `oras push ${toFlags({map: _annotations, flag: 'annotation'})} ${image.name} ${targets.join(' ')}`,
        env: {HOME: process.env.HOME},
      })
    },
  })
}

await main()

async function getImageMeta(withContainer) {
  // defining custom with-function not required,
  // just illustrating pattern to enhance code readability
  // when using same image for multiple calls in a code block.
  //
  // can also just call withContainer multiple times passing in image name
  //
  const withGit = (args) => withContainer({...args, image: 'git'})

  // this part is not required, just included for illustration
  //
  const git = await withGit({input: 'which git'})
  dbg('git=%s', git)
  assert(git, 'git binary should b on path')

  const id = await withGit({input: 'id -u'})
  dbg('id=%s', id)

  // remote pattern one of:
  // (1) git@github.com:an-org/a-repo.git
  // (2) https://github.com/an-org/a-repo.git
  //
  const remote = await withGit({input: 'git remote get-url origin'})
  dbg('remote=%s', remote)
  assert(remote, 'remote required')

  const re = remote.startsWith('git@')
    ? /^.+:(?<org>.+)\/(?<repo>.+)\.git$/
    : /^.+\/(?<org>.+)\/(?<repo>[^.]+)(?:\.git)?$/

  const match = remote.match(re)
  const repo = match.groups.repo
  assert(repo, `unexpected inability to extract repo from remote=${remote}`)
  const org = match.groups.org
  const path = configr.push.path ?? org
  assert(path, `unexpected inability to extract org from remote=${remote}`)

  const sha = await withGit({input: 'git rev-parse --short HEAD'})
  dbg('sha=%s', sha)
  assert(sha, 'sha required')

  const host = configr.push.host

  return {
    name: `${host}/${path}/${repo}:${sha}`,
    org,
    repo,
    path,
    sha,
    host,
  }
}
