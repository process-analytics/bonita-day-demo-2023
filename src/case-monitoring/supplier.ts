import {type BpmnVisualization} from 'bpmn-visualization';
import {type Instance, type Props, type ReferenceElement} from 'tippy.js';
import {mainBpmnVisualization as bpmnVisualization, ProcessVisualizer} from '../diagram.js';
import {delay} from '../utils/shared.js';
import {disableUseCaseSelectors, enableUseCaseSelectors} from '../use-case-selectors';
import {AbstractCaseMonitoring, AbstractTippySupport} from './abstract.js';
import {type MainProcessCaseMonitoring} from './main-process.js';
import {type InnerActionParameters, ProcessExecutor, type ReviewEmailDecision} from './supplier-utils.js';

class SupplierProcessCaseMonitoring extends AbstractCaseMonitoring {
  constructor(bpmnVisualization: BpmnVisualization, tippySupport: SupplierProcessTippySupport) {
    super(bpmnVisualization, 'main', tippySupport);
  }

  displayInfoOnChatGptActivity(parameters: InnerActionParameters) {
    return (this.tippySupport as SupplierProcessTippySupport).addChatGptPopover(parameters);
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

  // For ChatGPT popovers, we cannot only rely on the super.addPopover method
  // We manage 2 popovers, that don't have the same design
  // We need specific methods to add/remove listeners on "review email" buttons
  addChatGptPopover(parameters: InnerActionParameters) {
    const elementId = parameters.elementId;
    const tippyInstance = this.addPopover(elementId);
    // Activity_04d6t36 chatGPT activity
    // Activity_1oxewnq review email
    const isChatGptActivity = elementId === 'Activity_04d6t36';
    const tippyProps: Partial<Props> = {
      theme: isChatGptActivity ? 'light' : '',
      trigger: 'manual',
      arrow: !isChatGptActivity,
      hideOnClick: false,
      placement: isChatGptActivity ? 'bottom' : 'top',
      // Default is 350px
      maxWidth: isChatGptActivity ? '350px' : '450px',
    };

    // Review and adapt email
    if (elementId === 'Activity_1oxewnq') {
      console.info('SupplierProcessTippySupport.addChatGptPopover detected "Review Email"" activity');

      // eslint-disable-next-line no-warning-comments -- cannot be managed now
      // TODO temp find a better way
      // eslint-disable-next-line @typescript-eslint/no-this-alias,unicorn/no-this-assignment -- temp
      const thisInstance = this;
      tippyProps.onShown = (instance: Instance) => {
        // Kind of duplication with AbstractTippySupport but we cannot use the regular registerEventListeners/unregisterEventListeners and the getContent methods.
        // We must pass more parameters to the related methods.
        instance.setContent(thisInstance.getEmailReviewContent(parameters));
        thisInstance.manageEmailReviewEventListeners(instance, true, parameters);
      };

      tippyProps.onHide = (instance: Instance) => {
        thisInstance.manageEmailReviewEventListeners(instance, false, parameters);
      };
    }

    tippyInstance.setProps(tippyProps);
    return tippyInstance;
  }

  protected getContent(htmlElement: ReferenceElement) {
    const bpmnSemantic = this.registeredBpmnElements.get(htmlElement);
    // Activity retrieve email suggestion
    if (bpmnSemantic?.id === 'Activity_04d6t36') {
      return this.getEmailRetrievalContent();
    }

    // Activity Review and adapt email --> manage in "addChatGptPopover"
    return '';
  }

  private manageEmailReviewEventListeners(tippyInstance: Instance, register: boolean, parameters: InnerActionParameters): void {
    const listener = (event: Event): void => {
      console.info('manageEmailReviewEventListeners: called listener', event);
      this.hidePopoverOnClick();

      const button = event.target as HTMLButtonElement;
      const decision = button.id as ReviewEmailDecision;
      console.info('manageEmailReviewEventListeners: decision', decision);
      parameters.resume(decision)
        .then(() => {
          console.info('manageEmailReviewEventListeners, end of call resume with decision', decision);
        })
        .catch(error => {
          console.error('manageEmailReviewEventListeners, end of call resume with decision "%s"', decision, error);
        });
    };

    const allButtons = document.querySelectorAll(`#${tippyInstance.popper.id} #abort,#validate,#generate`);
    console.info('manageEmailReviewEventListeners, allButtons', allButtons);
    for (const button of allButtons) {
      if (register) {
        button.addEventListener('click', listener);
      } else {
        button.removeEventListener('click', listener);
      }
    }
  }

  private hidePopoverOnClick(): void {
    const bpmnElementId = 'Activity_1oxewnq'; // Hard coded for now "review and adapt email"

    // Duplicated with process-monitoring removePopover --> candidate to extract for reuse
    const bpmnElement = bpmnVisualization.bpmnElementsRegistry.getElementsByIds(bpmnElementId)[0];
    const htmlElement = bpmnElement.htmlElement;
    if ('_tippy' in htmlElement) {
      (htmlElement._tippy as Instance).hide();
    }
  }

  private getEmailRetrievalContent() {
    return `
        <div class="popover-container">
          <div>Generating email...</div>
        </div>`;
  }

  private getEmailReviewContent(parameters: InnerActionParameters) {
    const prompt = getPrompt();
    const answer = getAnswer(parameters.executionCount);
    return `<div class="popover-container">
          <h4>Review email proposed by ChatGPT</h4>
          <table>
            <tbody>
              <tr>
                <td>Suggestion</td>
                <td><textarea cols="30" rows="6">${answer}</textarea>
              </tr>
              <tr>
                <td>Prompt</td>
                <td><textarea cols="30" rows="3">${prompt}</textarea>
              </tr>
            </tbody>
          </table>
        <div class="mt-2 columns">
          <div class="column col-4 text-left"><button id="abort" class="btn btn-sm btn-error">Abort</button></div>
          <div class="column col-4 text-center"><button id="generate" class="btn btn-sm btn-success">Generate</button></div>
          <div class="column col-4 text-right"><button id="validate" class="btn btn-sm btn-success">Validate</button></div>
        </div>
      </div>`;
  }
}

class SupplierContact {
  private readonly processExecutor: ProcessExecutor;
  private mainProcessCaseMonitoring?: MainProcessCaseMonitoring;

