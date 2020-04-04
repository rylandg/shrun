<img alt="npm" src="https://img.shields.io/npm/dw/shrun?style=for-the-badge">

<img alt="GitHub" src="https://img.shields.io/github/license/rylandg/shrun?style=for-the-badge">

<img alt="npm" src="https://img.shields.io/npm/v/shrun?style=for-the-badge">

# shrun

Test CLI commands in isolated docker containers.

![](./shrun.gif)

### Dependencies

Docker is required to run `shrun`

[Install Docker here if you need it](https://download.docker.com/)

## Quickstart

**Add shrun to your project**

```bash
npm install --save-dev shrun
# or for yarn
yarn add --dev shrun
```

**Build the default shrun image**

```bash
npx shrun build <your-cli-command>
```

*depending on how Docker is installed, `sudo` may be necessary*

```bash
sudo -E npx shrun build <your-cli-command>
```

> Note: You will need to replace \<your-cli-command> with your own CLI command. The CLI command is the one registered to "bin" in your package.json

**Create a simple spec**

By default, `shrun` looks for "specs" (CLI tests) in the `<project-root>/specs` directory. Here is an example spec that tests the `echo` command in bash:

`specs/demo.yml`
```yml
---
- test: Test echo (good-path)
  steps:
    -   in: echo "Hello world"
        out: |-
          Hello world
```

Replace or add to this spec to test your specific CLI command. As long as you built the default `shrun` image, it should work out of the box.

For detailed information about writing `shrun` specs, read below `<REPLACE ME WITH LINK>`.

**Run the demo.yml spec**

```bash
npx shrun
```

*sudo version*

```bash
sudo -E npx shrun
```