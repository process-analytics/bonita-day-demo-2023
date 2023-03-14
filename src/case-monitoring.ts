import tippy, {type Instance, type Props, type ReferenceElement} from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import type {BpmnElement, BpmnSemantic, BpmnVisualization} from 'bpmn-visualization';
import {getActivityRecommendationData} from './recommendation-data.js';
import {type CaseMonitoringData, getCaseMonitoringData} from './case-monitoring-data.js';
import {currentView, displayBpmnDiagram, secondaryBpmnVisualization} from './diagram.js';

// const tippyInstances: Instance[] = [];

// const registeredBpmnElements = new Map<Element, BpmnSemantic>();

// let caseMonitoringData: CaseMonitoringData;

abstract class AbstractCaseMonitoring {
  protected caseMonitoringData: CaseMonitoringData;
  protected tippySupport: AbstractTippySupport;

  constructor(protected readonly bpmnVisualization: BpmnVisualization, processId: string) {
    console.info('init CaseMonitoring, processId: %s / bpmn-container: %s', processId, bpmnVisualization.graph.container.id);
  // TODO initialization. Is it the right place?
    this.caseMonitoringData = getCaseMonitoringData(processId, this.bpmnVisualization);
    this.tippySupport = this.createTippySupportInstance(bpmnVisualization);
    console.info('DONE init CaseMonitoring, processId', processId)
  }

  protected abstract createTippySupportInstance(bpmnVisualization: BpmnVisualization): AbstractTippySupport;

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


  protected highlightRunningElements(): void {
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses(this.caseMonitoringData.runningActivities, 'state-running-late');
  }

  protected highlightEnabledElements(): void {
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses(this.caseMonitoringData.enabledShapes, 'state-enabled');
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

  private reduceVisibilityOfAlreadyExecutedElements(): void {
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses([...this.caseMonitoringData.executedShapes, ...this.caseMonitoringData.visitedEdges], 'state-already-executed');
  }

  private restoreVisibilityOfAlreadyExecutedElements() {
    // eslint-disable-next-line no-warning-comments -- question to answer by Nour
    // TODO why adding pending?  the CSS class was not added in reduceVisibilityOfAlreadyExecutedElements
    this.bpmnVisualization.bpmnElementsRegistry.removeCssClasses([...this.caseMonitoringData.executedShapes, ...this.caseMonitoringData.pendingShapes, ...this.caseMonitoringData.visitedEdges], 'state-already-executed');
  }

  private resetRunningElements() {
    const elements = this.caseMonitoringData.runningActivities;
    this.bpmnVisualization.bpmnElementsRegistry.removeCssClasses(elements, 'state-running-late');
    for (const elementId of elements) {
      this.bpmnVisualization.bpmnElementsRegistry.removeAllOverlays(elementId);
    }

    this.tippySupport.removeAllPopovers();
    // tippy instances should be managed in a dedicated class
    // Unregister tippy instances
    // for (const instance of tippyInstances) {
    //   instance.destroy();
    // }
    //
    // tippyInstances.length = 0;
  }
}

class MainProcessCaseMonitoring extends AbstractCaseMonitoring {
  protected highlightRunningElements(): void {
    super.highlightRunningElements();
    this.addInfoOnRunningElements(this.caseMonitoringData.runningActivities);
  }

  private addInfoOnRunningElements(bpmnElementIds: string[]) {
    for (const bpmnElementId of bpmnElementIds) {
      this.tippySupport.addPopover(bpmnElementId);
      this.addOverlay(bpmnElementId);
    }
  }

  protected createTippySupportInstance(bpmnVisualization: BpmnVisualization): AbstractTippySupport {
    return new MainProcessTippySupport(bpmnVisualization);
  }
}

/**
 * Currently handle the SubProcess!!!
 */
class SecondaryProcessCaseMonitoring extends AbstractCaseMonitoring {
  protected highlightEnabledElements(): void {
    super.highlightEnabledElements();
    this.addInfoOnEnabledElements(this.caseMonitoringData.enabledShapes);
  }

  private addInfoOnEnabledElements(bpmnElementIds: string[]) {
    for (const bpmnElementId of bpmnElementIds) {
      this.tippySupport.addPopover(bpmnElementId);
      this.addOverlay(bpmnElementId);
    }
  }

