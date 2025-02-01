import assert from 'node:assert'
import config from 'config'
import _ from 'lodash'
import debug from '@watchmen/debug'
import {withImages} from '@watchmen/containr'
import {stringify} from '@watchmen/helpr'
import {getUid, toParams} from '@watchmen/containr/util'

const dbg = debug(import.meta.url)

async function main() {
  // this example represents a scenario where the current directory
  // is the work directory and it's assumed to be populated with files of interest
  // think a git-hub-action work folder after a checkout action has been performed
  //

  const user = await getUid()

  const images = config.containr.images

  dbg('images=%o', images)

  // identifying the src folder and package.json file to be packaged and pushed
  //
  const targets = ['src', 'package.json']

  await withImages({
    images,

    async closure(withContainer) {
      // these steps here prior to the push are arbitrary in this example,
      // but they could be important pre-requisites to the push like
      // traditional ci steps where the push would only occur if they succeed...
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

      const annotations = {foo: 'bar'}

      await withOras({
        user,
        input: `oras push ${toParams({map: annotations, param: '--annotation'})} ${image} ${targets.join(':  ')} `,
        env: {HOME: process.env.HOME},
      })
    },
  })
}

await main()
