import assert from 'node:assert'
import {configr} from '@watchmen/configr'
import _ from 'lodash'
import {execa} from 'execa'
import debug from '@watchmen/debug'
import {withImages} from '@watchmen/containr'
import {pretty} from '@watchmen/helpr'
import {getUid, toParams} from '@watchmen/containr/util'

const dbg = debug(import.meta.url)

async function main() {
  // this example represents a scenario where the current directory
  // is the work directory and it's assumed to be populated with files of interest
  // think a git-hub-action work folder after a checkout action has been performed
  //

  const user = await getUid()

  const images = configr.containr.images
  dbg('images=%o', images)

  dbg('push=%o', configr.push)
  const {path, targets, annotations} = configr.push
  assert(path, 'path required')
  assert(targets, 'targets required')

  await withImages({
    images,

    async closure(withContainer) {
      // this example just uses oras to push an oci image, but
      // but important pre-requisites to the push can also be included here
      // such that the push would only occur if they succeed...
      //
      const withOras = (args) => withContainer({...args, image: 'oras'})

      // this shows that files from container are present
      //
      const which = await withOras({input: 'which oras'})
      dbg('which=%s', which)
      assert(which, 'oras binary should b on path')

      // this shows that files from work folder (in this case current working directory)
      // are also present
      //
      const _targets = await withOras({input: `ls -la ${targets.join(' ')}`})
      dbg('targets=%s', pretty(_targets))
      assert(_targets, 'target files should b found')

      const image = await getImageMeta()
      dbg('image=%s', pretty(image))

      const _annotations = {...annotations, ...image}

      await withOras({
        user,
        input: `oras push ${toParams({map: _annotations, param: '--annotation'})} ${image.name} ${targets.join(' ')}`,
        env: {HOME: process.env.HOME},
      })
    },
  })
}

await main()

async function getImageMeta() {
  // remote one of:
  // (1) git@github.com:tony-kerz/push-scratch.git
  // (2) https://github.com/tony-kerz/push-scratch.git
  //
  const {stdout: remote, stderr: remoteErr} =
    await execa`git remote get-url origin`
  dbg('remote=%s, err=%o', remote, remoteErr)
  assert(remote, 'remote required')

  const re = remote.startsWith('git@')
    ? /^.+:(?<org>.+)\/(?<repo>.+)\.git$/
    : /^.+\/(?<org>.+)\/(?<repo>.+)\.git$/

  const match = remote.match(re)
  const repo = match.groups.repo
  assert(repo, `unexpected inability to extract repo from remote=${remote}`)
  const org = match.groups.org
  const path = configr.push.path ?? org
  assert(path, `unexpected inability to extract org from remote=${remote}`)

  const {stdout: sha, stderr: shaErr} = await execa`git rev-parse --short HEAD`
  dbg('sha=%s, err=%o', sha, shaErr)
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
