import {type BpmnVisualization} from 'bpmn-visualization';
import {getElementIdByName} from './bpmn-elements.js';
import {PathResolver} from './utils/paths.js';

export type CaseMonitoringData = {
  executedShapes: string[];
  runningActivities: string[];
  enabledShapes: string[];
  pendingShapes: string[];
  visitedEdges: string[];
};

export function getCaseMonitoringData(processId: string, bpmnVisualization: BpmnVisualization, caseId = '1'): CaseMonitoringData {
  const executedShapes = getExecutedShapes(processId, caseId);
  const runningActivities = getRunningActivities(processId, caseId);
  const enabledShapes = getEnabledShapes(processId, caseId);
  const pendingShapes = getPendingShapes(processId, caseId);

  const visitedEdges = new PathResolver(bpmnVisualization).getVisitedEdges([...executedShapes, ...runningActivities, ...enabledShapes, ...pendingShapes]);
  return {
    executedShapes,
    runningActivities,
    enabledShapes,
    pendingShapes,
    visitedEdges,
  };
}

// Already executed shapes: activities, gateways, events, ...
function getExecutedShapes(processId: string, caseId: string) {
  if (caseId !== '1') {
    throw new Error('Case IDs are not supported yet. caseID should be kept to default 1');
  }

  const executedShapes: string[] = [];
  if (processId === 'main') {
    addNonNullElement(executedShapes, getElementIdByName('New POI Needed', processId)); // Start event
    addNonNullElement(executedShapes, 'Gateway_0xh0plz'); // Parallel gateway after start event
    addNonNullElement(executedShapes, getElementIdByName('Vendor Creates Invoice', processId));
    addNonNullElement(executedShapes, getElementIdByName('Create Purchase Order Item', processId));
  } else {
    addNonNullElement(executedShapes, getElementIdByName('New SRM entry', processId)); // Start event
    addNonNullElement(executedShapes, getElementIdByName('SRM: Created', processId));
    addNonNullElement(executedShapes, getElementIdByName('SRM: Complete', processId));
  }

  return executedShapes;
}

function getRunningActivities(processId: string, caseId: string) {
  if (caseId !== '1') {
    throw new Error('Different case IDs are not supported yet. caseID should be kept to default 1');
  }

  const runningActivities: string[] = [];
  if (processId === 'main') {
    addNonNullElement(runningActivities, getElementIdByName('SRM subprocess', processId));
  }

  // No running activities in the secondary subprocess
  return runningActivities;
}

function getEnabledShapes(processId: string, caseId: string) {
  if (caseId !== '1') {
    throw new Error('Different case IDs are not supported yet. caseID should be kept to default 1');
  }

  const enabledShapes: string[] = [];
  if (processId === 'secondary') {
    addNonNullElement(enabledShapes, getElementIdByName('SRM: Awaiting Approval', processId));
  }

  return enabledShapes;
}

function getPendingShapes(processId: string, caseId: string) {
  if (caseId !== '1') {
    throw new Error('Different case IDs are not supported yet. caseID should be kept to default 1');
  }

  const pendingShapes: string[] = [];
  if (processId === 'main') {
    pendingShapes.push('Gateway_0domayw');
  }

  return pendingShapes;
}

function addNonNullElement(elements: string[], elt: string | undefined) {
  if (elt) {
    elements.push(elt);
  }
}
