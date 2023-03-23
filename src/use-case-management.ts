import {newMainProcessCaseMonitoring} from './case-monitoring/main-process.js';
import {
  mainBpmnVisualization as bpmnVisualization,
  ProcessVisualizer,
  SubProcessNavigator,
  displayView,
} from './diagram.js';
import {ProcessMonitoring} from './process-monitoring.js';

const displayMainView = () => {
  displayView('main');
};

export const defaultUseCase = 'reset-all';

export function configureUseCaseSelectors(selectedUseCase: string) {
  const processVisualizer = new ProcessVisualizer(bpmnVisualization);
  const subProcessNavigator = new SubProcessNavigator(bpmnVisualization);

  const processMonitoring = new ProcessMonitoring(bpmnVisualization);
  const mainProcessCaseMonitoring = newMainProcessCaseMonitoring(bpmnVisualization);

  const useCases = new Map<string, UseCaseSelector>();
  useCases.set('process-monitoring', new UseCaseSelector('radio-process-monitoring', () => {
    processVisualizer.hideManuallyTriggeredProcess(true);
    processMonitoring.showHappyPath();
  }, () => {
    processMonitoring.showHappyPath();
  }));
  useCases.set('case-monitoring', new UseCaseSelector('radio-case-monitoring', () => {
    processVisualizer.hideManuallyTriggeredProcess();
    mainProcessCaseMonitoring.showData();
  }, () => {
    mainProcessCaseMonitoring.hideData();
  }));
  useCases.set('reset-all', new UseCaseSelector('radio-reset-all', () => {
    processVisualizer.showManuallyTriggeredProcess();
    subProcessNavigator.enable();
  }, () => {
    subProcessNavigator.disable();
  }));

  (useCases.get(selectedUseCase) ?? useCases.get(defaultUseCase))?.select();
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
