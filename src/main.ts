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

import './style.css';
import {BpmnVisualization, FitType} from 'bpmn-visualization';
// This is simple example of the BPMN diagram, loaded as string. The '?.raw' extension support is provided by Vite.
// For other load methods, see https://github.com/process-analytics/bpmn-visualization-examples
// eslint-disable-next-line n/file-extension-in-import -- Vite syntax
import diagram from './diagram.bpmn?raw';

// Instantiate BpmnVisualization, pass the container HTMLElement - present in index.html
const bpmnVisualization = new BpmnVisualization({
  container: 'bpmn-container',
  navigation: {
    enabled: true,
  },
});
// Load the BPMN diagram defined above
bpmnVisualization.load(diagram, {fit: {type: FitType.Center, margin: 20}});

// Highlight task
bpmnVisualization.bpmnElementsRegistry.addCssClasses(
  [
    'Activity_00vbm9s', // Record Goods Receipts
    'Activity_1t65hvk', // Create Purchase Order Item
  ],
  'bpmn-highlight',
);

// Display the bpmn-visualization version in the footer
const footer = document.querySelector<HTMLElement>('footer')!;
const version = bpmnVisualization.getVersion();
const versionAsString = `bpmn-visualization@${version.lib}`;
const dependenciesAsString = [...version.dependencies].map(([name, version]) => `${name}@${version}`).join('/');
footer.textContent = `${versionAsString} with ${dependenciesAsString}`;
