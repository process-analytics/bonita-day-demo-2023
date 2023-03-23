import {type BpmnVisualization} from 'bpmn-visualization';
import {type Instance, type ReferenceElement} from 'tippy.js';
import {mainBpmnVisualization as bpmnVisualization, ProcessVisualizer} from '../diagram.js';
import {AbstractCaseMonitoring, AbstractTippySupport} from './abstract.js';
import {getExecutionStepAfterReviewEmailChoice, ProcessExecutor} from './supplier-utils.js';

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
    // Activity retrieve email suggestion
    if (bpmnSemantic?.id === 'Activity_04d6t36') {
      return this.getEmailRetrievalContent();
    }
    // Activity Review and adapt email

    return this.getEmailReviewContent();
  }

  protected registerEventListeners(instance: Instance): void {
    this.manageEventListeners(instance, true);
  }

  protected unregisterEventListeners(instance: Instance): void {
    this.manageEventListeners(instance, false);
  }

  private manageEventListeners(instance: Instance, register: boolean): void {
    // Abort button
    const abortBtn = document.querySelector(`#${instance.popper.id} #abort`);
    if (abortBtn) {
      if (register) {
        abortBtn.addEventListener('click', this.onAbortClick);
      } else {
        abortBtn.removeEventListener('click', this.onAbortClick);
      }
    }

    // Validate button
    const validateBtn = document.querySelector(`#${instance.popper.id} #validate`);
    if (validateBtn) {
      if (register) {
        validateBtn.addEventListener('click', this.onValidateClick);
      } else {
        validateBtn.removeEventListener('click', this.onValidateClick);
      }
    }

    // Generate new email button
    const generateBtn = document.querySelector(`#${instance.popper.id} #generate`);
    if (generateBtn) {
      if (register) {
        generateBtn.addEventListener('click', this.onGenerateClick);
      } else {
        generateBtn.removeEventListener('click', this.onGenerateClick);
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

  private readonly onAbortClick = () => {
    this.hidePopoverOnClick();
    supplierContact.abortClicked();
  };

  private readonly onValidateClick = () => {
    this.hidePopoverOnClick();
    supplierContact.validateClicked();
  };

  private readonly onGenerateClick = () => {
    this.hidePopoverOnClick();
    supplierContact.generateClicked();
  };

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
          <div class="column col-4 text-center"><button id="generate" class="btn btn-sm btn-success">Generate</button></div>
          <div class="column col-4 text-right"><button id="validate" class="btn btn-sm btn-success">Validate</button></div>
        </div>`;

    popoverContent += '</div>';
    return popoverContent;
  }
}

class SupplierContact {
  private processExecutor?: ProcessExecutor;

  constructor(private readonly bpmnVisualization: BpmnVisualization, readonly supplierMonitoring: SupplierProcessCaseMonitoring) {}

  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO this could should really be async!!!
  async startCase(): Promise<void> {
    console.info('called startCase');
    this.processExecutor = new ProcessExecutor(this.bpmnVisualization, this.onEndCase, this.emailRetrievalOperations);
    const processExecutorStarter = Promise.resolve(this.processExecutor);

    console.info('Registering ProcessExecutor start');
    processExecutorStarter.then(async processExecutor => processExecutor.start())
      // ignored - to be improved see https://typescript-eslint.io/rules/no-floating-promises/
      .finally(() => {
        // Nothing to do
      });
    console.info('ProcessExecutor start registered');
  }

  abortClicked() {
    console.log('Abort clicked');
    const nextExecutionStep = getExecutionStepAfterReviewEmailChoice('abort');
    console.info('@@nextExecutionStep', nextExecutionStep);
    this.processExecutor?.execute(nextExecutionStep)
      .then(result => {
        console.log('Execution result:', result);
      })
      .catch(error => {
        console.error(error);
      });
  }

  validateClicked() {
    console.log('Validate clicked');
    const nextExecutionStep = getExecutionStepAfterReviewEmailChoice('validated');
    console.info('@@nextExecutionStep', nextExecutionStep);
    this.processExecutor?.execute(nextExecutionStep)
      .then(result => {
        console.log('Execution result:', result);
      })
      .catch(error => {
        console.error(error);
      });
  }

  generateClicked() {
    console.log('Generate clicked');
    const nextExecutionStep = getExecutionStepAfterReviewEmailChoice('regenerate');
    console.info('@@nextExecutionStep', nextExecutionStep);
    this.processExecutor?.execute(nextExecutionStep)
      .then(result => {
        console.log('Execution result:', result);
      })
      .catch(error => {
        console.error(error);
      });
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
    tippyInstance.show();
    return tippyInstance;
  }

  // =====================================================================================================================
  // For future usage, register dynamically this method at ProcessExecutor initialization
  // =====================================================================================================================

  // update/set the execution step action to call this function
  private readonly emailRetrievalOperations = async (activityId: string): Promise<void> => {
    // Same logic as in SupplierProcessTippySupport
    // Activity "review email"
    if (activityId === 'Activity_1oxewnq') {
      return Promise.resolve()
        .then(() => this.addInfo(activityId))
        .then(() => {
          console.info('review email popover is displayed!');
        });
    }

    async function delay(ms: number, args: any) {
      // eslint-disable-next-line no-promise-executor-return -- cannot be managed now
      return new Promise(timeup => setTimeout(timeup, ms, args));
    }

    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO too much promises here
    const firstDelay = 1500;
    const secondDelay = 2000;
    return Promise.resolve()
      .then(() => this.addInfo(activityId))
      .then(tippyInstance => {
        console.info('register delay');
        delay(firstDelay, tippyInstance)
          .then(tippyInstance => {
            console.info('wait show email retrieval done - part 1');
            // TO DO manage types
            (tippyInstance as Instance).setContent('Please be patient....');
            console.info('content updated');
            delay(secondDelay, tippyInstance)
              .then(tippyInstance => {
                console.info('wait show email retrieval done - part 2');
                (tippyInstance as Instance).hide();
                console.info('popover hidden');
                // Hard coded for now, could be pass a method parameter in the future
                // eslint-disable-next-line @typescript-eslint/no-floating-promises -- cannot be managed now
                this.processExecutor?.execute('Activity_1oxewnq');
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
