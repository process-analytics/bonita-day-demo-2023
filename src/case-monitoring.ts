import {getElementIdByName} from "./bpmn-elements.js";
import {getActivityRecommendationData} from "./recommendation-data.js";
import tippy, {type Instance, type Props, type ReferenceElement} from "tippy.js";
import "tippy.js/dist/tippy.css";
import { BpmnElement, BpmnVisualization, EdgeBpmnSemantic, ShapeBpmnSemantic } from "bpmn-visualization/*";

const tippyInstances = [];

const registeredBpmnElements = new Map();

export function showMonitoringData(bpmnVisualization: BpmnVisualization){
    //get already executed shapes: activities, gateways, events, ...
    const alreadyExecutedShapes = getAlreadyExecutedShapes();

    /* TO DO
        refactor: set of pending shapes
        one call to getVisitedEdges
    */

    //get visited edges of alreadyExecutedElements
    const alreadyVisistedEdges = getConnectingEdgeIds(alreadyExecutedShapes, bpmnVisualization);

    //running elements
    const runningActivities = getRunningActivities();
    //add the incomingIds of the running elements
    runningActivities.forEach(activityId => {
        const activity = bpmnVisualization.bpmnElementsRegistry.getElementsByIds(activityId)[0];
        const incomingEdges = (<ShapeBpmnSemantic>activity.bpmnSemantic).incomingIds;
        for (let edge of incomingEdges) {
            alreadyVisistedEdges.add(edge);
          }
    })

    const alreadyExecutedElements = new Set<string>([...alreadyExecutedShapes, ...alreadyVisistedEdges]);

    reduceVisibilityOfAlreadyExecutedElements(alreadyExecutedElements, bpmnVisualization);
    highlightRunningElements(runningActivities, bpmnVisualization)
    runningActivities.forEach(activityId => {
        addPopover(activityId, bpmnVisualization);
        addOverlay(activityId, bpmnVisualization);
    })
    //registerInteractions(bpmnVisualization);

}

export function hideMonitoringData(bpmnVisualization: BpmnVisualization){
    // TODO implement hideMonitoringData
    console.info('bpmn-visualization version', bpmnVisualization.getVersion().lib);
}

function getAlreadyExecutedShapes(){
    const alreadyExecutedShapes = new Set<string>();
    addNonNullElement(alreadyExecutedShapes, getElementIdByName("New POI Needed")); //start event
    addNonNullElement(alreadyExecutedShapes, "Gateway_0xh0plz"); //parallel gateway after start event
    addNonNullElement(alreadyExecutedShapes, getElementIdByName("Vendor Creates Invoice"));
    addNonNullElement(alreadyExecutedShapes, getElementIdByName("Create Purchase Order Item"));
    return alreadyExecutedShapes;
}

function addNonNullElement(eltSet: Set<string>, elt: string | null){
    elt !=null && eltSet.add(elt);

}

function getRunningActivities(){
    const runningActivities = new Set<string>();
    addNonNullElement(runningActivities, getElementIdByName("SRM subprocess"));
    return runningActivities;
}

function reduceVisibilityOfAlreadyExecutedElements(alreadyExecutedElements: Set<string>, bpmnVisualization : BpmnVisualization) {
    bpmnVisualization.bpmnElementsRegistry.addCssClasses(Array.from(alreadyExecutedElements), 'state-already-executed');
}

/* TO DO: rename CSS class
          change toggle to add*/
function highlightRunningElements(runningActivities: Set<string>, bpmnVisualization: BpmnVisualization){
    bpmnVisualization.bpmnElementsRegistry.toggleCssClasses(Array.from(runningActivities), 'state-predicted-late');

}

function getConnectingEdgeIds(shapeSet: Set<string>, bpmnVisualization: BpmnVisualization){
    let edgeIds = new Set<string>();
    shapeSet.forEach(function(shape) {
        const shapeElt = bpmnVisualization.bpmnElementsRegistry.getElementsByIds(shape)[0];
        const bpmnSemantic = <ShapeBpmnSemantic>shapeElt.bpmnSemantic;
        const incomingEdges = bpmnSemantic.incomingIds;
        const outgoingEdges = bpmnSemantic.outgoingIds;
        incomingEdges.forEach(function(edgeId) {
            const edgeElement = bpmnVisualization.bpmnElementsRegistry.getElementsByIds(edgeId)[0]
            const sourceRef = (<EdgeBpmnSemantic>edgeElement.bpmnSemantic).sourceRefId;
            if (shapeSet.has(sourceRef)) {
                edgeIds.add(edgeId);
            }
        });
        outgoingEdges.forEach(function(edgeId) {
            const edgeElement = bpmnVisualization.bpmnElementsRegistry.getElementsByIds(edgeId)[0]
            const targetRef = (<EdgeBpmnSemantic>edgeElement.bpmnSemantic).targetRefId;
            if (shapeSet.has(targetRef)) {
                edgeIds.add(edgeId);
            }
        });
    });
    return edgeIds;
}

function addPopover(activityId: string, bpmnVisualization: BpmnVisualization){
    const activity = bpmnVisualization.bpmnElementsRegistry.getElementsByIds(activityId)[0];
    registerBpmnElement(activity);

    const tippyInstance = tippy(activity.htmlElement, {
        theme: 'light',
        placement: 'bottom',
        appendTo: bpmnVisualization.graph.container,
        content: 'Loading...',
        arrow: true,
        interactive: true,
        allowHTML: true,
        trigger: 'mouseenter',
        onShown: (instance: Instance<Props>): void => {
            instance.setContent(getRecommendationInfoAsHtml(instance.reference));
        }
      });

    tippyInstances.push(tippyInstance);

    // TODO make it work
    // get references to the buttons in the Tippy popover
    // const allocateResourceBtn = tippyInstance.popper.querySelector('#Allocate-Resource');
    // const contactClientBtn = tippyInstance.popper.querySelector('#Contact-Client');

    // add event listeners to the buttons
    /*allocateResourceBtn.addEventListener('click', function() {
        //showhMonitoringDataSubProcess();
    });

    contactClientBtn.addEventListener('click', function() {
        //complete
    });*/
}

function addOverlay(activityId: string, bpmnVisualization: BpmnVisualization){
    bpmnVisualization.bpmnElementsRegistry.addOverlays(activityId, {
        position: 'top-center',
        label: ' ℹ️ ',
        style: {
          font: { color: '#fff', size: 16 },
          fill: { color: 'rgba(0, 0, 0, 0.5)'},
          stroke: { color: 'rgba(0, 0, 0, 0.5)', width: 2 }
        }
    });
}

function registerBpmnElement(bpmnElement: BpmnElement) {
    registeredBpmnElements.set(bpmnElement.htmlElement, bpmnElement.bpmnSemantic)
  }

function getRecommendationInfoAsHtml(htmlElement: ReferenceElement<Props>){
    const bpmnSemantic = registeredBpmnElements.get(htmlElement);
    const activityRecommendationData = getActivityRecommendationData(bpmnSemantic.name);
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

    for (let key in activityRecommendationData) {
        //replace space with hypen (-) to be passed as the button id
        const buttonId = key.replace(/\s+/g, '-');
        popoverContent += `
            <tr class="popover-row">
                <td class="popover-key">${key}</td>
                <td class="popover-value">${activityRecommendationData[key]}</td>
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