  protected createTippySupportInstance(bpmnVisualization: BpmnVisualization): AbstractTippySupport {
    return new SubProcessTippySupport(bpmnVisualization);
  }
}

export function showCaseMonitoringData(processId: string, bpmnVisualization: BpmnVisualization) {
  // TODO change the view/processId value. secondary is for the subprocess!!
  // TODO argument order compared to the function
  const caseMonitoring = processId === 'main' ? new MainProcessCaseMonitoring(bpmnVisualization, processId) : new SecondaryProcessCaseMonitoring(bpmnVisualization, processId);
  caseMonitoring.showData();

  // caseMonitoringData = getCaseMonitoringData(processId, bpmnVisualization);
  //
  // reduceVisibilityOfAlreadyExecutedElements(bpmnVisualization);
  // highlightRunningElements(bpmnVisualization);
  // highlightEnabledElements(bpmnVisualization);

  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO what is it for?
  // registerInteractions(bpmnVisualization);
}


export function hideCaseMonitoringData(processId: string, bpmnVisualization: BpmnVisualization) {
  // TODO should not instantiated again here
  const caseMonitoring = processId === 'main' ? new MainProcessCaseMonitoring(bpmnVisualization, processId) : new SecondaryProcessCaseMonitoring(bpmnVisualization, processId);
  caseMonitoring.hideData();


  // caseMonitoringData = getCaseMonitoringData(processId, bpmnVisualization);
  // restoreVisibilityOfAlreadyExecutedElements(bpmnVisualization);
  // resetRunningElements(bpmnVisualization);
}

// function reduceVisibilityOfAlreadyExecutedElements(bpmnVisualization: BpmnVisualization) {
//   bpmnVisualization.bpmnElementsRegistry.addCssClasses([...caseMonitoringData.executedShapes, ...caseMonitoringData.visitedEdges], 'state-already-executed');
// }

// function restoreVisibilityOfAlreadyExecutedElements(bpmnVisualization: BpmnVisualization) {
//   // eslint-disable-next-line no-warning-comments -- question to answer by Nour
//   // TODO why adding pending?  the CSS class was not added in reduceVisibilityOfAlreadyExecutedElements
//   bpmnVisualization.bpmnElementsRegistry.removeCssClasses([...caseMonitoringData.executedShapes, ...caseMonitoringData.pendingShapes, ...caseMonitoringData.visitedEdges], 'state-already-executed');
// }

// function highlightRunningElements(bpmnVisualization: BpmnVisualization) {
//   const elements = caseMonitoringData.runningActivities;
//   bpmnVisualization.bpmnElementsRegistry.addCssClasses(elements, 'state-running-late');
//   if (currentView === 'main') {
//     addInfoOnRunningElements(elements, bpmnVisualization);
//   }
// }

// function highlightEnabledElements(bpmnVisualization: BpmnVisualization) {
//   const elements = caseMonitoringData.enabledShapes;
//   bpmnVisualization.bpmnElementsRegistry.addCssClasses(elements, 'state-enabled');
//   if (currentView === 'secondary') {
//     addInfoOnEnabledElements(elements, bpmnVisualization);
//   }
// }

// function resetRunningElements(bpmnVisualization: BpmnVisualization) {
//   const elements = caseMonitoringData.runningActivities;
//   bpmnVisualization.bpmnElementsRegistry.removeCssClasses(elements, 'state-running-late');
//   for (const activityId of elements) {
//     bpmnVisualization.bpmnElementsRegistry.removeAllOverlays(activityId);
//   }
//
//   // Unregister tippy instances
//   for (const instance of tippyInstances) {
//     instance.destroy();
//   }
//
//   tippyInstances.length = 0;
// }

// only used by the main case monitoring
// function addInfoOnRunningElements(bpmnElementIds: string[], bpmnVisualization: BpmnVisualization) {
//   for (const bpmnElementId of bpmnElementIds) {
//     addPopover(bpmnElementId, bpmnVisualization);
//     addOverlay(bpmnElementId, bpmnVisualization);
//   }
// }

// only used by the subprocess case monitoring
// function addInfoOnEnabledElements(bpmnElementIds: string[], bpmnVisualization: BpmnVisualization) {
//   for (const bpmnElementId of bpmnElementIds) {
//     addPopover(bpmnElementId, bpmnVisualization);
//     addOverlay(bpmnElementId, bpmnVisualization);
//   }
// }


abstract class AbstractTippySupport {

