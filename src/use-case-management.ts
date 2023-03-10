import {type BpmnVisualization} from 'bpmn-visualization';
import {hideCaseMonitoringData, showCaseMonitoringData} from './case-monitoring.js';
import {hideHappyPath, showHappyPath} from './process-monitoring.js';
import {ProcessVisualizer, SubProcessNavigator} from './diagram.js';

export function configureUseCaseSelectors(bpmnVisualization: BpmnVisualization) {
  const processVisualizer = new ProcessVisualizer(bpmnVisualization);
  const subProcessNavigator = new SubProcessNavigator(bpmnVisualization);

  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO try to having calling constructor for side effects
  // eslint-disable-next-line no-new
  new UseCaseSelector('radio-process-monitoring', () => {
    processVisualizer.hideManuallyTriggeredProcess(true);
    showHappyPath(bpmnVisualization);
  }, () => {
    hideHappyPath(bpmnVisualization);
  });
  // eslint-disable-next-line no-new
  new UseCaseSelector('radio-case-monitoring', () => {
    processVisualizer.hideManuallyTriggeredProcess();
    showCaseMonitoringData(bpmnVisualization);
  }, () => {
    hideCaseMonitoringData(bpmnVisualization);
  });

  const initialUseCase = new UseCaseSelector('radio-reset-all', () => {
    processVisualizer.showManuallyTriggeredProcess();
    subProcessNavigator.enable();
  }, () => {
    subProcessNavigator.disable();
  });
  initialUseCase.select();
}

let currentUseCase: UseCaseSelector | undefined;
class UseCaseSelector {
  constructor(private readonly id: string, selectCallback: () => void, private readonly unselectCallback: () => void) {
    document.querySelector(`#${id}`)?.addEventListener('click', () => {
      if (currentUseCase !== this) {
        currentUseCase?.unselect();
        selectCallback();
        // eslint-disable-next-line @typescript-eslint/no-this-alias,unicorn/no-this-assignment -- need to store this in a variable
        currentUseCase = this;
      }
    });
  }

  select() {
    const elt = document.querySelector(`#${(this.id)}`) ?? undefined;
    (elt as HTMLInputElement)?.click();
  }

  private unselect() {
    if (currentUseCase === this) {
      this.unselectCallback();
      currentUseCase = undefined;
    }
  }
}
