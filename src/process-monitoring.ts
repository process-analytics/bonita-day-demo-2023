// Initially taken from https://github.com/process-analytics/icpm-demo-2022/blob/v1.0.0/src/happy-path.js

import {type BpmnElementsRegistry, type BpmnVisualization} from 'bpmn-visualization';
import tippy, {type Instance, type Props} from 'tippy.js';
import 'tippy.js/animations/scale.css';
import {BpmnElementsIdentifier} from './utils/bpmn-elements.js';
import {delay} from './utils/shared.js';

/* Start event --> SRM subprocess
  --> vendor creates order item --> create purchase order item
  --> Record goods receipt --> record invoice receipt --> clear invoice
  --> end event */
const happyPath = [
  'Event_1vogvxc',
  'Flow_0i9hf3x',
  'Gateway_0xh0plz',
  // Activate paths after the first parallel gateway
  'Flow_06ca3ya',
  'Activity_0ec8azh',
  'Flow_0re9mrf',
  'Event_0e43ncy',
  'Flow_0yxnijf',
  'Activity_1t65hvk',
  // Activate the path after subprocess
  'Flow_1y1kscn',
  'Gateway_0apcz1e',
  // Record Goods Receipt
  'Flow_1448s6h',
  'Activity_00vbm9s',
  // Gateway after parallel
  'Flow_0j5xinh',
  'Gateway_08gf298',
  // End "Create Purchase Order Item" branch
  'Flow_1a9zw3d',
  // End "Service Entry Sheet Needed?" branch
  'Flow_0wd8pwa',
  'Gateway_0jqn9hp',
  'Flow_1nxinu7',
  // End "Record Goods Receipts" branch
  'Flow_14tr1q9',
  // Finalize the Subprocess path
  'Gateway_01gpztl',
  'Flow_19cdedl',
  // End "Vendor Create Invoice" branch
  'Flow_0hpz0ab',
  // Finalize the 1st part of the path
  'Gateway_0domayw',
  // Last path elements
  'Flow_06uo70h',
  'Activity_1u4jwkv',
  'Flow_0lrixjg',
  'Gateway_0a68dfj',
  'Flow_1lkft1n',
  'Gateway_1ezcj46',
  'Flow_1kkicvr',
  'Activity_0yabbur',
  'Flow_12q12yb',
  'Event_07598zy',
];

const happyPathElementWithPopover = 'Event_1vogvxc';

const speedFactor = 1; // For now, it is only used while debugging to accelerate the animation. In the future, it could be used to let user choose the animation speed.
const animationDuration = speedFactor;
const animationDurationOfEdgeArrow = 0.3 * speedFactor;

const animationDelay = animationDuration / 2;
const animationDurationOfEdgeLine = animationDuration - animationDurationOfEdgeArrow;

export class ProcessMonitoring {
  private readonly bpmnElementsRegistry: BpmnElementsRegistry;
  private readonly bpmnElementsIdentifier: BpmnElementsIdentifier;
  constructor(private readonly bpmnVisualization: BpmnVisualization) {
    this.bpmnElementsRegistry = bpmnVisualization.bpmnElementsRegistry;
    this.bpmnElementsIdentifier = new BpmnElementsIdentifier(bpmnVisualization);
  }

  start() {
    this.configureResetButton();
    this.showHappyPath();
  }

  stop() {
    this.configureResetButton(false);
    this.hideHappyPath();
  }

  private configureResetButton(enable = true) {
    const btnElement = document.querySelector<HTMLButtonElement>('#' + this.bpmnVisualization.graph.container.id + ' #btn-reset');
    if (btnElement) {
      if (enable) {
        btnElement.classList.remove('d-hide');
        btnElement.addEventListener('click', this.resetHappyPath);
      } else {
        btnElement.classList.add('d-hide');
        btnElement.removeEventListener('click', this.resetHappyPath);
      }
    }
  }

