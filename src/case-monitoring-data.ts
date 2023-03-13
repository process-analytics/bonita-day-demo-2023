import { BpmnVisualization, EdgeBpmnSemantic, ShapeBpmnSemantic } from 'bpmn-visualization';
import { getElementIdByName } from './bpmn-elements';

export type CaseMonitoringData = {
    executedShapes: Set<string>;
    runningActivities: Set<string>;
    enabledShapes: Set<string>;
    pendingShapes: Set<string>;
    visitedEdges: Set<string>;
  };

export function getCaseMonitoringData(processId: string, bpmnVisualization: BpmnVisualization, caseId: string = "1"): CaseMonitoringData{
    const executedShapes = getExecutedShapes(processId, caseId);
    const runningActivities = getRunningActivities(processId, caseId);
    const enabledShapes = getEnabledShapes(processId, caseId);
    const pendingShapes = getPendingShapes(processId, caseId);
    const visitedEdges = getVisitedEdges(new Set<string>([...executedShapes, ...runningActivities, ...enabledShapes, ...pendingShapes]), bpmnVisualization)
    return  {
                executedShapes: executedShapes,
                runningActivities: runningActivities,
                enabledShapes: enabledShapes,
                pendingShapes: pendingShapes,
                visitedEdges: visitedEdges
            };
}

// Already executed shapes: activities, gateways, events, ...
function getExecutedShapes(processId: string, caseId: string) {
    if(caseId !== "1"){
        throw new Error("Case IDs are not supported yet. Keept the default value 1");
    }
    const executedShapes = new Set<string>();
    if(processId == "main"){
      addNonNullElement(executedShapes, getElementIdByName('New POI Needed', processId)); // Start event
      addNonNullElement(executedShapes, 'Gateway_0xh0plz'); // Parallel gateway after start event
      addNonNullElement(executedShapes, getElementIdByName('Vendor Creates Invoice', processId));
      addNonNullElement(executedShapes, getElementIdByName('Create Purchase Order Item', processId));
    }
    //processId = "secondary"
    else{
      addNonNullElement(executedShapes, getElementIdByName('New SRM entry', processId)); // Start event
      addNonNullElement(executedShapes, getElementIdByName('SRM: Created', processId)); 
      addNonNullElement(executedShapes, getElementIdByName('SRM: Complete', processId));
        
    }
    return executedShapes;
}

function getRunningActivities(processId: string, caseId: string) {
    if(caseId !== "1"){
        throw new Error("Different case IDs are not supported yet. caseID should be kept to default 1");
    }
    const runningActivities = new Set<string>();
    if(processId == "main"){
        addNonNullElement(runningActivities, getElementIdByName('SRM subprocess', processId));
    }
    //no running activities in the secondary subprocess
    return runningActivities;
  }

  function getEnabledShapes(processId: string, caseId: string): Set<string> {
    if(caseId !== "1"){
        throw new Error("Different case IDs are not supported yet. caseID should be kept to default 1");
    }
    const enabledShapes = new Set<string>();
    if(processId == "secondary"){
      addNonNullElement(enabledShapes, getElementIdByName('SRM: Awaiting Approval', processId));;
    }
    return enabledShapes;
  }
  
  function getPendingShapes(processId: string, caseId: string): Set<string> {
    if(caseId !== "1"){
        throw new Error("Different case IDs are not supported yet. caseID should be kept to default 1");
    }
    const pendingShapes = new Set<string>();
    if(processId == "main"){
        pendingShapes.add('Gateway_0domayw');
    }
    return pendingShapes;
  }

  function getVisitedEdges(shapeIds: Set<string>, bpmnVisualization: BpmnVisualization) {
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

function addNonNullElement(elements: Set<string>, elt: string | undefined) {
    if (elt) {
      elements.add(elt);
    }
  }