import {BpmnVisualization, FitType, type LoadOptions} from 'bpmn-visualization';
// eslint-disable-next-line n/file-extension-in-import -- Vite syntax
import mainDiagram from './diagrams/EC-purchase-orders-collapsed.bpmn?raw';
// eslint-disable-next-line n/file-extension-in-import -- Vite syntax
import subDiagram from './diagrams/SRM-subprocess.bpmn?raw';
import {removeSectionInBreadcrumb, addSectionInBreadcrumb} from './breadcrumb.js';

const sharedFitOptions = {type: FitType.Center, margin: 20};

export const sharedLoadOptions: LoadOptions = {fit: sharedFitOptions};

let currentView: View | undefined;

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO change the view/processId value. secondary is for the subprocess!! This impacts HTML elements
export const subProcessViewName = 'secondary';

type View = 'main' | 'secondary';

export const mainBpmnVisualization = new BpmnVisualization({container: 'main-bpmn-container'});
export const subProcessBpmnVisualization = new BpmnVisualization({container: 'secondary-bpmn-container'});

class DiagramLoadManager {
  private bpmnDiagramIsAlreadyLoad = false;

  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO do not store the diagram in the class
  constructor(private readonly bpmnVisualization: BpmnVisualization, private readonly diagram: string) {}

  ensureIsLoaded(): void {
    if (!this.bpmnDiagramIsAlreadyLoad) {
      this.bpmnVisualization.load(this.diagram, sharedLoadOptions);
      this.bpmnDiagramIsAlreadyLoad = true;
    }
  }

  isAlreadyLoad(): boolean {
    return this.bpmnDiagramIsAlreadyLoad;
  }
}

const mainProcessDiagramLoadManager = new DiagramLoadManager(mainBpmnVisualization, mainDiagram);
const subProcessDiagramLoadManager = new DiagramLoadManager(subProcessBpmnVisualization, subDiagram);

// eslint-disable-next-line no-warning-comments -- cannot be managed now
// TODO do not leak internal state
export const isSubProcessBpmnDiagramIsAlreadyLoad = () => subProcessDiagramLoadManager.isAlreadyLoad();

export function displayView(view: View): void {
  if (currentView === view) {
    return;
  }

  const mainBpmnContainerElt = document.querySelector('#main-bpmn-container')!;
  const subProcessBpmnContainerElt = document.querySelector('#secondary-bpmn-container')!;

  switch (view) {
    case subProcessViewName: {
      addSectionInBreadcrumb();
      mainBpmnContainerElt.classList.add('d-hide');
      subProcessBpmnContainerElt.classList.remove('d-hide');
      subProcessDiagramLoadManager.ensureIsLoaded();
      break;
    }

    default: {
      removeSectionInBreadcrumb();
      mainBpmnContainerElt.classList.remove('d-hide');
      subProcessBpmnContainerElt.classList.add('d-hide');
      mainProcessDiagramLoadManager.ensureIsLoaded();
      break;
    }
  }

  currentView = view;
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

const doSubProcessNavigation = () => {
  displayView(subProcessViewName);
};

export class SubProcessNavigator {
  private subProcessHtmlElement: HTMLElement | undefined = undefined;

  constructor(private readonly bpmnVisualization: BpmnVisualization) {}

  enable() {
    this.getSubProcessHtmlElement().addEventListener('click', doSubProcessNavigation);
    this.bpmnVisualization.bpmnElementsRegistry.addCssClasses(subProcessId, 'c-hand');
  }

  disable() {
    this.getSubProcessHtmlElement().removeEventListener('click', doSubProcessNavigation);
    this.bpmnVisualization.bpmnElementsRegistry.removeCssClasses(subProcessId, 'c-hand');
  }

  private getSubProcessHtmlElement() {
    if (!this.subProcessHtmlElement) {
      this.subProcessHtmlElement = this.bpmnVisualization.bpmnElementsRegistry.getElementsByIds(subProcessId)[0].htmlElement;
    }

    return this.subProcessHtmlElement;
  }
}