  protected registeredBpmnElements = new Map<Element, BpmnSemantic>();

  private tippyInstances: Instance[] = [];

  constructor(private readonly bpmnVisualization: BpmnVisualization) {}

  private registerBpmnElement(bpmnElement: BpmnElement) {
    this.registeredBpmnElements.set(bpmnElement.htmlElement, bpmnElement.bpmnSemantic);
  }

  addPopover(bpmnElementId: string) {
    const bpmnElement = this.bpmnVisualization.bpmnElementsRegistry.getElementsByIds(bpmnElementId)[0];
    this.registerBpmnElement(bpmnElement);

    // TODO temp find a better way
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
      // TODO on click to easily inspect
      // trigger: 'mouseenter',
      trigger: 'click',
      onShown(instance: Instance): void {
        instance.setContent(thisInstance.getContent(instance.reference));
        // TODO this part is specific to the use case
        if (currentView === 'main') {
          console.info("Main view, registering event listener")
          // instance.setContent(thisInstance.getRecommendationInfoAsHtml(instance.reference));
          // eslint-disable-next-line no-warning-comments -- cannot be managed now
          // TODO avoid hard coding or manage this in the same class that generate 'getRecommendationInfoAsHtml'
          // eslint-disable-next-line no-warning-comments -- cannot be managed now
          // TODO only register the event listener once, or destroy it onHide
          const contactClientBtn = document.querySelector('#Contact-Client');
          console.info('tippy on show: contactClientBtn', contactClientBtn);
          if (contactClientBtn) {
            console.info('tippy on show: registering event listener on click');
            contactClientBtn.addEventListener('click', () => {
              showContactClientAction();
            });
          }

          const allocateResourceBtn = document.querySelector('#Allocate-Resource');
          console.info('tippy on show: allocateResourceBtn', allocateResourceBtn);
          if (allocateResourceBtn) {
            console.info('tippy on show: registering event listener on click');
            allocateResourceBtn.addEventListener('click', () => {
              showResourceAllocationAction();
            });
          }
        }
        // else {
        //   instance.setContent(getWarningInfoAsHtml());
        // }
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


  // private getRecommendationInfoAsHtml(htmlElement: ReferenceElement) {
  //   let popoverContent = `
  //       <div class="popover-container">
  //       <h4>Task running late</h4>
  //       <p>Here are some suggestions:</p>
  //       <table>
  //         <tbody>`;
  //
  //   const bpmnSemantic = this.registeredBpmnElements.get(htmlElement);
  //   const activityRecommendationData = getActivityRecommendationData(bpmnSemantic?.name ?? '');
  //   for (const recommendation of activityRecommendationData) {
  //     // Replace space with hyphen (-) to be passed as the button id
  //     const buttonId = recommendation.title.replace(/\s+/g, '-');
  //     popoverContent += `
  //           <tr class="popover-row">
  //               <td class="popover-key">${recommendation.title}</td>
  //               <td class="popover-value">${recommendation.description}</td>
  //               <td class="popover-action">
  //                   <button id="${buttonId}">Act</button>
  //               </td>
  //           </tr>
  //       `;
  //   }
  //
  //   popoverContent += `
  //               </tbody>
  //           </table>
  //       </div>
  //   `;
  //   return popoverContent;
  // }

}

class MainProcessTippySupport extends AbstractTippySupport {

  protected getContent(htmlElement: ReferenceElement) {
    console.info("getContent main process")
    return this.getRecommendationInfoAsHtml(htmlElement);
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

}

// used by both, should be split
// function addPopover(bpmnElementId: string, bpmnVisualization: BpmnVisualization) {
//   const bpmnElement = bpmnVisualization.bpmnElementsRegistry.getElementsByIds(bpmnElementId)[0];
//   registerBpmnElement(bpmnElement);
//
//   const tippyInstance = tippy(bpmnElement.htmlElement, {
//     theme: 'light',
//     placement: 'bottom',
//     appendTo: bpmnVisualization.graph.container,
//     content: 'Loading...',
//     arrow: true,
//     interactive: true,
//     // eslint-disable-next-line @typescript-eslint/naming-convention -- tippy type
//     allowHTML: true,
//     trigger: 'mouseenter',
//     onShown(instance: Instance): void {
//       if (currentView === 'main') {
//         instance.setContent(getRecommendationInfoAsHtml(instance.reference));
//         // eslint-disable-next-line no-warning-comments -- cannot be managed now
//         // TODO avoid hard coding or manage this in the same class that generate 'getRecommendationInfoAsHtml'
//         // eslint-disable-next-line no-warning-comments -- cannot be managed now
//         // TODO only register the event listener once, or destroy it onHide
//         const contactClientBtn = document.querySelector('#Contact-Client');
//         console.info('tippy on show: contactClientBtn', contactClientBtn);
//         if (contactClientBtn) {
//           console.info('tippy on show: registering event listener on click');
//           contactClientBtn.addEventListener('click', () => {
//             showContactClientAction();
//           });
//         }
//
//         const allocateResourceBtn = document.querySelector('#Allocate-Resource');
//         console.info('tippy on show: allocateResourceBtn', allocateResourceBtn);
//         if (allocateResourceBtn) {
//           console.info('tippy on show: registering event listener on click');
//           allocateResourceBtn.addEventListener('click', () => {
//             showResourceAllocationAction();
//           });
//         }
//       } else {
//         instance.setContent(getWarningInfoAsHtml());
//       }
//     },
//   } as Partial<Props>);
//
//   tippyInstances.push(tippyInstance);
// }

// used by main process and subprocess
// function addOverlay(bpmnElementId: string, bpmnVisualization: BpmnVisualization) {
//   bpmnVisualization.bpmnElementsRegistry.addOverlays(bpmnElementId, {
//     position: 'top-right',
//     label: '?',
//     style: {
//       font: {color: '#fff', size: 16},
//       fill: {color: '#4169E1'},
//       stroke: {color: '#4169E1', width: 2},
//     },
//   });
// }

// use by tippy
// function registerBpmnElement(bpmnElement: BpmnElement) {
//   registeredBpmnElements.set(bpmnElement.htmlElement, bpmnElement.bpmnSemantic);
// }

// used by main
// function getRecommendationInfoAsHtml(htmlElement: ReferenceElement) {
//   let popoverContent = `
//         <div class="popover-container">
//         <h4>Task running late</h4>
//         <p>Here are some suggestions:</p>
//         <table>
//           <tbody>`;
//
//   const bpmnSemantic = registeredBpmnElements.get(htmlElement);
//   const activityRecommendationData = getActivityRecommendationData(bpmnSemantic?.name ?? '');
//   for (const recommendation of activityRecommendationData) {
//     // Replace space with hyphen (-) to be passed as the button id
//     const buttonId = recommendation.title.replace(/\s+/g, '-');
//     popoverContent += `
//             <tr class="popover-row">
//                 <td class="popover-key">${recommendation.title}</td>
//                 <td class="popover-value">${recommendation.description}</td>
//                 <td class="popover-action">
//                     <button id="${buttonId}">Act</button>
//                 </td>
//             </tr>
//         `;
//   }
//
//   popoverContent += `
//                 </tbody>
//             </table>
//         </div>
//     `;
//   return popoverContent;
// }

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


// TODO trigger by main, but the logic should be only for subprocess
function showResourceAllocationAction() {
  displayBpmnDiagram('secondary');
  showCaseMonitoringData('secondary', secondaryBpmnVisualization);
  /*
    TO FIX: currently the code assumes that there's only one enabled shape
  */
  // TO COMPLETE: add interaction on the popover: on hover, highlight some activities
  // const enabledShapeId = caseMonitoringData.enabledShapes.values().next().value as string;
  // const enabledShape = secondaryBpmnVisualization.bpmnElementsRegistry.getElementsByIds(enabledShapeId)[0];
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

// TODO trigger by main process
function showContactClientAction() {
  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO implement
  // eslint-disable-next-line no-alert -- will be remove with the final implementation
  window.alert('Clicked on showContactClientAction');
}

