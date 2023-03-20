import {type BpmnVisualization} from 'bpmn-visualization/*';
import {type Instance, type ReferenceElement} from 'tippy.js';
import {mainBpmnVisualization as bpmnVisualization, ProcessVisualizer} from '../diagram.js';
import {BpmnElementsSearcher} from '../utils/bpmn-elements.js';
import {AbstractCaseMonitoring, AbstractTippySupport} from './abstract.js';

class SupplierProcessCaseMonitoring extends AbstractCaseMonitoring {
  constructor(bpmnVisualization: BpmnVisualization) {
    super(bpmnVisualization, 'main');
  }

  getTippySupportInstance() {
    return this.tippySupport;
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

  protected createTippySupportInstance(bpmnVisualization: BpmnVisualization): AbstractTippySupport {
    return new SupplierProcessTippySupport(bpmnVisualization);
  }
}

class SupplierProcessTippySupport extends AbstractTippySupport {
  protected userQuestion: string | undefined = 'Write a short email to ask the supplier about the delay';
  protected chatGptAnswer: string | undefined = 'Generating email template';

  constructor(protected readonly bpmnVisualization: BpmnVisualization) {
    super(bpmnVisualization);
  }

  setUserQuestion(userQuestion: string) {
    this.userQuestion = userQuestion;
  }

  setChatGptAnswer(chatGptAnswer: string) {
    this.chatGptAnswer = chatGptAnswer;
  }

  protected getContent(_htmlElement: ReferenceElement) {
    return this.getEmailTemplateContent();
  }

  private getEmailTemplateContent() {
    let popoverContent = `
        <div class="popover-container">
          <table>
            <tbody>`;
    if (this.chatGptAnswer === '') {
      popoverContent += `
              <tr>
                <td colspan="2" class="text-center">Generating answer...</td>
              </tr>
            </tbody>
          </table>`;
    } else {
      popoverContent += `
              <tr>
                <td>Prompt: </td>
                <td><textarea cols="30" rows="3">${this.userQuestion!}</textarea>
              </tr>       
              <tr>
                <td>ChatGPT:</td>
                <td><textarea cols="30" rows="3">${this.chatGptAnswer!}</textarea>
              </tr>
            </tbody>
          </table>`;

      // Add buttons
      popoverContent += `
        <div class="mt-2 columns">
          <div class="column col-4 text-left"><button id="abort" class="btn btn-sm btn-error">Abort</button></div>
          <div class="column col-4 text-center"><button id="genarate" class="btn btn-sm btn-success">Generate</button></div>
          <div class="column col-4 text-right"><button id="validate" class="btn btn-sm btn-success">Validate</button></div>
        </div>
      `;
    }

    popoverContent += '</div>';
    return popoverContent;
  }
}

class SupplierContact {
  // Store all created instances, so that they can be aborted from outside the class
  static instances: SupplierContact[] = [];

  // Stope all cases
  static stopAllCases(): void {
    for (const supplierInstance of SupplierContact.instances) {
      supplierInstance.stopCase();
    }

    SupplierContact.instances.splice(0);
  }

  // Create an AbortController
  // required to stope the execution of the async function startInstance
  private readonly abortController: AbortController = new AbortController();

  constructor(readonly bpmnVisualization: BpmnVisualization, readonly supplierMonitoring: SupplierProcessCaseMonitoring) {
    SupplierContact.instances.push(this);
  }

  async startCase(): Promise<void> {
    let prompt = '';
    let answer = '';
    let emailRetrievalTippyInstance: Instance | undefined;
    let emailReviewTippyInstance: Instance | undefined;

    // Add and show popover to "retrieve email suggestion"
    const retrieveEmailActivityId = new BpmnElementsSearcher(this.bpmnVisualization).getElementIdByName('Retrieve email suggestion');
    if (retrieveEmailActivityId !== undefined) {
      prompt = 'Draft an email to ask about the supplier about the delay';
      emailRetrievalTippyInstance = this.addInfo(retrieveEmailActivityId, prompt, answer);
      emailRetrievalTippyInstance.show();
    }

    // Call chatgptAPI
    answer = 'chatgpt answer';

    // Wait for 5 seconds before resolving the Promise
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 5000);
    });

    // Check if cancellation is requested
    if (this.abortController.signal.aborted) {
      console.log('cancelation requested 1');
      throw new Error('Supplier instance canceled');
    }

    // Add and show popover to "Review and adapt email"
    if (emailRetrievalTippyInstance !== undefined) {
      emailRetrievalTippyInstance.hide();
    }

    const reviewEmailActivityId = new BpmnElementsSearcher(this.bpmnVisualization).getElementIdByName('Review and adapt email');
    if (reviewEmailActivityId !== undefined) {
      emailReviewTippyInstance = this.addInfo(reviewEmailActivityId, prompt, answer);
      emailReviewTippyInstance.show();
    }

    // Wait for 5 seconds before resolving the Promise
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 5000);
    });

    // Completed, remove instance from supplierContactInstances
    // hide data and hide pool
    this.endCase();
  }

  // Cancel the execution of the async startCase
  stopCase(): void {
    this.abortController.abort();
  }

  endCase(): void {
    // Remove current instance from the list
    const index = SupplierContact.instances.indexOf(this);
    if (index > -1) {
      SupplierContact.instances.splice(index, 1);
    }

    // Hide data
    this.supplierMonitoring.hideData();
    // Hide pool
    processVisualizer.hideManuallyTriggeredProcess();
  }

  protected addInfo(activityId: string, prompt: string, answer: string) {
    const tippySupportInstance = this.supplierMonitoring.getTippySupportInstance() as SupplierProcessTippySupport;
    if (tippySupportInstance !== undefined) {
      tippySupportInstance.setUserQuestion(prompt);
      tippySupportInstance.setChatGptAnswer(answer);
    }

    const tippyInstance = this.supplierMonitoring.addInfoOnChatGptActivity(activityId);
    tippyInstance.setProps({
      trigger: 'manual',
      arrow: false,
      hideOnClick: false,
    });
    return tippyInstance;
  }
}

const supplierMonitoring = new SupplierProcessCaseMonitoring(bpmnVisualization);
const processVisualizer = new ProcessVisualizer(bpmnVisualization);

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO trigger by main process
export async function showContactSupplierAction(): Promise<void> {
  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO implement

  // display contact supplier pool
  processVisualizer.showManuallyTriggeredProcess();

  // In case the contact button is selected multiple times, abort current execution, clean and then start a new case
  hideSupplierContactData();

  const supplierContact = new SupplierContact(bpmnVisualization, supplierMonitoring);
  supplierContact.startCase()
    .then(() => {
      console.log('Supplier instance completed successfully');
    })
    .catch((error: Error) => {
      console.log(`Supplier instance failed with error: ${error.message}`);
    });
}

export function hideSupplierContactData() {
  if (SupplierContact.instances.length > 0) {
    SupplierContact.stopAllCases();
  }

  supplierMonitoring.hideData();
}
