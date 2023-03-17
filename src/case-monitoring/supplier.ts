import {type BpmnVisualization} from 'bpmn-visualization/*';
import {type Instance, type ReferenceElement} from 'tippy.js';
import {ProcessVisualizer} from '../diagram.js';
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
    const tippyInstance = this.tippySupport.addPopover(bpmnElementId);
    return tippyInstance;
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

  protected getContent(htmlElement: ReferenceElement) {
    return this.getEmailTemplateContent(htmlElement);
  }

  protected registerEventListeners(_instance: Instance): void {
    // TODO: Implement this method
  }

  private getEmailTemplateContent(htmlElement: ReferenceElement) {
    const popoverContent = `
        <div class="popover-container">
          <h5>Retrieving an email template</h5>
          <table>
            <tbody>
              <tr class="popover-row">
                <td class="popover-key">You</td>
                <td class="popover-value"><textarea>${this.userQuestion!}</textarea>
              </tr>
              <tr class="popover-row">
                <td class="popover-key">Chat GPT</td>
                <td class="popover-key"><textarea>${this.chatGptAnswer!}</textarea>
              </tr>
            </tbody>
          </table>
        </div>`;

    const bpmnSemantic = this.registeredBpmnElements.get(htmlElement);
    if (bpmnSemantic?.name === 'Review and adapt email') {
      // Add validate and abort buttons to the popover
    }

    return popoverContent;
  }
}

class SupplierContact {
  constructor(readonly bpmnVisualization: BpmnVisualization, readonly supplierMonitoring: SupplierProcessCaseMonitoring) {}

  async startInstance(): Promise<void> {
    // Add popover to "retrieve email suggestion"
    const retrieveEmailActivityId = new BpmnElementsSearcher(this.bpmnVisualization).getElementIdByName('Retrieve email suggestion');
    if (retrieveEmailActivityId !== undefined) {
      this.showInfo(retrieveEmailActivityId);
    }
  }

  protected showInfo(activityId: string): void {
    const tippySupportInstance = this.supplierMonitoring.getTippySupportInstance() as SupplierProcessTippySupport;
    if (tippySupportInstance !== undefined) {
      tippySupportInstance.setUserQuestion('Draft an email to ask the supplier xyz about the delay in the approval and the expected new arrival date');
      tippySupportInstance.setChatGptAnswer('Generating an email template...');
    }

    const tippyInstance = this.supplierMonitoring.addInfoOnChatGptActivity(activityId);
    tippyInstance.setProps({
      trigger: 'manual',
      arrow: false,
      hideOnClick: false,
    });
    tippyInstance.show();
  }
}

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO trigger by main process
export async function showContactSupplierAction(bpmnVisualization: BpmnVisualization): Promise<void> {
  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO implement

  // display contact supplier pool
  const processVisualizer = new ProcessVisualizer(bpmnVisualization);
  processVisualizer.showManuallyTriggeredProcess();

  const supplierMonitoring = new SupplierProcessCaseMonitoring(bpmnVisualization);
  const supplierContact = new SupplierContact(bpmnVisualization, supplierMonitoring);
  await supplierContact.startInstance();
}
