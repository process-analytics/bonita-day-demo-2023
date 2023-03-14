import tippy, {type Instance, type Props, type ReferenceElement} from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import type {BpmnElement, BpmnSemantic, BpmnVisualization} from 'bpmn-visualization';
import {getActivityRecommendationData} from './recommendation-data.js';
import {type CaseMonitoringData, getCaseMonitoringData} from './case-monitoring-data.js';
import {currentView, displayBpmnDiagram, secondaryBpmnVisualization} from './diagram.js';

const tippyInstances: Instance[] = [];

const registeredBpmnElements = new Map<Element, BpmnSemantic>();

let caseMonitoringData: CaseMonitoringData;

abstract class AbstractCaseMonitoring {
  protected caseMonitoringData: CaseMonitoringData;

  protected constructor(protected readonly bpmnVisualization: BpmnVisualization, processId: string) {
  // TODO initialization. Is it the right place?
    this.caseMonitoringData = getCaseMonitoringData(processId, this.bpmnVisualization);
  }

  // LoadData(processId: string): void {
  //   this.caseMonitoringData = getCaseMonitoringData(processId, this.bpmnVisualization);
  // }

  protected highlightRunningElements(): void {
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses(caseMonitoringData.runningActivities, 'state-running-late');
  }

  protected highlightEnabledElements(): void {
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses(caseMonitoringData.enabledShapes, 'state-enabled');
  }

  private reduceVisibilityOfAlreadyExecutedElements(): void {
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses([...caseMonitoringData.executedShapes, ...caseMonitoringData.visitedEdges], 'state-already-executed');
  }
}

class MainProcessCaseMonitoring extends AbstractCaseMonitoring {
  protected highlightRunningElements(): void {
    super.highlightRunningElements();
    // TODO integrate the called function here?
    addInfoOnRunningElements(caseMonitoringData.runningActivities, this.bpmnVisualization);
  }
}

/**
 * Currently handle the SubProcess!!!
 */
class SecondaryProcessCaseMonitoring extends AbstractCaseMonitoring {
  protected highlightEnabledElements(): void {
    super.highlightEnabledElements();
    // TODO integrate the called function here?
    addInfoOnEnabledElements(caseMonitoringData.enabledShapes, this.bpmnVisualization);
  }
}

export function showCaseMonitoringData(processId: string, bpmnVisualization: BpmnVisualization) {
  // TODO change the view/processId value. secondary is for the subprocess!!
  caseMonitoringData = getCaseMonitoringData(processId, bpmnVisualization);

  reduceVisibilityOfAlreadyExecutedElements(bpmnVisualization);
  highlightRunningElements(bpmnVisualization);
  highlightEnabledElements(bpmnVisualization);

  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO what is it for?
  // registerInteractions(bpmnVisualization);
}

export function hideCaseMonitoringData(processId: string, bpmnVisualization: BpmnVisualization) {
  caseMonitoringData = getCaseMonitoringData(processId, bpmnVisualization);
  restoreVisibilityOfAlreadyExecutedElements(bpmnVisualization);
  resetRunningElements(bpmnVisualization);
}

function reduceVisibilityOfAlreadyExecutedElements(bpmnVisualization: BpmnVisualization) {
  bpmnVisualization.bpmnElementsRegistry.addCssClasses([...caseMonitoringData.executedShapes, ...caseMonitoringData.visitedEdges], 'state-already-executed');
}

function restoreVisibilityOfAlreadyExecutedElements(bpmnVisualization: BpmnVisualization) {
  // eslint-disable-next-line no-warning-comments -- question to answer by Nour
  // TODO why adding pending?  the CSS class was not added in reduceVisibilityOfAlreadyExecutedElements
  bpmnVisualization.bpmnElementsRegistry.removeCssClasses([...caseMonitoringData.executedShapes, ...caseMonitoringData.pendingShapes, ...caseMonitoringData.visitedEdges], 'state-already-executed');
}

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO: rename CSS class
function highlightRunningElements(bpmnVisualization: BpmnVisualization) {
  const elements = caseMonitoringData.runningActivities;
  bpmnVisualization.bpmnElementsRegistry.addCssClasses(elements, 'state-running-late');
  if (currentView === 'main') {
    addInfoOnRunningElements(elements, bpmnVisualization);
  }
}

function highlightEnabledElements(bpmnVisualization: BpmnVisualization) {
  const elements = caseMonitoringData.enabledShapes;
  bpmnVisualization.bpmnElementsRegistry.addCssClasses(elements, 'state-enabled');
  if (currentView === 'secondary') {
    addInfoOnEnabledElements(elements, bpmnVisualization);
  }
}

function resetRunningElements(bpmnVisualization: BpmnVisualization) {
  const elements = caseMonitoringData.runningActivities;
  bpmnVisualization.bpmnElementsRegistry.removeCssClasses(elements, 'state-running-late');
  for (const activityId of elements) {
    bpmnVisualization.bpmnElementsRegistry.removeAllOverlays(activityId);
  }

  // Unregister tippy instances
  for (const instance of tippyInstances) {
    instance.destroy();
  }

  tippyInstances.length = 0;
}

