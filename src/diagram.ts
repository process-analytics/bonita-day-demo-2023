import {BpmnVisualization, FitType, type LoadOptions} from 'bpmn-visualization';
// eslint-disable-next-line n/file-extension-in-import -- Vite syntax
import subDiagram from './diagrams/SRM-subprocess.bpmn?raw';
import {removeSectionInBreadcrumb, addSectionInBreadcrumb} from './breadcrumb.js';

const sharedFitOptions = {type: FitType.Center, margin: 20};

export const sharedLoadOptions: LoadOptions = {fit: sharedFitOptions};
export let secondaryBpmnDiagramIsAlreadyLoad = false;
export let currentView = 'main';

// Secondary BPMN Container
export const secondaryBpmnVisualization = new BpmnVisualization({container: 'secondary-bpmn-container'});

export function displayBpmnDiagram(tabIndex: string): void {
  if (currentView === tabIndex) {
    return;
  }

  const mainBpmnContainerElt = document.querySelector('#main-bpmn-container')!;
  const secondaryBpmnContainerElt = document.querySelector('#secondary-bpmn-container')!;

  switch (tabIndex) {
    case 'secondary': {
      addSectionInBreadcrumb();
      mainBpmnContainerElt.classList.add('d-hide');
      secondaryBpmnContainerElt.classList.remove('d-hide');

      if (!secondaryBpmnDiagramIsAlreadyLoad) {
        // Load secondary diagram. Need to have the container displayed
        secondaryBpmnVisualization.load(subDiagram, sharedLoadOptions);
        secondaryBpmnDiagramIsAlreadyLoad = true;
      }

      break;
    }

    default: {
      removeSectionInBreadcrumb();
      mainBpmnContainerElt.classList.remove('d-hide');
      secondaryBpmnContainerElt.classList.add('d-hide');
      break;
    }
  }

  currentView = tabIndex;
}

const poolIdOfSubProcess = 'Participant_03ba50e';

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
        for (const cell of [poolIdOfSubProcess].map(id => model.getCell(id))) {
          model.setVisible(cell, true);
        }
      });
      this.bpmnVisualization.navigation.fit(sharedFitOptions);
    }

    this.bpmnVisualization.graph.batchUpdate(() => {
      for (const cell of [poolIdOfSubProcess].map(id => model.getCell(id))) {
        model.setVisible(cell, !hide);
      }
    });

    if (fitDiagram) {
      this.bpmnVisualization.navigation.fit(sharedFitOptions);
    }
  }
}

const subProcessId = 'Activity_0ec8azh';

const doSubProcessNavigation = () => {
  displayBpmnDiagram('secondary');
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
