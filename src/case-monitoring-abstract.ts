import {type BpmnElement, type BpmnSemantic, type BpmnVisualization} from 'bpmn-visualization/*';
import tippy, {type Instance, type Props, type ReferenceElement} from 'tippy.js';
import {type CaseMonitoringData, fetchCaseMonitoringData} from './case-monitoring-data.js';

export abstract class AbstractCaseMonitoring {
  protected caseMonitoringData: CaseMonitoringData | undefined;
  protected tippySupport: AbstractTippySupport;

  protected constructor(protected readonly bpmnVisualization: BpmnVisualization, private readonly processId: string) {
    console.info('init CaseMonitoring, processId: %s / bpmn-container: %s', processId, bpmnVisualization.graph.container.id);
    this.tippySupport = this.createTippySupportInstance(bpmnVisualization);
    console.info('DONE init CaseMonitoring, processId', processId);
  }

  showData(): void {
    console.info('start showData / bpmn-container: %s', this.bpmnVisualization.graph.container.id);
    this.reduceVisibilityOfAlreadyExecutedElements();
    this.highlightRunningElements();
    this.highlightEnabledElements();
    console.info('end showData / bpmn-container: %s', this.bpmnVisualization.graph.container.id);
  }

  hideData(): void {
    console.info('start hideData / bpmn-container: %s', this.bpmnVisualization.graph.container.id);
    this.restoreVisibilityOfAlreadyExecutedElements();
    this.resetRunningElements();
    console.info('end hideData / bpmn-container: %s', this.bpmnVisualization.graph.container.id);
  }

  protected getCaseMonitoringData() {
    if (!this.caseMonitoringData) {
      this.caseMonitoringData = fetchCaseMonitoringData(this.processId, this.bpmnVisualization);
    }

    return this.caseMonitoringData;
  }

  protected highlightRunningElements(): void {
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses(this.getCaseMonitoringData().runningActivities, 'state-running-late');
  }

  protected highlightEnabledElements(): void {
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses(this.getCaseMonitoringData().enabledShapes, 'state-enabled');
  }

  protected addOverlay(bpmnElementId: string) {
    this.bpmnVisualization.bpmnElementsRegistry.addOverlays(bpmnElementId, {
      position: 'top-right',
      label: '?',
      style: {
        font: {color: '#fff', size: 16},
        fill: {color: '#4169E1'},
        stroke: {color: '#4169E1', width: 2},
      },
    });
  }

  protected abstract createTippySupportInstance(bpmnVisualization: BpmnVisualization): AbstractTippySupport;

  private reduceVisibilityOfAlreadyExecutedElements(): void {
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses([...this.getCaseMonitoringData().executedShapes, ...this.getCaseMonitoringData().visitedEdges], 'state-already-executed');
  }

  private restoreVisibilityOfAlreadyExecutedElements() {
    // eslint-disable-next-line no-warning-comments -- question to answer by Nour
    // TODO why adding pending?  the CSS class was not added in reduceVisibilityOfAlreadyExecutedElements
    this.bpmnVisualization.bpmnElementsRegistry.removeCssClasses([...this.getCaseMonitoringData().executedShapes, ...this.getCaseMonitoringData().pendingShapes, ...this.getCaseMonitoringData().visitedEdges], 'state-already-executed');
  }

  private resetRunningElements() {
    const elements = this.getCaseMonitoringData().runningActivities;
    this.bpmnVisualization.bpmnElementsRegistry.removeCssClasses(elements, 'state-running-late');
    for (const elementId of elements) {
      this.bpmnVisualization.bpmnElementsRegistry.removeAllOverlays(elementId);
    }

    this.tippySupport.removeAllPopovers();
  }
}

// May change in the future to favor composition over inheritance.
export abstract class AbstractTippySupport {
  protected registeredBpmnElements = new Map<Element, BpmnSemantic>();

  private tippyInstances: Instance[] = [];

  constructor(protected readonly bpmnVisualization: BpmnVisualization) {}

  addPopover(bpmnElementId: string) {
    const bpmnElement = this.bpmnVisualization.bpmnElementsRegistry.getElementsByIds(bpmnElementId)[0];
    this.registerBpmnElement(bpmnElement);

    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO temp find a better way
    // eslint-disable-next-line @typescript-eslint/no-this-alias,unicorn/no-this-assignment -- temp
    const thisInstance = this;
    const tippyInstance = tippy(bpmnElement.htmlElement, {
      theme: 'light',
      placement: 'bottom',
      appendTo: this.bpmnVisualization.graph.container,
      content: 'Loading...',
      arrow: true,
      interactive: true,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- tippy type
      allowHTML: true,
      trigger: 'mouseenter', // Use click to easily inspect
      onShown(instance: Instance): void {
        instance.setContent(thisInstance.getContent(instance.reference));
        // eslint-disable-next-line no-warning-comments -- cannot be managed now
        // TODO only register the event listener once, or destroy it onHide
        thisInstance.registerEventListeners(instance);
      },
    } as Partial<Props>);

    this.tippyInstances.push(tippyInstance);
    return tippyInstance;
  }

  removeAllPopovers(): void {
    for (const instance of this.tippyInstances) {
      instance.destroy();
    }

    this.tippyInstances.length = 0;
  }

  protected abstract getContent(htmlElement: ReferenceElement): string;

  protected abstract registerEventListeners(instance: Instance): void;

  private registerBpmnElement(bpmnElement: BpmnElement) {
    this.registeredBpmnElements.set(bpmnElement.htmlElement, bpmnElement.bpmnSemantic);
  }
}
