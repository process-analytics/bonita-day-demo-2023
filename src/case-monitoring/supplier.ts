import {type BpmnVisualization} from 'bpmn-visualization';
import {type Instance, type ReferenceElement} from 'tippy.js';
import {mainBpmnVisualization as bpmnVisualization, ProcessVisualizer} from '../diagram.js';
import {BpmnElementsSearcher} from '../utils/bpmn-elements.js';
import {AbstractCaseMonitoring, AbstractTippySupport} from './abstract.js';
import {getExecutionStepAfterReviewEmailChoice, ProcessExecutor, type ReviewEmailDecision} from './supplier-utils.js';

class SupplierProcessCaseMonitoring extends AbstractCaseMonitoring {
  constructor(bpmnVisualization: BpmnVisualization, tippySupport: SupplierProcessTippySupport) {
    super(bpmnVisualization, 'main', tippySupport);
  }

  addInfoOnChatGptActivity(bpmnElementId: string) {
    return this.tippySupport.addPopover(bpmnElementId);
  }

  hideData(): void {
    console.info('start hideData / contact supplier pool');
    // Only popovers for now
    this.tippySupport.removeAllPopovers();
    console.info('end hideData / contact supplier pool');
  }
}

class SupplierProcessTippySupport extends AbstractTippySupport {
  constructor(protected readonly bpmnVisualization: BpmnVisualization) {
    super(bpmnVisualization);
  }

  protected getContent(htmlElement: ReferenceElement) {
    const bpmnSemantic = this.registeredBpmnElements.get(htmlElement);
    // Activity retreieve email suggestion
    if (bpmnSemantic?.id === 'Activity_04d6t36') {
      return this.getEmailRetrievalContent();
    }
    // Activity Review and adapt email

    return this.getEmailReviewContent();
  }

  private getEmailRetrievalContent() {
    return `
        <div class="popover-container">
          <div>Generating email...</div>
        </div>`;
  }

  private getEmailReviewContent() {
    const prompt = getPrompt();
    const answer = getAnswer();
    let popoverContent = `
        <div class="popover-container">
          <table>
            <tbody>
              <tr>
                <td>Prompt: </td>
                <td><textarea cols="30" rows="3">${prompt}</textarea>
              </tr>       
              <tr>
                <td>ChatGPT:</td>
                <td><textarea cols="30" rows="3">${answer}</textarea>
              </tr>
            </tbody>
          </table>`;

    // Add buttons
    popoverContent += `
        <div class="mt-2 columns">
          <div class="column col-4 text-left"><button id="abort" class="btn btn-sm btn-error">Abort</button></div>
          <div class="column col-4 text-center"><button id="genarate" class="btn btn-sm btn-success">Generate</button></div>
          <div class="column col-4 text-right"><button id="validate" class="btn btn-sm btn-success">Validate</button></div>
        </div>`;

    popoverContent += '</div>';
    return popoverContent;
  }
}

class SupplierContact {
  private readonly bpmnElementsSearcher: BpmnElementsSearcher;

  private processExecutor?: ProcessExecutor;

  constructor(private readonly bpmnVisualization: BpmnVisualization, readonly supplierMonitoring: SupplierProcessCaseMonitoring) {
    this.bpmnElementsSearcher = new BpmnElementsSearcher(this.bpmnVisualization);
  }

  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO this could should really be async!!!
  async startCase(): Promise<void> {
    console.info('called startCase');
    this.processExecutor = new ProcessExecutor(this.bpmnVisualization, this.onEndCase);
    const processExecutorStarter = Promise.resolve(this.processExecutor);

    // TMP for dev only
    // In the future, this will be managed by the buttons of the popover attached to 'Review and Adapt Email'
    const bpmnElementsRegistry = this.bpmnVisualization.bpmnElementsRegistry;

    function registerInteractionForDevOnly(processExecutor: ProcessExecutor): void {
      console.info('Register interaction for dev only');
      const registerReviewDecisionOnClick = function (bpmnElementId: string, decision: ReviewEmailDecision) {
        const gwChoiceHtmlElt = bpmnElementsRegistry.getElementsByIds(bpmnElementId)[0].htmlElement;
        gwChoiceHtmlElt.addEventListener('click', () => {
          console.info('@@clicked choice %s --> %s', bpmnElementId, decision);
          const nextExecutionStep = getExecutionStepAfterReviewEmailChoice(decision);
          console.info('@@nextExecutionStep', nextExecutionStep);
          processExecutor.execute(nextExecutionStep)
          // ignored - to be improved see https://typescript-eslint.io/rules/no-floating-promises/
            .finally(() => {
              // Nothing to do
            });
          console.info('@@registered execution of nextExecutionStep', nextExecutionStep);
        });
      };

      registerReviewDecisionOnClick('Gateway_0ng9ln7', 'validated');
      registerReviewDecisionOnClick('Activity_1oxewnq', 'regenerate');
      registerReviewDecisionOnClick('Event_13tn0ty', 'abort');
      console.info('DONE Register interaction for dev only');
    }

    processExecutorStarter.then(processExecutor => {
      registerInteractionForDevOnly(processExecutor);
      return processExecutor;
    })
      // ignored - to be improved see https://typescript-eslint.io/rules/no-floating-promises/
      .finally(() => {
        // Nothing to do
      });
    // END OF - TMP for dev only
    console.info('Registering ProcessExecutor start');
    processExecutorStarter.then(async processExecutor => processExecutor.start())
      // ignored - to be improved see https://typescript-eslint.io/rules/no-floating-promises/
      .finally(() => {
        // Nothing to do
      });
    console.info('ProcessExecutor start registered');

    console.info('Register tmp popover management');
    Promise.resolve().then(async () => this.tmpRegisterPopoverMgt())
      // ignored - to be improved see https://typescript-eslint.io/rules/no-floating-promises/
      .finally(() => {
        // Nothing to do
      });
    console.info('Tmp popover management registered');
  }

