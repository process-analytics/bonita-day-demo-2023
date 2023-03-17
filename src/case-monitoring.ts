import tippy, {type Instance, type ReferenceElement} from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import type {BpmnVisualization} from 'bpmn-visualization';
import {getActivityRecommendationData} from './recommendation-data.js';
import {displayView, subProcessBpmnVisualization, subProcessViewName} from './diagram.js';
import {AbstractCaseMonitoring, AbstractTippySupport} from './case-monitoring-abstract.js';
import {showContactClientAction} from './case-monitoring-supplier.js';

export class MainProcessCaseMonitoring extends AbstractCaseMonitoring {
  constructor(bpmnVisualization: BpmnVisualization) {
    super(bpmnVisualization, 'main');
  }

  protected highlightRunningElements(): void {
    super.highlightRunningElements();
    this.addInfoOnRunningElements(this.getCaseMonitoringData().runningActivities);
  }

  protected createTippySupportInstance(bpmnVisualization: BpmnVisualization): AbstractTippySupport {
    return new MainProcessTippySupport(bpmnVisualization);
  }

  private addInfoOnRunningElements(bpmnElementIds: string[]) {
    for (const bpmnElementId of bpmnElementIds) {
      this.tippySupport.addPopover(bpmnElementId);
      this.addOverlay(bpmnElementId);
    }
  }
}

class SubProcessCaseMonitoring extends AbstractCaseMonitoring {
  constructor(bpmnVisualization: BpmnVisualization) {
    super(bpmnVisualization, subProcessViewName);
  }

  protected highlightEnabledElements(): void {
    super.highlightEnabledElements();
    this.addInfoOnEnabledElements(this.getCaseMonitoringData().enabledShapes);
  }

  protected createTippySupportInstance(bpmnVisualization: BpmnVisualization): AbstractTippySupport {
    return new SubProcessTippySupport(bpmnVisualization);
  }

  private addInfoOnEnabledElements(bpmnElementIds: string[]) {
    for (const bpmnElementId of bpmnElementIds) {
      this.tippySupport.addPopover(bpmnElementId);
      this.addOverlay(bpmnElementId);
    }
  }
}

class MainProcessTippySupport extends AbstractTippySupport {
  protected getContent(htmlElement: ReferenceElement) {
    return this.getRecommendationInfoAsHtml(htmlElement);
  }

  protected registerEventListeners(_instance: Instance): void {
    console.info('MainProcessTippySupport, registering event listener');
    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO avoid hard coding or manage this in the same class that generate 'getRecommendationInfoAsHtml'
    const contactClientBtn = document.querySelector('#Contact-Client');
    // Console.info('tippy on show: contactClientBtn', contactClientBtn);
    if (contactClientBtn) {
      console.info('tippy on show: registering event listener on click');
      contactClientBtn.addEventListener('click', () => {
        showContactClientAction(this.bpmnVisualization).then(() => {
          console.log('Contact client action complete!');
        })
          .catch(error => {
            console.error('Error in contact client action:', error);
          });
      });
    }

    const allocateResourceBtn = document.querySelector('#Allocate-Resource');
    // Console.info('tippy on show: allocateResourceBtn', allocateResourceBtn);
    if (allocateResourceBtn) {
      // Console.info('tippy on show: registering event listener on click');
      allocateResourceBtn.addEventListener('click', () => {
        showResourceAllocationAction();
      });
    }

    console.info('DONE MainProcessTippySupport, registering event listener');
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
                <td class="popover-action">
                    <button id="${buttonId}">Act</button>
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

class SubProcessTippySupport extends AbstractTippySupport {
  protected getContent() {
    return getWarningInfoAsHtml();
  }

  protected registerEventListeners(_instance: Instance): void {
    console.info('SubProcessTippySupport, registering event listener');

    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO extract data in a dedicated "fetch simulation" class
    // Activity_1p3opxc awaiting approval (the task currently blocked)
    // Activity_015g8ru doc completed
    // Activity_0k8i7cb ordered
    // Activity_0yyl6g2 in transfer
    // Activity_16tcn1j changes transmitted
    const userData = [
      new Map<string, number>([['Activity_015g8ru', 12], ['Activity_0k8i7cb', 29]]),
      new Map<string, number>([['Activity_0k8i7cb', 41], ['Activity_0yyl6g2', 6]]),
      new Map<string, number>([['Activity_1p3opxc', 3], ['Activity_0k8i7cb', 5], ['Activity_0yyl6g2', 34], ['Activity_16tcn1j', 58]]),
    ];

    // Highlight activity
    const highlightElement = (data: Map<string, number>) => {
      for (const [activityId, nbExec] of data) {
        this.bpmnVisualization.bpmnElementsRegistry.addCssClasses(activityId, 'already-completed-by-user');
        this.bpmnVisualization.bpmnElementsRegistry.addOverlays(activityId, {
          position: 'top-center',
          label: `${nbExec}`,
          style: {
            font: {color: '#fff', size: 16},
            fill: {color: 'blueviolet'},
            stroke: {color: 'blueviolet', width: 2},
          },
        });
      }
    };

    const resetStyleOfBpmnElements = (bpmnElementIds: string[]) => {
      for (const bpmnElementId of bpmnElementIds) {
        this.bpmnVisualization.bpmnElementsRegistry.removeCssClasses(bpmnElementId, 'already-completed-by-user');
        this.bpmnVisualization.bpmnElementsRegistry.removeAllOverlays(bpmnElementId);
      }
    };

    // Target instance.popper. Keep using document for now as it shows that we don't cleanly remove the popover from the DOM in the subprocess view
    const rows = document.querySelectorAll('#popover-resources-available > tbody > tr');
    for (const [i, row] of rows.entries()) {
      row.addEventListener('mouseenter', () => {
        const data = userData[i];
        if (data) {
          highlightElement(data);
        }
      });
      row.addEventListener('mouseleave', () => {
        const data = userData[i];
        if (data) {
          resetStyleOfBpmnElements(Array.from(data.keys()));
        }
      });
    }

    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO manage unregister

    console.info('DONE SubProcessTippySupport, registering event listener');
  }
}

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO used by subprocess
function getWarningInfoAsHtml() {
// Function getWarningInfoAsHtml(htmlElement: ReferenceElement) {
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
                    <button>Assign</button>
                </td>
              </tr>
              <tr class="popover-row">
                <td>Resource 2</td>
                <td>Yes</td>
                <td class="popover-action">
                    <button>Assign</button>
                </td>
              </tr>
              <tr class="popover-row">
                <td>Resource 3</td>
                <td>Yes</td>
                <td class="popover-action">
                    <button>Assign</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
    `;
}

function showSubProcessMonitoringData(bpmnVisualization: BpmnVisualization) {
  const caseMonitoring = new SubProcessCaseMonitoring(bpmnVisualization);
  caseMonitoring.showData();
}

export function hideSubCaseMonitoringData(bpmnVisualization: BpmnVisualization) {
  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO should not instantiated again here, this prevents to correctly unregister/destroy tippy instances
  const caseMonitoring = new SubProcessCaseMonitoring(bpmnVisualization);
  caseMonitoring.hideData();
}

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO trigger by main, but the logic should be only for subprocess
function showResourceAllocationAction() {
  // This should be managed by SubProcessNavigator
  displayView(subProcessViewName);
  showSubProcessMonitoringData(subProcessBpmnVisualization);
}
