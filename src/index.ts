/*
Copyright 2023 Bonitasoft S.A.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {configureBreadcrumb} from './breadcrumb.js';
import {configureUseCaseSelectors, defaultUseCase} from './use-case-management.js';

// The documentation of Spectre CSS: https://github.com/picturepan2/spectre
//     <link rel="stylesheet" href="node_modules/spectre.css/dist/spectre.min.css">
// import 'spectre.css/dist/spectre.css'
// import 'spectre.css/dist/spectre.min.css'

configureBreadcrumb();
configureUseCaseSelectors(new URLSearchParams(window.location.search).get('use-case') ?? defaultUseCase);
configureToggleAdvertiseSection();

function configureToggleAdvertiseSection() {
  function toggleDisplay(element: HTMLElement): void {
    element.classList.toggle('d-hide');
  }

  function toggleAllDisplays(): void {
    toggleDisplay((document.querySelector<HTMLDivElement>('#section-project-advertising'))!);
    // advertiseSection.classList.remove('d-hide');
    console.log('advertise section toggled');
    toggleDisplay((document.querySelector<HTMLDivElement>('#section-main'))!);
    // mainSection.classList.add('d-hide');
    console.log('main section toggled');
  }

  (document.querySelector<HTMLImageElement>('#logo'))!.addEventListener('click', () => {
    // TODO when already open, new click close the advertise section?
    console.log('click img');
    toggleAllDisplays();
    // toggleDisplay((document.querySelector<HTMLDivElement>('#section-project-advertising'))!);
    // // advertiseSection.classList.remove('d-hide');
    // console.log('advertise section toggled');
    // toggleDisplay((document.querySelector<HTMLDivElement>('#section-main'))!);
    // // mainSection.classList.add('d-hide');
    // console.log('main section toggled');
  });

  (document.querySelector<HTMLButtonElement>('.project-advertising button'))!.addEventListener('click', () => {
    console.log('click btn');
    toggleAllDisplays();
  });
  // if (closeBtn) {
  //   console.info('btn exists');
  //   closeBtn.addEventListener('click', () => {
  //     console.log('click btn');
  //     // TODO manage duplication with open, use classList.toggle instead?
  //     const advertiseSection = document.querySelector<HTMLDivElement>('#section-project-advertising');
  //     advertiseSection.classList.add('d-hide');
  //     console.log('advertise section hidden');
  //     const mainSection = document.querySelector<HTMLDivElement>('#section-main');
  //     mainSection.classList.remove('d-hide');
  //     console.log('main section displayed');
  //   });
  // }
}
