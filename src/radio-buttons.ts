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
  new RadioButton('reset_all', () => {
    // Do nothing on purpose
  }, () => () => {
    // Do nothing on purpose
  });
}

class RadioButton {
  private static checkedRadioButton: RadioButton | undefined = undefined;

  constructor(id: string, showCallback: () => void, private readonly hideCallback: () => void) {
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
