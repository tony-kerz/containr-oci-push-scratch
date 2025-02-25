const home = process.env.HOME

module.exports = {
  containr: {
    images: {
      oras: {
        name: 'ghcr.io/oras-project/oras:v1.2.2',
        entrypoint: 'sh',
        // docker login required before running, and...
        // home needed to pick up registry login creds
        //
        volumes: {[home]: home},
        env: {HOME: home},
      },
      git: {
        name: 'alpine/git:v2.47.1',
        entrypoint: 'ash',
      },
    },
    work: {
      isCwd: true,
    },
  },
  output: 'out.json',
}
