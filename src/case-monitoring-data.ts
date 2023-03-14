import {type BpmnVisualization} from 'bpmn-visualization';
import {BpmnElementsSearcher} from './utils/bpmn-elements.js';
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
  protected readonly bpmnElementsSearcher: BpmnElementsSearcher;
  private readonly pathResolver: PathResolver;

  protected constructor(protected readonly bpmnVisualization: BpmnVisualization) {
    this.bpmnElementsSearcher = new BpmnElementsSearcher(bpmnVisualization);
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
    super(bpmnVisualization);
  }

  getEnabledShapes(): string[] {
    return [];
  }

  getExecutedShapes(): string[] {
    const shapes: string[] = [];
    addNonNullElement(shapes, this.bpmnElementsSearcher.getElementIdByName('New POI needed')); // Start event
    addNonNullElement(shapes, 'Gateway_0xh0plz'); // Parallel gateway after start event
    addNonNullElement(shapes, this.bpmnElementsSearcher.getElementIdByName('Vendor creates invoice'));
    addNonNullElement(shapes, this.bpmnElementsSearcher.getElementIdByName('Create Purchase Order Item'));
    return shapes;
  }

  getPendingShapes(): string[] {
    const pendingShapes: string[] = [];
    pendingShapes.push('Gateway_0domayw');
    return pendingShapes;
  }

  getRunningActivities(): string[] {
    const activities: string[] = [];
    addNonNullElement(activities, this.bpmnElementsSearcher.getElementIdByName('SRM subprocess'));
    return activities;
  }
}

class SecondaryProcessCaseMonitoringDataProvider extends AbstractCaseMonitoringDataProvider {
  constructor(protected readonly bpmnVisualization: BpmnVisualization) {
    super(bpmnVisualization);
  }

  getEnabledShapes(): string[] {
    const shapes: string[] = [];
    addNonNullElement(shapes, this.bpmnElementsSearcher.getElementIdByName('SRM: Awaiting Approval'));
    return shapes;
  }

  getExecutedShapes(): string[] {
    const shapes: string[] = [];
    addNonNullElement(shapes, 'Event_1dnxra5'); // Start event
    addNonNullElement(shapes, this.bpmnElementsSearcher.getElementIdByName('SRM: Created'));
    addNonNullElement(shapes, this.bpmnElementsSearcher.getElementIdByName('SRM: Complete'));
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

function addNonNullElement(elements: string[], elt: string | undefined) {
  if (elt) {
    elements.push(elt);
  }
}
