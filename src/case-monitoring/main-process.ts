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
import type {BpmnVisualization} from 'bpmn-visualization';
import {AbstractCaseMonitoring, AbstractTippySupport} from './abstract.js';
import {getActivityRecommendationData} from './data-recommendation.js';
import {hideSupplierContactData, showContactSupplierAction} from './supplier.js';
import {hideSubProcessCaseMonitoringData, showResourceAllocationAction} from './sub-process.js';

export function newMainProcessCaseMonitoring(bpmnVisualization: BpmnVisualization) {
  return new MainProcessCaseMonitoring(bpmnVisualization, new MainProcessTippySupport(bpmnVisualization));
}

export class MainProcessCaseMonitoring extends AbstractCaseMonitoring {
  constructor(bpmnVisualization: BpmnVisualization, tippySupport: MainProcessTippySupport) {
    super(bpmnVisualization, 'main', tippySupport);
    tippySupport.setMainProcessCaseMonitoring(this);
  }

  hideData(): void {
    super.hideData();
    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO move the logic out of this class. Ideally in the subprocess navigator which should manage the data hide
    hideSupplierContactData();
    hideSubProcessCaseMonitoringData();
  }

  // For supplier
  // pause: on main activity, remove popover, remove overlays, remove CSS + add CSS like in subprocess
  pause(): void {
    this.resetRunningElements();
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses(this.getCaseMonitoringData().runningShapes, 'state-enabled');
  }

  // Resume
  resume(): void {
    this.bpmnVisualization.bpmnElementsRegistry.removeCssClasses(this.getCaseMonitoringData().runningShapes, 'state-enabled');
    this.highlightRunningElements();
  }

  protected highlightRunningElements(): void {
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses(this.getCaseMonitoringData().runningShapes, 'state-running-late');
    this.addInfoOnRunningElements(this.getCaseMonitoringData().runningShapes);
  }

  // Duplicated with SubProcessCaseMonitoring.addInfoOnRunningElements
  private addInfoOnRunningElements(bpmnElementIds: string[]) {
    for (const bpmnElementId of bpmnElementIds) {
      this.tippySupport.addPopover(bpmnElementId);
    }
  }
}

class MainProcessTippySupport extends AbstractTippySupport {
  private mainProcessCaseMonitoring?: MainProcessCaseMonitoring;

  constructor(protected readonly bpmnVisualization: BpmnVisualization) {
    super(bpmnVisualization);
  }

  setMainProcessCaseMonitoring(mainProcessCaseMonitoring: MainProcessCaseMonitoring) {
    this.mainProcessCaseMonitoring = mainProcessCaseMonitoring;
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

  // Inspired from https://stackoverflow.com/questions/56079864/how-to-remove-an-event-listener-within-a-class
  private readonly contactSupplierBtnListener = () => {
    showContactSupplierAction(this.mainProcessCaseMonitoring!).then(() => {
      console.info('Contact supplier action complete!');
    })
      .catch(error => {
        console.error('Error in contact supplier action:', error);
      });
  };

  private manageEventListeners(instance: Instance, register: boolean): void {
    // In the query selectors, target instance.popper. Keep using document for now as the previous popper (when going back to the subprocess after a first venue)
    // may still exist in the DOM of the subprocess view

    // the "button id" comes from the recommendation data
    const allocateActorBtn = document.querySelector(`#${instance.popper.id} #reassign-actor`);
    if (allocateActorBtn) {
      if (register) {
        allocateActorBtn.addEventListener('click', showResourceAllocationAction);
      } else {
        allocateActorBtn.removeEventListener('click', showResourceAllocationAction);
      }
    } else {
      console.warn('NO "allocate actor" btn');
    }

    // The "button id" comes from the recommendation data
    const contactSupplierBtn = document.querySelector(`#${instance.popper.id} #contact-supplier`);
    if (contactSupplierBtn) {
      if (register) {
        contactSupplierBtn.addEventListener('click', this.contactSupplierBtnListener);
      } else {
        contactSupplierBtn.removeEventListener('click', this.contactSupplierBtnListener);
      }
    } else {
      console.warn('NO "supplier contact" btn');
    }
  }

  private getRecommendationInfoAsHtml(htmlElement: ReferenceElement) {
    let popoverContent = `
        <div class="popover-container">
        <h4>Task running late</h4>
        <p>The following are steps that can be taken to mitigate the problem:</p>
        <table>
          <tbody>`;

    const bpmnSemantic = this.registeredBpmnElements.get(htmlElement);
    const activityRecommendationData = getActivityRecommendationData(bpmnSemantic?.name ?? '');
    for (const recommendation of activityRecommendationData) {
      const buttonId = recommendation.id;
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
