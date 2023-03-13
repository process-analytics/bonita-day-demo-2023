import tippy, {type Instance, type Props, type ReferenceElement} from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import type {BpmnElement, BpmnSemantic, BpmnVisualization} from 'bpmn-visualization';
import {getActivityRecommendationData} from './recommendation-data.js';
import {type CaseMonitoringData, getCaseMonitoringData} from './case-monitoring-data.js';
import {currentView, displayBpmnDiagram, secondaryBpmnVisualization} from './diagram.js';

const tippyInstances: Instance[] = [];

const registeredBpmnElements = new Map<Element, BpmnSemantic>();

let caseMonitoringData: CaseMonitoringData = {
  executedShapes: new Set<string>(),
  enabledShapes: new Set<string>(),
  pendingShapes: new Set<string>(),
  runningActivities: new Set<string>(),
  visitedEdges: new Set<string>(),
};

export function showCaseMonitoringData(processId: string, bpmnVisualization: BpmnVisualization) {
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
  const executedElements = new Set<string>([...caseMonitoringData.executedShapes, ...caseMonitoringData.visitedEdges]);
  bpmnVisualization.bpmnElementsRegistry.addCssClasses(Array.from(executedElements), 'state-already-executed');
}

function restoreVisibilityOfAlreadyExecutedElements(bpmnVisualization: BpmnVisualization) {
  const executedElements = new Set<string>([...caseMonitoringData.executedShapes, ...caseMonitoringData.pendingShapes, ...caseMonitoringData.visitedEdges]);
  bpmnVisualization.bpmnElementsRegistry.removeCssClasses(Array.from(executedElements), 'state-already-executed');
}

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO: rename CSS class
function highlightRunningElements(bpmnVisualization: BpmnVisualization) {
  const runningActivities = caseMonitoringData.runningActivities;
  bpmnVisualization.bpmnElementsRegistry.addCssClasses(Array.from(runningActivities), 'state-running-late');
  if (currentView === 'main') {
    addInfoOnRunningElements(runningActivities, bpmnVisualization);
  }
}

export function highlightEnabledElements(bpmnVisualization: BpmnVisualization) {
  const enabledActivities = caseMonitoringData.enabledShapes;
  bpmnVisualization.bpmnElementsRegistry.addCssClasses(Array.from(enabledActivities), 'state-enabled');
  if (currentView === 'secondary') {
    addInfoOnEnabledElements(enabledActivities, bpmnVisualization);
  }
}

function resetRunningElements(bpmnVisualization: BpmnVisualization) {
  const runningActivities = Array.from(caseMonitoringData.runningActivities);
  bpmnVisualization.bpmnElementsRegistry.removeCssClasses(runningActivities, 'state-running-late');
  for (const activityId of runningActivities) {
    bpmnVisualization.bpmnElementsRegistry.removeAllOverlays(activityId);
  }

  // Unregister tippy instances
  for (const instance of tippyInstances) {
    instance.destroy();
  }

  tippyInstances.length = 0;
}

function addInfoOnRunningElements(runningActivities: Set<string>, bpmnVisualization: BpmnVisualization) {
  for (const activityId of runningActivities) {
    addPopover(activityId, bpmnVisualization);
    addOverlay(activityId, bpmnVisualization);
  }
}

function addInfoOnEnabledElements(enabledActivities: Set<string>, bpmnVisualization: BpmnVisualization) {
  for (const activityId of enabledActivities) {
    addPopover(activityId, bpmnVisualization);
    addOverlay(activityId, bpmnVisualization);
  }
}

function addPopover(activityId: string, bpmnVisualization: BpmnVisualization) {
  const activity = bpmnVisualization.bpmnElementsRegistry.getElementsByIds(activityId)[0];
  registerBpmnElement(activity);

  const tippyInstance = tippy(activity.htmlElement, {
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
      } else {
        instance.setContent(getWarningInfoAsHtml());
        // Instance.setContent(getWarningInfoAsHtml(instance.reference));
      }
    },
  } as Partial<Props>);

  tippyInstances.push(tippyInstance);

  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO make it work
  // get references to the buttons in the Tippy popover
  if (currentView === 'main') {
    tippyInstance.popper.addEventListener('mouseover', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const allocateResourceBtn = target.querySelector('#Allocate-Resource');
      const contactClientBtn = target.querySelector('#Contact-Client');
      if (allocateResourceBtn) {
        allocateResourceBtn.addEventListener('click', () => {
          showResourceAllocationAction();
        });
      }

      if (contactClientBtn) {
        contactClientBtn.addEventListener('click', () => {
          showContactClientAction();
        });
      }
    });
  }
}

function addOverlay(activityId: string, bpmnVisualization: BpmnVisualization) {
  bpmnVisualization.bpmnElementsRegistry.addOverlays(activityId, {
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
    if (instance.reference === enabledShape.htmlElement) {
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
  // TO BE IMPLEMENTED
}

