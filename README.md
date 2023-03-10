# bonita-day-demo-2023

TODO explain


## 🎮 Live demo

The live demo is available at ⏩ https://process-analytics.github.io/bonita-day-demo-2023/


## ⚒️ Development Setup

Use the node version declared in [.nvmrc](.nvmrc). You can use a Node version manager like [nvm](https://github.com/nvm-sh/nvm): `nvm use`

Install dependencies: `npm install`

Start the dev server: `npm run dev`

The demo is accessible at http://localhost:5173/

### Code linter

The code should be linted with [xo](https://github.com/xojs/xo). To have support in your favorite IDE, see the [how-to used in IDE](https://github.com/xojs/xo#editor-plugins) documentation. 


## 📃 License

The code of this demo is released under the [Apache 2.0](LICENSE) license.


## Release how-to

When all updates have been completed, you are ready to publish a new release.

Create a new GitHub release by following the [GitHub help](https://help.github.com/en/github/administering-a-repository/managing-releases-in-a-repository#creating-a-release)
- for `Tag version`, use a value following the **vX.Y.Z** scheme using the [Semantic Versioning](https://semver.org/).
- for `Target`
    - usually, keep the `main` branch except if new commits that you don't want to integrate for the release are already
      available in the branch
    - in that case, choose a dedicated commit
- Description
    - briefly explain the contents of the new version
    - make GitHub generates the [release notes automatically](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes)
