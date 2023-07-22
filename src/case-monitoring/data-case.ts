import type {BpmnElementsRegistry, BpmnVisualization} from 'bpmn-visualization';
import {BpmnElementsSearcher, PathResolver} from '@process-analytics/bv-experimental-add-ons';

export type CaseMonitoringData = {
  executedShapes: string[];
  pendingShapes: string[];
  runningShapes: string[];
  visitedEdges: string[];
};

/**
 * Simulate fetching data from an execution system.
 */
abstract class AbstractCaseMonitoringDataProvider {
  protected readonly bpmnElementsSearcher: BpmnElementsSearcher;
  private readonly pathResolver: PathResolver;

  constructor(bpmnElementsRegistry: BpmnElementsRegistry) {
    this.bpmnElementsSearcher = new BpmnElementsSearcher(bpmnElementsRegistry);
    this.pathResolver = new PathResolver(bpmnElementsRegistry);
  }

  /**
   * In real life, parameters would be passed to this method, at least the `case id`.
   */
  fetch(): CaseMonitoringData {
    const executedShapes = this.getExecutedShapes();
    const pendingShapes = this.getPendingShapes();
    const runningShapes = this.getRunningShapes();

    const visitedEdges = this.pathResolver.getVisitedEdges([...executedShapes, ...runningShapes, ...pendingShapes]);
    return {
      executedShapes,
      pendingShapes,
      runningShapes,
      visitedEdges,
    };
  }

  abstract getExecutedShapes(): string[];

  abstract getPendingShapes(): string[];

  abstract getRunningShapes(): string[];
}

class MainProcessCaseMonitoringDataProvider extends AbstractCaseMonitoringDataProvider {
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

  getRunningShapes(): string[] {
    const activities: string[] = [];
    addNonNullElement(activities, this.bpmnElementsSearcher.getElementIdByName('SRM subprocess'));
    return activities;
  }
}

class SubProcessCaseMonitoringDataProvider extends AbstractCaseMonitoringDataProvider {
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

  getRunningShapes(): string[] {
    const shapes: string[] = [];
    addNonNullElement(shapes, this.bpmnElementsSearcher.getElementIdByName('SRM: Awaiting Approval'));
    return shapes;
  }
}

export function fetchCaseMonitoringData(processId: string, bpmnVisualization: BpmnVisualization): CaseMonitoringData {
  const bpmnElementsRegistry = bpmnVisualization.bpmnElementsRegistry;
  const caseMonitoringDataProvider = processId === 'main' ? new MainProcessCaseMonitoringDataProvider(bpmnElementsRegistry) : new SubProcessCaseMonitoringDataProvider(bpmnElementsRegistry);

  const executedShapes = caseMonitoringDataProvider.getExecutedShapes();
  const runningShapes = caseMonitoringDataProvider.getRunningShapes();
  const pendingShapes = caseMonitoringDataProvider.getPendingShapes();

  const visitedEdges = new PathResolver(bpmnElementsRegistry).getVisitedEdges([...executedShapes, ...runningShapes, ...pendingShapes]);
  return {
    executedShapes,
    pendingShapes,
    runningShapes,
    visitedEdges,
  };
}

function addNonNullElement(elements: string[], elt: string | undefined) {
  if (elt) {
    elements.push(elt);
  }
}
