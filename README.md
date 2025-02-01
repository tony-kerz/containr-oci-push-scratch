# containr-scratch

sample application which uses the [@watchmen/containr](https://www.npmjs.com/package/@watchmen/containr) package

[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## local **os**

### test

```
npm test
```

### run

```
npm start
```

## local **container**

can run on local os, but if target runtime is containerized (eg k8s), beneficial to also verify behavior in container locally

### test

```
npm run test-container
```

### run

#### compose

```
docker compose up --build
```

> may require restart for certain changes (eg dependencies in package.json)

#### docker

```
docker build \
    --tag {name} \
    --progress=plain \
    --target=dev \
    .
```

```
docker run \
    --rm \
    --publish 3000:3000 \
    --volume ./src:/app/src \
    --volume ./config:/app/config \
    {name}
```

> above is generalized, for this particular case, need below:

```
docker run \
    --rm \
    -e IS_LOCAL=true \
    -e DEBUG=dbg:\* \
    -e OCI_IMAGE=ttl.sh/oci-scratch:1.0.0 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    containr-scratch
```

### build

```
npm run build
```