  constructor(private readonly bpmnVisualization: BpmnVisualization, readonly supplierMonitoring: SupplierProcessCaseMonitoring) {
    this.processExecutor = new ProcessExecutor(this.bpmnVisualization, this.onEndCase, this.emailRetrievalOperations);
  }

  setMainProcessCaseMonitoring(mainProcessCaseMonitoring: MainProcessCaseMonitoring) {
    this.mainProcessCaseMonitoring = mainProcessCaseMonitoring;
  }

  async startCase(): Promise<void> {
    console.info('called startCase');
    disableUseCaseSelectors();
    const processExecutorStarter = Promise.resolve(this.processExecutor);
    console.info('Registering ProcessExecutor start');
    processExecutorStarter.then(async processExecutor => processExecutor.start())
      // ignored - to be improved see https://typescript-eslint.io/rules/no-floating-promises/
      .finally(() => {
        // Nothing to do
      });
    console.info('ProcessExecutor start registered');
  }

  // Cancel the execution of the async startCase
  stopCase(): void {
    this.supplierMonitoring.hideData();
    processVisualizer.hideManuallyTriggeredProcess();
  }

  onEndCase = (): void => {
    this.stopCase();
    enableUseCaseSelectors();
    this.mainProcessCaseMonitoring?.resume();
  };

  protected displayInfoInPopover(parameters: InnerActionParameters) {
    const tippyInstance = this.supplierMonitoring.displayInfoOnChatGptActivity(parameters);
    tippyInstance.show();
    return tippyInstance;
  }

  // =====================================================================================================================
  // Called by the ProcessExecutor
  // =====================================================================================================================

