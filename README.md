# bonita-day-demo-2023

This demo application was created as part of a presentation made during Bonita Day Paris 2023.

Content:
- `none`/`home`: display the BPMN processes used in this demo and navigate to the sub-process which is also part of the demo
- `process-monitoring`: show the happy path of a process, animate the path
- `case-monitoring`:
  - assign a new actor to a task of the sub-process that is late: display the past activities of the actors proposed for replacement (highlight activities and frequency)
  - show the live execution of a "supplier contact" process: highlight running paths and activities, let choose to send email or abort 

`bpmn-visualization` features used in this demo:
- get BPMN elements and register interactions: popovers on both case-monitoring and process-monitoring
- apply CSS and overlays (process-monitoring, case-monitoring sub-process and "Supplier Contact")
- style elements with the `Update Style` API (case-monitoring "Supplier Contact")

**🔥 Stack**:
- TypeScript and [Vite](https://vitejs.dev/)
- Notifications toast: [Notyf](https://carlosroso.com/notyf/)
- Popovers: [tippy.js](https://atomiks.github.io/tippyjs/)
- CSS framework: [Spectre.css](https://picturepan2.github.io/spectre/)
- Generated from https://github.com/process-analytics/bpmn-visualization-demo-template 

**DISCLAIMER**
- this demo has been created for the sole purpose of showing some `bpmn-visualization` features in action
- this application is not production-ready, in particular, it does not handle asynchronous code and promises in an appropriate way
- if you create derivative works, be aware that you do so at your own risk. No support will be provided.


## 🎮 Live demo

The live demo is available at ⏩ https://process-analytics.github.io/bonita-day-demo-2023/

It is possible to directly access to a specific use case by providing a query parameter.
- Parameter name: use-case
- Possible values:
  - case-monitoring
  - process-monitoring
  - other values or unset: use the "none" use case

Example using the live demo: ⏩ https://process-analytics.github.io/bonita-day-demo-2023/?use-case=case-monitoring


## ⚒️ Development Setup

Use the node version declared in [.nvmrc](.nvmrc). You can use a Node version manager like [nvm](https://github.com/nvm-sh/nvm): `nvm use`

Install dependencies: `npm install`

Start the dev server: `npm run dev`

The demo is accessible at http://localhost:5173/

### Code linter

The code should be linted with [xo](https://github.com/xojs/xo). To have support in your favorite IDE, see the [how-to used in IDE](https://github.com/xojs/xo#editor-plugins) documentation. 

To lint the code, run `npm run lint`.


### Run as a Docker container

Build the demo:
```shell
npm install
npm run build
```

Build the Docker image
```shell
docker build -t process-analytics:bonita-day-demo-2023 .
```

Start a container (adapt the `3617` value to use another port)
```shell
docker run --name pa-bonita-day-demo-2023 -d -p 3617:80 process-analytics:bonita-day-demo-2023
```
Then you can hit http://localhost:3617 or http://host-ip:3617 in your browser.

For reuse on another machine that doesn't have access to Internet (for instance, for a backup machine in a conference)
- save the image from the source machine (which built the image)
```shell
docker save --output pa-bonita-day-demo-2023.tar process-analytics:bonita-day-demo-2023
```
- load it into the target machine
```shell
docker load --input pa-bonita-day-demo-2023.tar
```

**NOTE**: to reduce the size of the archive, you can gzip it
```shell
gzip -k pa-bonita-day-demo-2023.tar
```

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


## ⚡ Powered by

<img src="public/github-logo.svg" alt="GitHub logo" title="GitHub Pages" width="110"/>

**[GitHub Pages](https://pages.github.com/)** (<kbd>demo</kbd> live environment)

<img src="https://surge.sh/images/logos/svg/surge-logo.svg" alt="surge.sh logo" title="surge.sh" width="110"/>

**[surge.sh](https://surge.sh)** (<kbd>demo</kbd> preview environment)