  // Cancel the execution of the async startCase
  stopCase(): void {
    this.onEndCase();
  }

  onEndCase = (): void => {
    // Hide data
    this.supplierMonitoring.hideData();
    // Hide pool
    processVisualizer.hideManuallyTriggeredProcess();
  };

  protected addInfo(activityId: string) {
    const tippyInstance = this.supplierMonitoring.addInfoOnChatGptActivity(activityId);
    // TippyInstance.setContent('the content to set manually - chatgpt is working');
    tippyInstance.setProps({
      trigger: 'manual',
      arrow: false,
      hideOnClick: false,
    });
    return tippyInstance;
  }

  // Temp implementation Popover management. This will change and will be triggered by the ProcessExecutor in a near future
  private async tmpRegisterPopoverMgt(): Promise<void> {
    let emailRetrievalTippyInstance: Instance | undefined;
    let emailReviewTippyInstance: Instance | undefined;

    // Add and show popover to "retrieve email suggestion"
    const retrieveEmailActivityId = this.bpmnElementsSearcher.getElementIdByName('Retrieve email suggestion');
    if (retrieveEmailActivityId !== undefined) {
      emailRetrievalTippyInstance = this.addInfo(retrieveEmailActivityId);
      emailRetrievalTippyInstance.show();
    }

    // Wait for 5 seconds before resolving the Promise
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 5000);
    });

    // Add and show popover to "Review and adapt email"
    if (emailRetrievalTippyInstance !== undefined) {
      emailRetrievalTippyInstance.hide();
    }

    const reviewEmailActivityId = this.bpmnElementsSearcher.getElementIdByName('Review and adapt email');
    if (reviewEmailActivityId !== undefined) {
      emailReviewTippyInstance = this.addInfo(reviewEmailActivityId);
      emailReviewTippyInstance.show();
    }

    // Wait for 5 seconds before resolving the Promise
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 5000);
    });

    // // Completed, remove instance from supplierContactInstances
    // // hide data and hide pool
    // this.onEndCase();
  }

  // =====================================================================================================================
  // For future usage, register dynamically this method at ProcessExecutor initialization
  // =====================================================================================================================

  // update/set the execution step action to call this function
  // async emailRetrievalOperations() {
  //   await Promise.resolve()
  //       .then(() => this.showEmailRetrievalPopover())
  //       .then((result) => new Promise(resolve => setTimeout(() => resolve(result), 1000)))
  //       .then(() => console.info('wait show email retrieval 1 done'))
  //   ;
  // }
  //
  // // private emailRetrievalTippyInstance?: Instance;
  // private showEmailRetrievalPopover() {
  //   const retrieveEmailActivityId = this.bpmnElementsSearcher.getElementIdByName('Retrieve email suggestion')!;
  //   const tippySupport = this.supplierMonitoring.getTippySupportInstance();
  //
  //   // const tippyInstance = this.supplierMonitoring.addPopoverOnElement(activityId);
  //   const tippyInstance = tippySupport.addPopover(retrieveEmailActivityId);
  //   tippyInstance.setContent('The content of the manually displayed instance);
  //   tippyInstance.setProps({
  //     trigger: 'manual',
  //     arrow: false,
  //     hideOnClick: false,
  //   });
  //   // return tippyInstance;
  //
  //   // prompt = 'Draft an email to ask about the supplier about the delay';
  //   // this.emailRetrievalTippyInstance = this.addInfo(retrieveEmailActivityId, 'Draft an email to ask about the supplier about the delay', 'answer');
  //   tippyInstance.show();
  //   return tippyInstance;
  // }
}

// =====================================================================================================================
// use by MainProcessCaseMonitoring
// =====================================================================================================================

const supplierContact = new SupplierContact(bpmnVisualization, new SupplierProcessCaseMonitoring(bpmnVisualization, new SupplierProcessTippySupport(bpmnVisualization)));
const processVisualizer = new ProcessVisualizer(bpmnVisualization);

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO rename into showSupplierContactData
export async function showContactSupplierAction(): Promise<void> {
  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO manage processVisualizer consistently
  //   in supplierContact like for stopCase or outside like startCase
  return Promise.resolve()
    .then(() => {
      console.info('init done, before showManuallyTriggeredProcess');
    })
    .then(() => {
      processVisualizer.showManuallyTriggeredProcess();
    })
    .then(() => {
      console.info('showManuallyTriggeredProcess executed');
    })
    .then(async () => supplierContact.startCase())
    .then(() => {
      console.info('Supplier case started successfully');
    });
}

export function hideSupplierContactData() {
  supplierContact.stopCase();
}

// Ideally user input
function getPrompt() {
  return 'Draft a short email to ask the supplier about the delay';
}

// Call to chat gpt API
function getAnswer() {
  return 'chatGPT answer';
}
