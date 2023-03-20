import {type BpmnVisualization} from 'bpmn-visualization/*';
import {type ReferenceElement} from 'tippy.js';
import {mainBpmnVisualization, ProcessVisualizer} from '../diagram.js';
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
  // Create an AbortController
  //required to stope the execution of the async function startInstance
  private abortController: AbortController = new AbortController();
  //store all created instances, so that they can be aborted from outside the class
  static supplierContactInstances: SupplierContact[] = [];

  constructor(readonly bpmnVisualization: BpmnVisualization, readonly supplierMonitoring: SupplierProcessCaseMonitoring) {
    SupplierContact.supplierContactInstances.push(this);
  }

  async startCase(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      let prompt = '';
      let answer = '';
      let emailRetrievalTippyInstance;
      let emailReviewTippyInstance;

      // Add and show popover to "retrieve email suggestion"
      const retrieveEmailActivityId = new BpmnElementsSearcher(this.bpmnVisualization).getElementIdByName('Retrieve email suggestion');
      if (retrieveEmailActivityId !== undefined) {
        prompt = 'Draft an email to ask about the supplier about the delay';
        emailRetrievalTippyInstance = this.addInfo(retrieveEmailActivityId, prompt, answer);
        emailRetrievalTippyInstance.show();
      }

      // Call chatgptAPI
      answer = 'chatgpt answer';
      await new Promise<void>(resolve => {
        setTimeout(() => {
          resolve();
        }, 5000);
      });

      //check if cancellation is requested
      if (this.abortController.signal.aborted) {
        console.log('cancelation requested 1');
        reject(new Error('Supplier instance canceled'));
        return;
      }

      // Add and show popover to "Review and adapt email"
      if (emailRetrievalTippyInstance) {
        emailRetrievalTippyInstance.hide();
      }

      const reviewEmailActivityId = new BpmnElementsSearcher(this.bpmnVisualization).getElementIdByName('Review and adapt email');
      if (reviewEmailActivityId !== undefined) {
        emailReviewTippyInstance = this.addInfo(reviewEmailActivityId, prompt, answer);
        emailReviewTippyInstance.show();
      }

      //check if cancellation is requested
      if (this.abortController.signal.aborted) {
        console.log('cancelation requested 2');
        reject(new Error('Supplier instance canceled'));
        return;
      }

      resolve();
    });
  }

  //cancel the execution of the async startCase
  stopCase(): void{
    this.abortController.abort();
  }
  //stope all cases
  static stopAllCases() {
    for (const supplierInstance of SupplierContact.supplierContactInstances) {
      supplierInstance.stopCase();
    }
    SupplierContact.supplierContactInstances.splice(0);
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

const supplierMonitoring = new SupplierProcessCaseMonitoring(mainBpmnVisualization);

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO trigger by main process
export async function showContactSupplierAction(bpmnVisualization: BpmnVisualization): Promise<void> {
  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO implement

  // display contact supplier pool
  const processVisualizer = new ProcessVisualizer(bpmnVisualization);
  processVisualizer.showManuallyTriggeredProcess();

  //in case the contact button is selected multiple times, abort current execution, clean and then start a new case
  hideSupplierContactData();

  const supplierContact = new SupplierContact(bpmnVisualization, supplierMonitoring);
  supplierContact.startCase()
                  .then(() => console.log('Supplier instance completed successfully'))
                  .catch((err) => console.log(`Supplier instance failed with error: ${err.message}`));

}

export function hideSupplierContactData(){
  if(SupplierContact.supplierContactInstances.length > 0){
    SupplierContact.stopAllCases();
  }
  supplierMonitoring.hideData();
}
