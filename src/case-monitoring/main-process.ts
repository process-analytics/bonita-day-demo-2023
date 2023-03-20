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

import {type Instance, type ReferenceElement} from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import type {BpmnVisualization} from 'bpmn-visualization';
import {getActivityRecommendationData} from '../recommendation-data.js';
import {AbstractCaseMonitoring, AbstractTippySupport} from './abstract.js';
import {hideSupplierContactData, showContactSupplierAction} from './supplier.js';
import {hideSubCaseMonitoringData, showResourceAllocationAction} from './sub-process.js';

export class MainProcessCaseMonitoring extends AbstractCaseMonitoring {
  constructor(bpmnVisualization: BpmnVisualization) {
    super(bpmnVisualization, 'main');
  }

  hideData(): void {
    super.hideData();
    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO move the logic out of this class. Ideally in the subprocess navigator which should manage the data hide
    hideSupplierContactData();
    hideSubCaseMonitoringData();
  }

  protected highlightRunningElements(): void {
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses(this.getCaseMonitoringData().runningShapes, 'state-running-late');
    this.addInfoOnRunningElements(this.getCaseMonitoringData().runningShapes);
  }

  protected createTippySupportInstance(bpmnVisualization: BpmnVisualization): AbstractTippySupport {
    return new MainProcessTippySupport(bpmnVisualization);
  }

  // Duplicated with SubProcessCaseMonitoring.addInfoOnRunningElements
  private addInfoOnRunningElements(bpmnElementIds: string[]) {
    for (const bpmnElementId of bpmnElementIds) {
      this.tippySupport.addPopover(bpmnElementId);
      this.addOverlay(bpmnElementId);
    }
  }
}

class MainProcessTippySupport extends AbstractTippySupport {
  constructor(protected readonly bpmnVisualization: BpmnVisualization) {
    super(bpmnVisualization);
  }

  protected getContent(htmlElement: ReferenceElement) {
    return this.getRecommendationInfoAsHtml(htmlElement);
  }

  protected registerEventListeners(instance: Instance): void {
    this.manageEventListeners(instance, true);
  }

  protected unregisterEventListeners(instance: Instance): void {
    this.manageEventListeners(instance, false);
  }

  // Hack from https://stackoverflow.com/questions/56079864/how-to-remove-an-event-listener-within-a-class
  private readonly contactClientBtnListener = () => {
    console.info('called contactClientBtnListener private method');
    showContactSupplierAction(this.bpmnVisualization).then(() => {
      console.log('Contact client action complete!');
    })
      .catch(error => {
        console.error('Error in contact client action:', error);
      });
  };

  private manageEventListeners(_instance: Instance, register: boolean): void {
    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO avoid hard coding or manage this in the same class that generate 'getRecommendationInfoAsHtml'
    const allocateResourceBtn = document.querySelector('#Allocate-Resource')!;
    if (register) {
      allocateResourceBtn.addEventListener('click', showResourceAllocationAction);
    } else {
      allocateResourceBtn.removeEventListener('click', showResourceAllocationAction);
    }

    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO avoid hard coding or manage this in the same class that generate 'getRecommendationInfoAsHtml'
    const contactClientBtn = document.querySelector('#Contact-Client')!;
    if (register) {
      contactClientBtn.addEventListener('click', this.contactClientBtnListener);
    } else {
      contactClientBtn.removeEventListener('click', this.contactClientBtnListener);
    }
  }

  private getRecommendationInfoAsHtml(htmlElement: ReferenceElement) {
    let popoverContent = `
        <div class="popover-container">
        <h4>Task running late</h4>
        <p>Here are some suggestions:</p>
        <table>
          <tbody>`;

    const bpmnSemantic = this.registeredBpmnElements.get(htmlElement);
    const activityRecommendationData = getActivityRecommendationData(bpmnSemantic?.name ?? '');
    for (const recommendation of activityRecommendationData) {
      // Replace space with hyphen (-) to be passed as the button id
      const buttonId = recommendation.title.replace(/\s+/g, '-');
      popoverContent += `
            <tr class="popover-row">
                <td class="popover-key">${recommendation.title}</td>
                <td class="popover-value">${recommendation.description}</td>
                <td class="popover-action text-right">
                    <button id="${buttonId}" class="btn btn-sm btn-success">Act</button>
                </td>
            </tr>
        `;
    }

    popoverContent += `
                </tbody>
            </table>
        </div>
    `;
    return popoverContent;
  }
}
