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

/**
 * Simulate fetching data from an execution system.
 */
abstract class AbstractCaseMonitoringDataProvider {
  private readonly pathResolver: PathResolver;

  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO remove the need for processId
  protected constructor(protected readonly bpmnVisualization: BpmnVisualization, protected readonly processId: string) {
    this.pathResolver = new PathResolver(bpmnVisualization);
  }

  /**
   * In real life, parameters would be passed to this method, at least the `case id`.
   */
  fetch(): CaseMonitoringData {
    const executedShapes = this.getExecutedShapes();
    const runningActivities = this.getRunningActivities();
    const enabledShapes = this.getEnabledShapes();
    const pendingShapes = this.getPendingShapes();

    const visitedEdges = this.pathResolver.getVisitedEdges([...executedShapes, ...runningActivities, ...enabledShapes, ...pendingShapes]);
    return {
      executedShapes,
      runningActivities,
      enabledShapes,
      pendingShapes,
      visitedEdges,
    };
  }

  abstract getExecutedShapes(): string[];

  abstract getRunningActivities(): string[];

  abstract getEnabledShapes(): string[];

  abstract getPendingShapes(): string[];
}

class MainProcessCaseMonitoringDataProvider extends AbstractCaseMonitoringDataProvider {
  constructor(protected readonly bpmnVisualization: BpmnVisualization) {
    super(bpmnVisualization, 'main');
  }

  getEnabledShapes(): string[] {
    return [];
  }

  getExecutedShapes(): string[] {
    const shapes: string[] = [];
    addNonNullElement(shapes, getElementIdByName('New POI Needed', this.processId)); // Start event
    addNonNullElement(shapes, 'Gateway_0xh0plz'); // Parallel gateway after start event
    addNonNullElement(shapes, getElementIdByName('Vendor Creates Invoice', this.processId));
    addNonNullElement(shapes, getElementIdByName('Create Purchase Order Item', this.processId));
    return shapes;
  }

  getPendingShapes(): string[] {
    const pendingShapes: string[] = [];
    pendingShapes.push('Gateway_0domayw');
    return pendingShapes;
  }

  getRunningActivities(): string[] {
    const activities: string[] = [];
    addNonNullElement(activities, getElementIdByName('SRM subprocess', this.processId));
    return activities;
  }
}

class SecondaryProcessCaseMonitoringDataProvider extends AbstractCaseMonitoringDataProvider {
  constructor(protected readonly bpmnVisualization: BpmnVisualization) {
    super(bpmnVisualization, 'secondary');
  }

  getEnabledShapes(): string[] {
    const shapes: string[] = [];
    addNonNullElement(shapes, getElementIdByName('SRM: Awaiting Approval', this.processId));
    return shapes;
  }

  getExecutedShapes(): string[] {
    const shapes: string[] = [];
    addNonNullElement(shapes, getElementIdByName('New SRM entry', this.processId)); // Start event
    addNonNullElement(shapes, getElementIdByName('SRM: Created', this.processId));
    addNonNullElement(shapes, getElementIdByName('SRM: Complete', this.processId));
    return shapes;
  }

  getPendingShapes(): string[] {
    return [];
  }

  getRunningActivities(): string[] {
    return [];
  }
}

export function getCaseMonitoringData(processId: string, bpmnVisualization: BpmnVisualization): CaseMonitoringData {
  const caseMonitoringDataProvider = processId === 'main' ? new MainProcessCaseMonitoringDataProvider(bpmnVisualization) : new SecondaryProcessCaseMonitoringDataProvider(bpmnVisualization);

  const executedShapes = caseMonitoringDataProvider.getExecutedShapes();
  const runningActivities = caseMonitoringDataProvider.getRunningActivities();
  const enabledShapes = caseMonitoringDataProvider.getEnabledShapes();
  const pendingShapes = caseMonitoringDataProvider.getPendingShapes();

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
// function getExecutedShapes(processId: string, caseId: string) {
//   if (caseId !== '1') {
//     throw new Error('Case IDs are not supported yet. caseID should be kept to default 1');
//   }
//
//   const executedShapes: string[] = [];
//   if (processId === 'main') {
//     addNonNullElement(executedShapes, getElementIdByName('New POI Needed', processId)); // Start event
//     addNonNullElement(executedShapes, 'Gateway_0xh0plz'); // Parallel gateway after start event
//     addNonNullElement(executedShapes, getElementIdByName('Vendor Creates Invoice', processId));
//     addNonNullElement(executedShapes, getElementIdByName('Create Purchase Order Item', processId));
//   } else {
//     addNonNullElement(executedShapes, getElementIdByName('New SRM entry', processId)); // Start event
//     addNonNullElement(executedShapes, getElementIdByName('SRM: Created', processId));
//     addNonNullElement(executedShapes, getElementIdByName('SRM: Complete', processId));
//   }
//
//   return executedShapes;
// }
//
// function getRunningActivities(processId: string, caseId: string) {
//   if (caseId !== '1') {
//     throw new Error('Different case IDs are not supported yet. caseID should be kept to default 1');
//   }
//
//   const runningActivities: string[] = [];
//   if (processId === 'main') {
//     addNonNullElement(runningActivities, getElementIdByName('SRM subprocess', processId));
//   }
//
//   // No running activities in the secondary subprocess
//   return runningActivities;
// }
//
// function getEnabledShapes(processId: string, caseId: string) {
//   if (caseId !== '1') {
//     throw new Error('Different case IDs are not supported yet. caseID should be kept to default 1');
//   }
//
//   const enabledShapes: string[] = [];
//   if (processId === 'secondary') {
//     addNonNullElement(enabledShapes, getElementIdByName('SRM: Awaiting Approval', processId));
//   }
//
//   return enabledShapes;
// }
//
// function getPendingShapes(processId: string, caseId: string) {
//   if (caseId !== '1') {
//     throw new Error('Different case IDs are not supported yet. caseID should be kept to default 1');
//   }
//
//   const pendingShapes: string[] = [];
//   if (processId === 'main') {
//     pendingShapes.push('Gateway_0domayw');
//   }
//
//   return pendingShapes;
// }

function addNonNullElement(elements: string[], elt: string | undefined) {
  if (elt) {
    elements.push(elt);
  }
}
