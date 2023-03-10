import {type BpmnVisualization} from 'bpmn-visualization';
import {hideCaseMonitoringData, showCaseMonitoringData} from './case-monitoring.js';

/**
 * @param {BpmnVisualization} bpmnVisualization
 */
export function configureRadioButtons(bpmnVisualization: BpmnVisualization) {
  // eslint-disable-next-line no-warning-comments -- cannot be managed now
  // TODO try to having calling constructor for side effects

  // eslint-disable-next-line no-new
  new RadioButton('radio-case-monitoring', () => {
    showCaseMonitoringData(bpmnVisualization);
  }, () => {
    hideCaseMonitoringData(bpmnVisualization);
  });
  // eslint-disable-next-line no-new
  new RadioButton('radio-reset-all', () => {
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
