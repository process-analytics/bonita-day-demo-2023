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

import {type BpmnVisualization} from 'bpmn-visualization';
import {type Instance} from 'tippy.js';
import {displayView, isSubProcessBpmnDiagramIsAlreadyLoad, subProcessBpmnVisualization, subProcessViewName} from '../diagram.js';
import {AbstractCaseMonitoring, AbstractTippySupport} from './abstract.js';

class SubProcessCaseMonitoring extends AbstractCaseMonitoring {
  constructor(bpmnVisualization: BpmnVisualization) {
    super(bpmnVisualization, subProcessViewName);
  }

  protected highlightRunningElements(): void {
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses(this.getCaseMonitoringData().runningShapes, 'state-enabled');
    this.addInfoOnRunningElements(this.getCaseMonitoringData().runningShapes);
  }

  protected createTippySupportInstance(bpmnVisualization: BpmnVisualization): AbstractTippySupport {
    return new SubProcessTippySupport(bpmnVisualization);
  }

  // Duplicated with MainProcessCaseMonitoring.addInfoOnRunningElements
  private addInfoOnRunningElements(bpmnElementIds: string[]) {
    for (const bpmnElementId of bpmnElementIds) {
      this.tippySupport.addPopover(bpmnElementId);
      this.addOverlay(bpmnElementId);
    }
  }
}

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO extract data in a dedicated "fetch simulation" class
// Activity_1p3opxc awaiting approval (the task currently blocked)
// Activity_015g8ru doc completed
// Activity_0k8i7cb ordered
// Activity_0yyl6g2 in transfer
// Activity_16tcn1j changes transmitted
const subProcessUserData = [
  new Map<string, number>([['Activity_015g8ru', 12], ['Activity_0k8i7cb', 29]]),
  new Map<string, number>([['Activity_0k8i7cb', 41], ['Activity_0yyl6g2', 6]]),
  new Map<string, number>([['Activity_1p3opxc', 3], ['Activity_0k8i7cb', 5], ['Activity_0yyl6g2', 34], ['Activity_16tcn1j', 58]]),
];

class SubProcessTippySupport extends AbstractTippySupport {
  protected getContent() {
    return getWarningInfoAsHtml();
  }

  protected registerEventListeners(instance: Instance): void {
    this.manageEventListeners(instance, true);
  }

  protected unregisterEventListeners(instance: Instance): void {
    this.manageEventListeners(instance, false);
  }

  private manageEventListeners(instance: Instance, register: boolean): void {
    // Target instance.popper. Keep using document for now as the previous popper (when going back to the subprocess after a first venue)
    // may still exist in the DOM of the subprocess view
    const rows = document.querySelectorAll(`#${instance.popper.id} #popover-resources-available > tbody > tr`);
    for (const [, row] of rows.entries()) {
      if (register) {
        row.addEventListener('mouseenter', this.rowMouseEnterListener);
        row.addEventListener('mouseleave', this.rowMouseLeaveListener);
      } else {
        row.removeEventListener('mouseenter', this.rowMouseEnterListener);
        row.removeEventListener('mouseleave', this.rowMouseLeaveListener);
      }
    }
  }

  // Hack from https://stackoverflow.com/questions/56079864/how-to-remove-an-event-listener-within-a-class
  private readonly rowMouseEnterListener = (event: Event) => {
    const rowIndex = (event.target as HTMLTableRowElement).sectionRowIndex;
    const data = subProcessUserData[rowIndex];
    if (data) {
      this.highlightBpmnElements(data);
    }
  };

  private readonly rowMouseLeaveListener = (event: Event) => {
    const rowIndex = (event.target as HTMLTableRowElement).sectionRowIndex;
    const data = subProcessUserData[rowIndex];
    if (data) {
      this.resetStyleOfBpmnElements(Array.from(data.keys()));
    }
  };

  // Highlight activities that have already been managed by the current resource
  private highlightBpmnElements(data: Map<string, number>): void {
    for (const [bpmnElementId, nbExec] of data) {
      this.bpmnVisualization.bpmnElementsRegistry.addCssClasses(bpmnElementId, 'already-completed-by-user');
      this.bpmnVisualization.bpmnElementsRegistry.addOverlays(bpmnElementId, {
        position: 'top-center',
        label: `${nbExec}`,
        style: {
          font: {color: '#fff', size: 16},
          fill: {color: 'blueviolet'},
          stroke: {color: 'blueviolet', width: 2},
        },
      });
    }
  }

  private resetStyleOfBpmnElements(bpmnElementIds: string[]): void {
    for (const bpmnElementId of bpmnElementIds) {
      this.bpmnVisualization.bpmnElementsRegistry.removeCssClasses(bpmnElementId, 'already-completed-by-user');
      this.bpmnVisualization.bpmnElementsRegistry.removeAllOverlays(bpmnElementId);
    }
  }
}

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO used by subprocess, move somewhere else
function getWarningInfoAsHtml() {
  return `
        <div class="popover-container">
          <h4>Resource not available</h4>
          <p>The resource "pierre" is not available to execute this task.</p>
          <p>Here are some other suggestions:</p>
          <table id="popover-resources-available">
            <thead>
              <tr>
                <th>Resource Name</th>
                <th>Availability</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr class="popover-row">
                <td>Resource 1</td>
                <td>Yes</td>
                <td class="popover-action">
                    <button class="btn btn-sm btn-success">Assign</button>
                </td>
              </tr>
              <tr class="popover-row">
                <td>Resource 2</td>
                <td>Yes</td>
                <td class="popover-action">
                    <button class="btn btn-sm btn-success">Assign</button>
                </td>
              </tr>
              <tr class="popover-row">
                <td>Resource 3</td>
                <td>Yes</td>
                <td class="popover-action">
                    <button class="btn btn-sm btn-success">Assign</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
    `;
}

const subProcessCaseMonitoring = new SubProcessCaseMonitoring(subProcessBpmnVisualization);

export function hideSubCaseMonitoringData() {
  // Currently mandatory, if the diagram is not loaded error, this seems to be a bug in bpmn-visualization
  // calling getElementsByIds when the diagram is not loaded generates an error. It should respond without errors.
  // seen with bpmn-visualization@0.32.0
  // 15:40:09,653 Uncaught TypeError: this.searchableModel is undefined
  //     getBpmnSemantic bpmn-visualization.esm.js:6067
  //     getElementsByIds bpmn-visualization.esm.js:5742
  //     getElementsByIds bpmn-visualization.esm.js:5742
  //     getVisitedEdges paths.ts:30
  //     fetchCaseMonitoringData case-monitoring-data.ts:120
  //     getCaseMonitoringData abstract.ts:32
  //     restoreVisibilityOfAlreadyExecutedElements abstract.ts:67
  //     hideData abstract.ts:25
  //     hideSubCaseMonitoringData case-monitoring.ts:262
  //     configureUseCaseSelectors use-case-management.ts:36
  //     unselect use-case-management.ts:69
  //     UseCaseSelector use-case-management.ts:53
  //     UseCaseSelector use-case-management.ts:51
  //     configureUseCaseSelectors use-case-management.ts:38
  //     <anonymous> index.ts:37
  // bpmn-visualization.esm.js:6067:24
  if (isSubProcessBpmnDiagramIsAlreadyLoad()) {
    subProcessCaseMonitoring.hideData();
  }
}

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO trigger by main, but the logic should be only for subprocess
export function showResourceAllocationAction() {
  // This should be managed by SubProcessNavigator
  displayView(subProcessViewName);
  subProcessCaseMonitoring.showData();
}