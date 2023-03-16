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

  function registerToggleDisplayOnClick(selector: string): void {
    (document.querySelector<HTMLImageElement>(selector))!.addEventListener('click', () => {
      toggleDisplay((document.querySelector<HTMLDivElement>('#section-project-advertising'))!);
      toggleDisplay((document.querySelector<HTMLDivElement>('#section-main'))!);
    });
  }

  registerToggleDisplayOnClick('#logo');
  registerToggleDisplayOnClick('.project-advertising button');
}
