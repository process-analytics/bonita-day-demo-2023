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
      this.addOverlay(bpmnElementId);
    }
  }

  private addOverlay(bpmnElementId: string) {
    this.bpmnVisualization.bpmnElementsRegistry.addOverlays(bpmnElementId, {
      position: 'top-right',
      label: '?',
      style: {
        font: {color: '#fff', size: 16},
        fill: {color: '#4169E1'},
        stroke: {color: '#4169E1', width: 2},
      },
    });
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

  // Hack from https://stackoverflow.com/questions/56079864/how-to-remove-an-event-listener-within-a-class
  private readonly contactClientBtnListener = () => {
    console.info('called contactClientBtnListener');
    showContactSupplierAction(this.mainProcessCaseMonitoring!).then(() => {
      console.log('Contact client action complete!');
    })
      .then(() => {
        console.info('I have been executed after showContactSupplierAction');
      })
      .catch(error => {
        console.error('Error in contact client action:', error);
      });
    console.info('click btn done');
  };

  private manageEventListeners(instance: Instance, register: boolean): void {
    // In the query selectors, target instance.popper. Keep using document for now as the previous popper (when going back to the subprocess after a first venue)
    // may still exist in the DOM of the subprocess view

    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO avoid hard coding or manage this in the same class that generate 'getRecommendationInfoAsHtml'
    const allocateResourceBtn = document.querySelector(`#${instance.popper.id} #Allocate-Resource`)!;
    if (register) {
      allocateResourceBtn.addEventListener('click', showResourceAllocationAction);
    } else {
      allocateResourceBtn.removeEventListener('click', showResourceAllocationAction);
    }

    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO avoid hard coding or manage this in the same class that generate 'getRecommendationInfoAsHtml'
    const contactClientBtn = document.querySelector(`#${instance.popper.id} #Contact-Client`)!;
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
