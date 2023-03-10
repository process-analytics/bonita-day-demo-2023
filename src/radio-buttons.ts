import {type BpmnVisualization} from 'bpmn-visualization';
import {hideMonitoringData, showMonitoringData} from './case-monitoring.js';

/**
 * @param {BpmnVisualization} bpmnVisualization
 */
export function configureRadioButtons(bpmnVisualization: BpmnVisualization) {
  new RadioButton('monitoring', () => {
    showMonitoringData(bpmnVisualization);
  }, () => {
    hideMonitoringData(bpmnVisualization);
  });
  new RadioButton('reset_all', () => {}, () => () => {});
}

class RadioButton {
  private static checkedRadioButton: RadioButton | undefined = undefined;
  private readonly hideCallback: () => void;

  constructor(id: string, showCallback: () => void, hideCallback: () => void) {
    this.hideCallback = hideCallback;

    document.querySelector(`#${id}`)?.addEventListener('click', () => {
      if (RadioButton.checkedRadioButton !== this) {
        RadioButton.checkedRadioButton?.hide();
        showCallback();
        RadioButton.checkedRadioButton = this;
      }
    });
  }

  hide() {
    if (RadioButton.checkedRadioButton === this) {
      this.hideCallback();
      RadioButton.checkedRadioButton = undefined;
    }
  }
}
