import {type BpmnElement, type BpmnSemantic, type BpmnVisualization} from 'bpmn-visualization/*';
import tippy, {type Instance, type Props, type ReferenceElement} from 'tippy.js';
import {type CaseMonitoringData, fetchCaseMonitoringData} from './data-case.js';

export abstract class AbstractCaseMonitoring {
  protected caseMonitoringData: CaseMonitoringData | undefined;

  protected constructor(protected readonly bpmnVisualization: BpmnVisualization, private readonly processId: string, protected tippySupport: AbstractTippySupport) {
    console.info('Initialized AbstractCaseMonitoring, processId: %s / bpmn-container: %s', processId, bpmnVisualization.graph.container.id);
  }

  showData(): void {
    console.info('start showData / bpmn-container: %s', this.bpmnVisualization.graph.container.id);
    this.reduceVisibilityOfAlreadyExecutedElements();
    this.highlightRunningElements();
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
    // Do nothing by default
  }

  private reduceVisibilityOfAlreadyExecutedElements(): void {
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses([...this.getCaseMonitoringData().executedShapes, ...this.getCaseMonitoringData().visitedEdges], 'state-already-executed');
  }

  private restoreVisibilityOfAlreadyExecutedElements() {
    // eslint-disable-next-line no-warning-comments -- question to answer by Nour
    // TODO why adding pending?  the CSS class was not added in reduceVisibilityOfAlreadyExecutedElements
    this.bpmnVisualization.bpmnElementsRegistry.removeCssClasses([...this.getCaseMonitoringData().executedShapes, ...this.getCaseMonitoringData().pendingShapes, ...this.getCaseMonitoringData().visitedEdges], 'state-already-executed');
  }

  private resetRunningElements() {
    const bpmnElementIds = this.getCaseMonitoringData().runningShapes;
    this.bpmnVisualization.bpmnElementsRegistry.removeCssClasses(bpmnElementIds, ['state-running-late', 'state-enabled']);
    for (const bpmnElementId of bpmnElementIds) {
      this.bpmnVisualization.bpmnElementsRegistry.removeAllOverlays(bpmnElementId);
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
        thisInstance.registerEventListeners(instance);
      },
      onHide(instance: Instance): void | false {
        thisInstance.unregisterEventListeners(instance);
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

  protected registerEventListeners(_instance: Instance): void {
    console.info('###registerEventListeners');
  }

  protected unregisterEventListeners(_instance: Instance): void {
    console.info('###unregisterEventListeners');
  }

  protected abstract getContent(htmlElement: ReferenceElement): string;

  private registerBpmnElement(bpmnElement: BpmnElement) {
    this.registeredBpmnElements.set(bpmnElement.htmlElement, bpmnElement.bpmnSemantic);
  }
}