  // update/set the execution step action to call this function
  private readonly emailRetrievalOperations = async (parameters: InnerActionParameters): Promise<void> => {
    console.info('emailRetrievalOperations, parameters', parameters);
    // Same logic as in SupplierProcessTippySupport
    // Activity "review email"
    const elementId = parameters.elementId;
    if (elementId === 'Activity_1oxewnq') {
      return Promise.resolve()
        .then(() => this.displayInfoInPopover(parameters))
        .then(() => {
          console.info('review email popover is displayed!');
        });
    }

    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO too much promises here
    const firstDelay = 1500;
    const secondDelay = 2000;
    return Promise.resolve()
      .then(() => this.displayInfoInPopover(parameters))
      .then(tippyInstance => {
        console.info('register delay');
        delay(firstDelay, tippyInstance)
          .then(tippyInstance => {
            console.info('wait show email retrieval done - part 1');
            // TO DO manage types
            (tippyInstance as Instance).setContent(this.getChatGptWaitMessage());
            console.info('content updated');
            delay(secondDelay, tippyInstance)
              .then(tippyInstance => {
                console.info('wait show email retrieval done - part 2');
                (tippyInstance as Instance).hide();
                console.info('popover hidden');
              })
              .then(() => {
                parameters.resume()
                  .catch(error => {
                    console.error('Error while resuming %s', parameters.elementId, error);
                  });
              })
              .finally(() => {
                console.info('End of second delay mgt');
              });
          })
          .finally(() => {
            console.info('End of first delay mgt');
          });
      },
      );
  };

  private getChatGptWaitMessage(): string {
    return `<div style="display: flex; width: 11rem;">
    <div class="loading mr-2" style="flex-basis: 1rem;"></div>
    <div>ChatGPT is working for you...</div>
  </div>`;
  }
}

// =====================================================================================================================
// use by MainProcessCaseMonitoring
// =====================================================================================================================

const supplierContact = new SupplierContact(bpmnVisualization, new SupplierProcessCaseMonitoring(bpmnVisualization, new SupplierProcessTippySupport(bpmnVisualization)));
const processVisualizer = new ProcessVisualizer(bpmnVisualization);

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO rename into showSupplierContactData
export async function showContactSupplierAction(mainProcessCaseMonitoring: MainProcessCaseMonitoring): Promise<void> {
  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO manage processVisualizer consistently
  //   in supplierContact like for stopCase or outside like startCase
  supplierContact.setMainProcessCaseMonitoring(mainProcessCaseMonitoring);
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
    .then(() => {
      mainProcessCaseMonitoring.pause();
    })
    .then(async () => supplierContact.startCase())
    .then(() => {
      console.info('Supplier case started successfully');
    });
}

export function hideSupplierContactData() {
  supplierContact.stopCase();
}

// =================================================================================================================
// ChatGPT
// ================================================================================================================

const chatGptAnswers = [
  `Dear [Supplier Name],

  I am writing to inquire about the status of my recent order with your company. The expected delivery date has passed and I have not received any update on the status of the shipment.
  
  I understand that unexpected delays may occur, but I would greatly appreciate it if you could provide me with an update on the expected delivery date or any information regarding the delay. Please let me know if there are any issues with my order or if there is anything I can do to help expedite the process.
  
  Thank you for your attention to this matter, and I look forward to hearing back from you soon.
  
  Best regards,
  
  [Your Name]
  `,
  `Dear [Supplier Name],

  I wanted to check on the status of my recent order with your company. The expected delivery date has passed and I haven't received an update. Can you please provide me with an update on the status of the shipment?
  
  Thank you,
  
  [Your Name]
  `,
  `Dear [Supplier Name],

  I am writing to inquire about the status of our order, which was expected to be delivered by [expected delivery date]. However, we have yet to receive the shipment.
  
  Could you please provide us with an update on the current status of our order and the expected delivery date? We understand that unforeseen circumstances can cause delays and appreciate any information you can provide to help us track the progress of our order.
  
  Thank you for your attention to this matter, and we look forward to receiving the shipment soon.
  
  Best regards,
  [Your Name]`,
];

// Ideally user input
function getPrompt() {
  return 'Draft a short email to ask the supplier about the delay';
}

// Simulate the call to the ChatGPT API
function getAnswer(executionCount: number) {
  console.info('Getting ChatGPT answer for execution count', executionCount);
  return chatGptAnswers[executionCount % chatGptAnswers.length];
}
