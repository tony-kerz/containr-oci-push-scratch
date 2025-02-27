const home = process.env.HOME
const hostCreds = process.env.REGISTRY_CREDS
const creds = `${home}/.docker/config.json`

module.exports = {
  containr: {
    creds: {
      host: hostCreds,
      local: creds,
    },
    images: {
      oras: {
        name: 'ghcr.io/oras-project/oras:v1.2.2',
        entrypoint: 'sh',
        // docker login required before running, and...
        // home needed to pick up registry login creds
        //
        volumes: {
          ...(hostCreds ? {[creds]: hostCreds} : {}),
        },
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
