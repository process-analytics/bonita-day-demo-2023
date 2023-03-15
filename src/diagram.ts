import {BpmnVisualization, FitType, type LoadOptions} from 'bpmn-visualization';
// eslint-disable-next-line n/file-extension-in-import -- Vite syntax
import subDiagram from './diagrams/SRM-subprocess.bpmn?raw';
import {removeSectionInBreadcrumb, addSectionInBreadcrumb} from './breadcrumb.js';

const sharedFitOptions = {type: FitType.Center, margin: 20};

export const sharedLoadOptions: LoadOptions = {fit: sharedFitOptions};
// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO do not leak internal state
// eslint-disable-next-line import/no-mutable-exports -- will be refactored later
export let subProcessBpmnDiagramIsAlreadyLoad = false;
// eslint-disable-next-line import/no-mutable-exports -- will be refactored later
export let currentView = 'main';

// BPMN container of the sub-process
export const subProcessBpmnVisualization = new BpmnVisualization({container: 'secondary-bpmn-container'});

export function displayBpmnDiagram(tabIndex: string): void {
  if (currentView === tabIndex) {
    return;
  }

  const mainBpmnContainerElt = document.querySelector('#main-bpmn-container')!;
  const subProcessBpmnContainerElt = document.querySelector('#secondary-bpmn-container')!;

  switch (tabIndex) {
    case subProcessViewName: {
      addSectionInBreadcrumb();
      mainBpmnContainerElt.classList.add('d-hide');
      subProcessBpmnContainerElt.classList.remove('d-hide');

      if (!subProcessBpmnDiagramIsAlreadyLoad) {
        // Load secondary diagram. Need to have the container displayed
        subProcessBpmnVisualization.load(subDiagram, sharedLoadOptions);
        subProcessBpmnDiagramIsAlreadyLoad = true;
      }

      break;
    }

    default: {
      removeSectionInBreadcrumb();
      mainBpmnContainerElt.classList.remove('d-hide');
      subProcessBpmnContainerElt.classList.add('d-hide');
      break;
    }
  }

  currentView = tabIndex;
}

const poolIdOfSecondProcess = 'Participant_03ba50e';

export class ProcessVisualizer {
  constructor(private readonly bpmnVisualization: BpmnVisualization) {}

  showManuallyTriggeredProcess = (): void => {
    this.changePoolVisibility(false, true);
  };

  hideManuallyTriggeredProcess = (fitDiagram = false): void => {
    this.changePoolVisibility(true, fitDiagram);
  };

  private changePoolVisibility(hide = false, fitDiagram = false) {
    const model = this.bpmnVisualization.graph.getModel();

    // To ensure that the rendering is not affected by previous "hide then fit"
    // Fit the whole diagram again: make it visible, then fit, then hide
    if (hide && !fitDiagram) {
      this.bpmnVisualization.graph.batchUpdate(() => {
        for (const cell of [poolIdOfSecondProcess].map(id => model.getCell(id))) {
          model.setVisible(cell, true);
        }
      });
      this.bpmnVisualization.navigation.fit(sharedFitOptions);
    }

    this.bpmnVisualization.graph.batchUpdate(() => {
      for (const cell of [poolIdOfSecondProcess].map(id => model.getCell(id))) {
        model.setVisible(cell, !hide);
      }
    });

    if (fitDiagram) {
      this.bpmnVisualization.navigation.fit(sharedFitOptions);
    }
  }
}

const subProcessId = 'Activity_0ec8azh';

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO change the view/processId value. secondary is for the subprocess!! This impacts HTML elements
export const subProcessViewName = 'secondary';

const doSubProcessNavigation = () => {
  displayBpmnDiagram(subProcessViewName);
};

export class SubProcessNavigator {
  private readonly subProcessHtmlElement: HTMLElement;

  constructor(private readonly bpmnVisualization: BpmnVisualization) {
    this.subProcessHtmlElement = this.bpmnVisualization.bpmnElementsRegistry.getElementsByIds(subProcessId)[0].htmlElement;
  }

  enable() {
    this.subProcessHtmlElement.addEventListener('click', doSubProcessNavigation);
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses(subProcessId, 'c-hand');
  }

  disable() {
    this.subProcessHtmlElement.removeEventListener('click', doSubProcessNavigation);
    this.bpmnVisualization.bpmnElementsRegistry.removeCssClasses(subProcessId, 'c-hand');
  }
}