function addInfoOnRunningElements(bpmnElementIds: string[], bpmnVisualization: BpmnVisualization) {
  for (const bpmnElementId of bpmnElementIds) {
    addPopover(bpmnElementId, bpmnVisualization);
    addOverlay(bpmnElementId, bpmnVisualization);
  }
}

function addInfoOnEnabledElements(bpmnElementIds: string[], bpmnVisualization: BpmnVisualization) {
  for (const bpmnElementId of bpmnElementIds) {
    addPopover(bpmnElementId, bpmnVisualization);
    addOverlay(bpmnElementId, bpmnVisualization);
  }
}

function addPopover(bpmnElementId: string, bpmnVisualization: BpmnVisualization) {
  const bpmnElement = bpmnVisualization.bpmnElementsRegistry.getElementsByIds(bpmnElementId)[0];
  registerBpmnElement(bpmnElement);

  const tippyInstance = tippy(bpmnElement.htmlElement, {
    theme: 'light',
    placement: 'bottom',
    appendTo: bpmnVisualization.graph.container,
    content: 'Loading...',
    arrow: true,
    interactive: true,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- tippy type
    allowHTML: true,
    trigger: 'mouseenter',
    onShown(instance: Instance): void {
      if (currentView === 'main') {
        instance.setContent(getRecommendationInfoAsHtml(instance.reference));
        // eslint-disable-next-line no-warning-comments -- cannot be managed now
        // TODO avoid hard coding or manage this in the same class that generate 'getRecommendationInfoAsHtml'
        // eslint-disable-next-line no-warning-comments -- cannot be managed now
        // TODO only register the event listener once, or destroy it onHide
        const contactClientBtn = document.querySelector('#Contact-Client');
        console.info('tippy on show: contactClientBtn', contactClientBtn);
        if (contactClientBtn) {
          console.info('tippy on show: registering event listener on click');
          contactClientBtn.addEventListener('click', () => {
            showContactClientAction();
          });
        }

        const allocateResourceBtn = document.querySelector('#Allocate-Resource');
        console.info('tippy on show: allocateResourceBtn', allocateResourceBtn);
        if (allocateResourceBtn) {
          console.info('tippy on show: registering event listener on click');
          allocateResourceBtn.addEventListener('click', () => {
            showResourceAllocationAction();
          });
        }
      } else {
        instance.setContent(getWarningInfoAsHtml());
      }
    },
  } as Partial<Props>);

  tippyInstances.push(tippyInstance);
}

function addOverlay(bpmnElementId: string, bpmnVisualization: BpmnVisualization) {
  bpmnVisualization.bpmnElementsRegistry.addOverlays(bpmnElementId, {
    position: 'top-right',
    label: '?',
    style: {
      font: {color: '#fff', size: 16},
      fill: {color: '#4169E1'},
      stroke: {color: '#4169E1', width: 2},
    },
  });
}

function registerBpmnElement(bpmnElement: BpmnElement) {
  registeredBpmnElements.set(bpmnElement.htmlElement, bpmnElement.bpmnSemantic);
}

function getRecommendationInfoAsHtml(htmlElement: ReferenceElement) {
  let popoverContent = `
        <div class="popover-container">
        <h4>Task running late</h4>
        <p>Here are some suggestions:</p>
        <table>
          <tbody>`;

  const bpmnSemantic = registeredBpmnElements.get(htmlElement);
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

function getWarningInfoAsHtml() {
// Function getWarningInfoAsHtml(htmlElement: ReferenceElement) {
  return `
        <div class="popover-container">
          <h4>Resource not available</h4>
          <p>The resource "pierre" is not available to execute this task.</p>
          <p>Here are some other suggestions:</p>
          <table>
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

function showResourceAllocationAction() {
  displayBpmnDiagram('secondary');
  showCaseMonitoringData('secondary', secondaryBpmnVisualization);
  /*
    TO FIX: currently the code assumes that there's only one enabled shape
  */
  // TO COMPLETE: add interaction on the popover: on hover, highlight some activities
  const enabledShapeId = caseMonitoringData.enabledShapes.values().next().value as string;
  const enabledShape = secondaryBpmnVisualization.bpmnElementsRegistry.getElementsByIds(enabledShapeId)[0];
  const popoverInstance = tippyInstances.find(instance => {
    if (instance.reference === enabledShape?.htmlElement) {
      return instance;
    }

    return null;
  });

  if (popoverInstance) {
    // Add additional actions to the existing mouseover event listener
    /*
      The listener is NOT WORKING
    */
    popoverInstance.popper.addEventListener('mouseover', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      console.info('listener mouseover, target', target);
      // If (target.nodeName === 'TD') {
      //   const selectedRow = target.parentElement as HTMLTableRowElement;
      // }
    });
  } else {
    console.log('instance not found');
  }
}

function showContactClientAction() {
  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO implement
  // eslint-disable-next-line no-alert -- will be remove with the final implementation
  window.alert('Clicked on showContactClientAction');
}

