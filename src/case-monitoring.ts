import tippy, {type Instance, type Props, type ReferenceElement} from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import type {BpmnElement, BpmnSemantic, BpmnVisualization, EdgeBpmnSemantic, ShapeBpmnSemantic} from 'bpmn-visualization';
import {getElementIdByName} from './bpmn-elements.js';
import {getActivityRecommendationData} from './recommendation-data.js';

const tippyInstances: Instance[] = [];

const registeredBpmnElements = new Map<Element, BpmnSemantic>();

let alreadyExecutedElements = new Set<string>();

export function showCaseMonitoringData(bpmnVisualization: BpmnVisualization) {
  const alreadyExecutedShapes = getAlreadyExecutedShapes();
  const alreadyVisitedEdges = getConnectingEdgeIds(new Set<string>([...alreadyExecutedShapes, ...(getRunningActivities()), ...getPendingElements()]), bpmnVisualization);
  alreadyExecutedElements = new Set<string>([...alreadyExecutedShapes, ...alreadyVisitedEdges]);

  reduceVisibilityOfAlreadyExecutedElements(bpmnVisualization);
  highlightRunningElements(bpmnVisualization);

  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO what is it for?
  // registerInteractions(bpmnVisualization);
}

export function hideCaseMonitoringData(bpmnVisualization: BpmnVisualization) {
  restoreVisibilityOfAlreadyExecutedElements(bpmnVisualization);
  resetRunningElements(bpmnVisualization);
}

// Already executed shapes: activities, gateways, events, ...
function getAlreadyExecutedShapes() {
  const alreadyExecutedShapes = new Set<string>();
  addNonNullElement(alreadyExecutedShapes, getElementIdByName('New POI Needed')); // Start event
  addNonNullElement(alreadyExecutedShapes, 'Gateway_0xh0plz'); // Parallel gateway after start event
  addNonNullElement(alreadyExecutedShapes, getElementIdByName('Vendor Creates Invoice'));
  addNonNullElement(alreadyExecutedShapes, getElementIdByName('Create Purchase Order Item'));
  return alreadyExecutedShapes;
}

function addNonNullElement(elements: Set<string>, elt: string | undefined) {
  if (elt) {
    elements.add(elt);
  }
}

function getRunningActivities() {
  const runningActivities = new Set<string>();
  addNonNullElement(runningActivities, getElementIdByName('SRM subprocess'));
  return runningActivities;
}

function getPendingElements() {
  return new Set<string>(['Gateway_0domayw']);
}

function reduceVisibilityOfAlreadyExecutedElements(bpmnVisualization: BpmnVisualization) {
  bpmnVisualization.bpmnElementsRegistry.addCssClasses(Array.from(alreadyExecutedElements), 'state-already-executed');
}

function restoreVisibilityOfAlreadyExecutedElements(bpmnVisualization: BpmnVisualization) {
  bpmnVisualization.bpmnElementsRegistry.removeCssClasses(Array.from(alreadyExecutedElements), 'state-already-executed');
}

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO: rename CSS class
function highlightRunningElements(bpmnVisualization: BpmnVisualization) {
  const runningActivities = getRunningActivities();
  bpmnVisualization.bpmnElementsRegistry.addCssClasses(Array.from(runningActivities), 'state-predicted-late');
  for (const activityId of runningActivities) {
    addPopover(activityId, bpmnVisualization);
    addOverlay(activityId, bpmnVisualization);
  }
}

function resetRunningElements(bpmnVisualization: BpmnVisualization) {
  const runningActivities = Array.from(getRunningActivities());
  bpmnVisualization.bpmnElementsRegistry.removeCssClasses(runningActivities, 'state-predicted-late');
  for (const activityId of runningActivities) {
    bpmnVisualization.bpmnElementsRegistry.removeAllOverlays(activityId);
  }

  // Unregister tippy instances
  for (const instance of tippyInstances) {
    instance.destroy();
  }

  tippyInstances.length = 0;
}

function getConnectingEdgeIds(shapeIds: Set<string>, bpmnVisualization: BpmnVisualization) {
  const edgeIds = new Set<string>();
  for (const shape of shapeIds) {
    const shapeElt = bpmnVisualization.bpmnElementsRegistry.getElementsByIds(shape)[0];
    const bpmnSemantic = shapeElt.bpmnSemantic as ShapeBpmnSemantic;
    const incomingEdges = bpmnSemantic.incomingIds;
    const outgoingEdges = bpmnSemantic.outgoingIds;
    for (const edgeId of incomingEdges) {
      const edgeElement = bpmnVisualization.bpmnElementsRegistry.getElementsByIds(edgeId)[0];
      const sourceRef = (edgeElement.bpmnSemantic as EdgeBpmnSemantic).sourceRefId;
      if (shapeIds.has(sourceRef)) {
        edgeIds.add(edgeId);
      }
    }

    for (const edgeId of outgoingEdges) {
      const edgeElement = bpmnVisualization.bpmnElementsRegistry.getElementsByIds(edgeId)[0];
      const targetRef = (edgeElement.bpmnSemantic as EdgeBpmnSemantic).targetRefId;
      if (shapeIds.has(targetRef)) {
        edgeIds.add(edgeId);
      }
    }
  }

  return edgeIds;
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
      instance.setContent(getRecommendationInfoAsHtml(instance.reference));
    },
  } as Partial<Props>);

  tippyInstances.push(tippyInstance);

  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO make it work
  // get references to the buttons in the Tippy popover
  // const allocateResourceBtn = tippyInstance.popper.querySelector('#Allocate-Resource');
  // const contactClientBtn = tippyInstance.popper.querySelector('#Contact-Client');

  // add event listeners to the buttons
  /* allocateResourceBtn.addEventListener('click', function() {
        //showhMonitoringDataSubProcess();
    });

    contactClientBtn.addEventListener('click', function() {
        //complete
    }); */
}

function addOverlay(activityId: string, bpmnVisualization: BpmnVisualization) {
  bpmnVisualization.bpmnElementsRegistry.addOverlays(activityId, {
    position: 'top-center',
    label: ' ?????? ',
    style: {
      font: {color: '#fff', size: 16},
      fill: {color: 'rgba(0, 0, 0, 0.5)'},
      stroke: {color: 'rgba(0, 0, 0, 0.5)', width: 2},
    },
  });
}

function registerBpmnElement(bpmnElement: BpmnElement) {
  registeredBpmnElements.set(bpmnElement.htmlElement, bpmnElement.bpmnSemantic);
}

function getRecommendationInfoAsHtml(htmlElement: ReferenceElement) {
  let popoverContent = `
        <div class="popover-container">
            <table>
                <thead>
                    <tr>
                        <th colspan="3" class="popover-title">Recommendation</th>
                    </tr>
                </thead>
                <tbody>
    `;

  const bpmnSemantic = registeredBpmnElements.get(htmlElement);
  const activityRecommendationData = getActivityRecommendationData(bpmnSemantic?.name ?? '');
  for (const recommendation of activityRecommendationData) {
    // Replace space with hypen (-) to be passed as the button id
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
