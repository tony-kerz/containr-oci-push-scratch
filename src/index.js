import assert from 'node:assert'
import config from 'config'
import _ from 'lodash'
import debug from '@watchmen/debug'
import {withImages, withImage} from '@watchmen/containr'
import {stringify} from '@watchmen/helpr'
import {getUid, toParams} from '@watchmen/containr/util'
// import {pushOci} from '@watchmen/containr/oci'

const dbg = debug(import.meta.url)

async function main() {
  // this example represents a scenario where the current directory
  // is the work directory and it's assumed to be populated with files of interest
  // think a git-hub-action work folder after a checkout action has been performed
  //

  const user = await getUid()

  // const images = _.omit(config.containr.images, ['oras'])
  const images = config.containr.images

  dbg('images=%o', images)

  // identifying the src folder and package.json file to be packaged and pushed
  //
  const targets = ['src', 'package.json']

  await withImages({
    images,

    async closure(withContainer) {
      // these steps here prior to the push are arbitrary in this example,
      // but they could be considered important pre-requisites to the push
      // like traditional ci steps where the push would only occur if they succeed...
      //
      const withGcloud = (args) => withContainer({...args, image: 'gcloud'})
      const withOras = (args) => withContainer({...args, image: 'oras'})

      // this shows that files from container are present
      //
      const which = await withGcloud({input: 'which gcloud'})
      dbg('which=%s', which)
      assert(which, 'gcloud binary should b on path')

      // this shows that files from work folder (in this case current working directory)
      // are also present
      //
      const _targets = await withGcloud({input: `ls -la ${targets.join(' ')}`})
      dbg('targets=%s', stringify(_targets))
      assert(_targets, 'target files should b found')

      // call to pushOci could occur after call to withImages instead of in this closure
      // because it handles it's own container interaction vs using behavior of withImages
      // but just placing it here for organization.
      //
      //
      const repo = process.env.GITHUB_REPOSITORY
      // eg tony-kerz/containr-push-scratch
      //
      assert(repo, 'repo required')
      const toks = repo.split('/')
      const _repo = toks[1]
      const tagPath = process.env.CONTAINR_PATH
      assert(tagPath, 'tag-path required')
      const sha = process.env.GITHUB_SHA
      assert(sha, 'sha required')
      const _sha = sha.slice(0, 7)
      const image = `${tagPath}/${_repo}:${_sha}`
      // const {stdout: push, stderr: pushError} = await pushOci({
      //   image: `${tagPath}/${_repo}:${_sha}`,
      //   targets,
      //   user,
      //   annotations: {foo: 'bar'},
      // })
      // const home = process.env.HOME
      // const creds = `${home}/.docker/config.json`
      // dbg('home=%s', home)
      // const volumes = {
      //   '/tmp': '/tmp',
      //   [home]: home,
      // }
      // const env = {
      //   HOME: home,
      // }

      const annotations = {foo: 'bar'}
      // const {stdout: push, stderr: pushError} = await withImage({
      //   image: config.containr.images.oras,
      //   command: `push ${toParams({map: annotations, param: '--annotation'})} ${image} ${targets.join(' ')} `,
      //   volumes,
      //   user,
      //   env,
      // })
      // const tmp = '/tmp'
      await withOras({
        // volumes: {tmp, creds},
        user,
        // input: ['which oras'],
        input: `oras push ${toParams({map: annotations, param: '--annotation'})} ${image} ${targets.join(':  ')} `,
        env: {HOME: process.env.HOME},
      })
      // dbg('push: out=%o, err=%o', push, pushError)
    },
  })
}

await main()
