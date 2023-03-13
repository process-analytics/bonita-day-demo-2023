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

import {BpmnVisualization} from 'bpmn-visualization';
// eslint-disable-next-line n/file-extension-in-import -- Vite syntax
import collapsedDiagram from './diagrams/EC-purchase-orders-collapsed.bpmn?raw';
import {displayBpmnDiagram, sharedLoadOptions} from './diagram.js';
import {configureRadioButtons} from './radio-buttons.js';

// 'bpmn-visualization' API documentation: https://process-analytics.github.io/bpmn-visualization-js/api/index.html
const mainBpmnVisualization = new BpmnVisualization({
  container: 'main-bpmn-container',
});

// Load BPMN diagram
mainBpmnVisualization.load(collapsedDiagram, sharedLoadOptions);

// Interaction: open the sub-process
const subProcessId = 'Activity_0ec8azh';
mainBpmnVisualization.bpmnElementsRegistry.getElementsByIds(subProcessId)[0].htmlElement.addEventListener('click', () => {
  displayBpmnDiagram('secondary');
});
mainBpmnVisualization.bpmnElementsRegistry.addCssClasses(subProcessId, 'c-hand');

// Return to main diagram
document.querySelector('#breadcrumb-main-diagram')!.addEventListener('click', () => {
  displayBpmnDiagram('main');
});

configureRadioButtons(mainBpmnVisualization);