  private showHappyPath() {
    const headElt = document.querySelectorAll('head')[0];

    /* Iterate over the elements in the happyPath
     apply css and add a delay so that we see the css applied in a sequential manner */
    for (const [index, elementId] of happyPath.entries()) {
      const {classToAdd, styleInnerHtml} = this.getHappyPathClasses(index, elementId);

      const style = document.createElement('style');
      style.id = elementId;
      style.type = 'text/css';
      style.innerHTML = styleInnerHtml;
      headElt.append(style);

      this.bpmnElementsRegistry.addCssClasses(elementId, [classToAdd, `animate-${elementId}`]);
    }

    // Add popover
    const tippyInstance = this.addPopover(happyPathElementWithPopover);
    // Show after 1 sec
    delay(1000).then(() => {
      tippyInstance.show();
    })
      .catch(error => {
        console.error('Error showing popover:', error);
      });
  }

  private hideHappyPath() {
    this.bpmnElementsRegistry.removeCssClasses(happyPath, [
      'highlight-happy-path',
      'pulse-happy',
      'gateway-happy',
      'growing-happy',
      ...happyPath.map(elementId => {
        const styleOfElement = document.querySelector(`#${elementId}`);
        styleOfElement?.parentNode?.removeChild(styleOfElement);
        return `animate-${elementId}`;
      }),
    ]);

    // Remove popover
    this.removePopover(happyPathElementWithPopover);
  }

  private readonly resetHappyPath = () => {
    Promise.resolve()
      .then(() => {
        this.hideHappyPath();
      })
      .then(() => {
        this.showHappyPath();
      })
      .catch(error => {
        console.error('Error while resetting the happy path', error);
      });
  };

  private getHappyPathClasses(index: number, elementId: string) {
    const delay = index * animationDelay;

    let classToAdd;
    let styleInnerHtml;
    if (this.bpmnElementsIdentifier.isActivity(elementId)) {
      styleInnerHtml = `.animate-${elementId} > rect { animation-delay: ${delay}s; animation-duration: ${animationDuration}s; }`;
      classToAdd = 'pulse-happy';
    } else if (this.bpmnElementsIdentifier.isEvent(elementId)) {
      styleInnerHtml = `.animate-${elementId} > ellipse { animation-delay: ${delay}s; animation-duration: ${animationDuration}s; }`;
      classToAdd = 'pulse-happy';
    } else if (this.bpmnElementsIdentifier.isGateway(elementId)) {
      styleInnerHtml = `.animate-${elementId} > path { animation-delay: ${delay}s; animation-duration: ${animationDuration}s; }`;
      classToAdd = 'gateway-happy';
    } else {
      // Flow
      styleInnerHtml
          = `.animate-${elementId} > path:nth-child(2) { animation-delay: ${delay}s; animation-duration: ${animationDurationOfEdgeLine}s; }
.animate-${elementId} > path:nth-child(3) { animation-delay: ${delay + (animationDurationOfEdgeLine / 2)}s; animation-duration: ${animationDurationOfEdgeArrow}s; }`;
      classToAdd = 'growing-happy';
    }

    return {classToAdd, styleInnerHtml};
  }

  private addPopover(bpmnElementId: string) {
    const bpmnElement = this.bpmnElementsRegistry.getElementsByIds(bpmnElementId)[0];

    return tippy(bpmnElement.htmlElement, {
      placement: 'top',
      animation: 'scale',
      appendTo: this.bpmnVisualization.graph.container,
      content: '913 cases (86.36%) <br/> ⏳ 2.08 months',
      arrow: true,
      interactive: true,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- tippy type
      allowHTML: true,
      trigger: 'manual',
      hideOnClick: false,
    } as Partial<Props>);
  }

  private removePopover(bpmnElementId: string) {
    const bpmnElement = this.bpmnElementsRegistry.getElementsByIds(bpmnElementId)[0];
    const htmlElement = bpmnElement.htmlElement;
    if ('_tippy' in htmlElement) {
      (htmlElement._tippy as Instance).destroy();
    }
  }
}

