import {hideSubCaseMonitoringData, MainProcessCaseMonitoring} from './case-monitoring.js';
import {
  mainBpmnVisualization as bpmnVisualization,
  ProcessVisualizer,
  isSubProcessBpmnDiagramIsAlreadyLoad,
  subProcessBpmnVisualization,
  SubProcessNavigator,
  displayView,
} from './diagram.js';
import {hideHappyPath, showHappyPath} from './process-monitoring.js';

const displayMainView = () => {
  displayView('main');
};

export function configureUseCaseSelectors(selectedUseCase: string) {
  const processVisualizer = new ProcessVisualizer(bpmnVisualization);
  const subProcessNavigator = new SubProcessNavigator(bpmnVisualization);

  const mainProcessCaseMonitoring = new MainProcessCaseMonitoring(bpmnVisualization);

  const useCases = new Map<string, UseCaseSelector>();
  useCases.set('process-monitoring', new UseCaseSelector('radio-process-monitoring', () => {
    processVisualizer.hideManuallyTriggeredProcess(true);
    showHappyPath(bpmnVisualization);
  }, () => {
    hideHappyPath(bpmnVisualization);
  }));
  useCases.set('case-monitoring', new UseCaseSelector('radio-case-monitoring', () => {
    processVisualizer.hideManuallyTriggeredProcess();
    mainProcessCaseMonitoring.showData();
  }, () => {
    mainProcessCaseMonitoring.hideData();
    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO move the logic into case-monitoring or ideally in the subprocess navigator which should manage the data hide
    if (isSubProcessBpmnDiagramIsAlreadyLoad()) {
      hideSubCaseMonitoringData(subProcessBpmnVisualization);
    }
  }));
  useCases.set('reset-all', new UseCaseSelector('radio-reset-all', () => {
    processVisualizer.showManuallyTriggeredProcess();
    subProcessNavigator.enable();
  }, () => {
    subProcessNavigator.disable();
  }));

  // TODO manage unknown use case
  useCases.get(selectedUseCase)?.select();
}

let currentUseCase: UseCaseSelector | undefined;
class UseCaseSelector {
  constructor(private readonly id: string, selectCallback: () => void, private readonly unselectCallback: () => void) {
    document.querySelector(`#${id}`)?.addEventListener('click', () => {
      if (currentUseCase !== this) {
        currentUseCase?.unselect();
        displayMainView();
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
