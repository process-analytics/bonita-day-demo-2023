import tippy, {type Instance, type Props, type ReferenceElement} from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import type {BpmnElement, BpmnSemantic, BpmnVisualization} from 'bpmn-visualization';
import {getActivityRecommendationData} from './recommendation-data.js';
import {type CaseMonitoringData, fetchCaseMonitoringData} from './case-monitoring-data.js';
import {displayView, subProcessBpmnVisualization, subProcessViewName} from './diagram.js';

abstract class AbstractCaseMonitoring {
  protected caseMonitoringData: CaseMonitoringData | undefined = undefined;
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

export class MainProcessCaseMonitoring extends AbstractCaseMonitoring {
  constructor(bpmnVisualization: BpmnVisualization) {
    super(bpmnVisualization, 'main');
  }

  protected highlightRunningElements(): void {
    super.highlightRunningElements();
    this.addInfoOnRunningElements(this.getCaseMonitoringData().runningActivities);
  }

  protected createTippySupportInstance(bpmnVisualization: BpmnVisualization): AbstractTippySupport {
    return new MainProcessTippySupport(bpmnVisualization);
  }

  private addInfoOnRunningElements(bpmnElementIds: string[]) {
    for (const bpmnElementId of bpmnElementIds) {
      this.tippySupport.addPopover(bpmnElementId);
      this.addOverlay(bpmnElementId);
    }
  }
}

class SubProcessCaseMonitoring extends AbstractCaseMonitoring {
  constructor(bpmnVisualization: BpmnVisualization) {
    super(bpmnVisualization, subProcessViewName);
  }

  protected highlightEnabledElements(): void {
    super.highlightEnabledElements();
    this.addInfoOnEnabledElements(this.getCaseMonitoringData().enabledShapes);
  }

  protected createTippySupportInstance(bpmnVisualization: BpmnVisualization): AbstractTippySupport {
    return new SubProcessTippySupport(bpmnVisualization);
  }

  private addInfoOnEnabledElements(bpmnElementIds: string[]) {
    for (const bpmnElementId of bpmnElementIds) {
      this.tippySupport.addPopover(bpmnElementId);
      this.addOverlay(bpmnElementId);
    }
  }
}

// May change in the future to favor composition over inheritance.
abstract class AbstractTippySupport {
  protected registeredBpmnElements = new Map<Element, BpmnSemantic>();

  private tippyInstances: Instance[] = [];

  constructor(private readonly bpmnVisualization: BpmnVisualization) {}

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
      trigger: 'mouseenter', // Use click  to easily inspect
      onShown(instance: Instance): void {
        instance.setContent(thisInstance.getContent(instance.reference));
        // eslint-disable-next-line no-warning-comments -- cannot be managed now
        // TODO only register the event listener once, or destroy it onHide
        thisInstance.registerEventListeners();
      },
    } as Partial<Props>);

    this.tippyInstances.push(tippyInstance);
  }

  removeAllPopovers(): void {
    for (const instance of this.tippyInstances) {
      instance.destroy();
    }

    this.tippyInstances.length = 0;
  }

  protected abstract getContent(htmlElement: ReferenceElement): string;

  protected abstract registerEventListeners(): void;

  private registerBpmnElement(bpmnElement: BpmnElement) {
    this.registeredBpmnElements.set(bpmnElement.htmlElement, bpmnElement.bpmnSemantic);
  }
}

class MainProcessTippySupport extends AbstractTippySupport {
  protected getContent(htmlElement: ReferenceElement) {
    console.info('getContent main process');
    return this.getRecommendationInfoAsHtml(htmlElement);
  }

  protected registerEventListeners(): void {
    console.info('MainProcessTippySupport, registering event listener');
    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO avoid hard coding or manage this in the same class that generate 'getRecommendationInfoAsHtml'
    const contactClientBtn = document.querySelector('#Contact-Client');
    // Console.info('tippy on show: contactClientBtn', contactClientBtn);
    if (contactClientBtn) {
      // Console.info('tippy on show: registering event listener on click');
      contactClientBtn.addEventListener('click', () => {
        showContactClientAction();
      });
    }

    const allocateResourceBtn = document.querySelector('#Allocate-Resource');
    // Console.info('tippy on show: allocateResourceBtn', allocateResourceBtn);
    if (allocateResourceBtn) {
      // Console.info('tippy on show: registering event listener on click');
      allocateResourceBtn.addEventListener('click', () => {
        showResourceAllocationAction();
      });
    }

    console.info('DONE MainProcessTippySupport, registering event listener');
  }

  private getRecommendationInfoAsHtml(htmlElement: ReferenceElement) {
    let popoverContent = `
        <div class="popover-container">
        <h4>Task running late</h4>
        <p>Here are some suggestions:</p>
        <table>
          <tbody>`;

    const bpmnSemantic = this.registeredBpmnElements.get(htmlElement);
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
}

class SubProcessTippySupport extends AbstractTippySupport {
  protected getContent() {
    return getWarningInfoAsHtml();
  }

  protected registerEventListeners(): void {
    // Do nothing for now
  }
}

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO used by subprocess
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

function showSubProcessMonitoringData(bpmnVisualization: BpmnVisualization) {
  const caseMonitoring = new SubProcessCaseMonitoring(bpmnVisualization);
  caseMonitoring.showData();
}

export function hideSubCaseMonitoringData(bpmnVisualization: BpmnVisualization) {
  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO should not instantiated again here, this prevents to correctly unregister/destroy tippy instances
  const caseMonitoring = new SubProcessCaseMonitoring(bpmnVisualization);
  caseMonitoring.hideData();
}

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO trigger by main, but the logic should be only for subprocess
function showResourceAllocationAction() {
  // This should be managed by SubProcessNavigator
  displayView(subProcessViewName);
  showSubProcessMonitoringData(subProcessBpmnVisualization);
  /*
    TO FIX: currently the code assumes that there's only one enabled shape
  */
  // TO COMPLETE: add interaction on the popover: on hover, highlight some activities
  // const enabledShapeId = caseMonitoringData.enabledShapes.values().next().value as string;
  // const enabledShape = subProcessBpmnVisualization.bpmnElementsRegistry.getElementsByIds(enabledShapeId)[0];
  // const popoverInstance = tippyInstances.find(instance => {
  //   if (instance.reference === enabledShape?.htmlElement) {
  //     return instance;
  //   }
  //
  //   return null;
  // });

  // if (popoverInstance) {
  //   // Add additional actions to the existing mouseover event listener
  //   /*
  //     The listener is NOT WORKING
  //   */
  //   popoverInstance.popper.addEventListener('mouseover', (event: MouseEvent) => {
  //     const target = event.target as HTMLElement;
  //     console.info('listener mouseover, target', target);
  //     // If (target.nodeName === 'TD') {
  //     //   const selectedRow = target.parentElement as HTMLTableRowElement;
  //     // }
  //   });
  // } else {
  //   console.log('instance not found');
  // }
}

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO trigger by main process
function showContactClientAction() {
  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO implement
  // eslint-disable-next-line no-alert -- will be remove with the final implementation
  window.alert('Clicked on showContactClientAction');
}

