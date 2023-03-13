const activities = new Map<string, string>();
activities.set('Activity_0ec8azh', 'SRM subprocess');
activities.set('Activity_1t65hvk', 'Create Purchase Order Item');
activities.set('Activity_06cvihl', 'Record Service Entry Sheet');
activities.set('Activity_00vbm9s', 'Record Goods Receipts');
activities.set('Activity_1u4jwkv', 'Record Invoice Receipt');
activities.set('Activity_083jf01', 'Remove Payment Block');
activities.set('Activity_0yabbur', 'Clear Invoice');

const gateways = new Map<string, string>();
gateways.set('Gateway_0xh0plz', 'parallelGatewaySplit1');
gateways.set('Gateway_0domayw', 'parallelGatewayJoin1');
gateways.set('Gateway_0apcz1e', 'parallelGatewaySplit2');
gateways.set('Gateway_01gpztl', 'parallelGatewayJoin2');
gateways.set('Gateway_08gf298', 'exclusiveGatewaySplit1');
gateways.set('Gateway_0jqn9hp', 'exclusiveGatewayJoin1');
gateways.set('Gateway_0a68dfj', 'exclusiveGatewaySplit2');
gateways.set('Gateway_1ezcj46', 'exclusiveGatewayJoin2');

const events = new Map<string, string>();
events.set('Event_1vogvxc', 'New POI Needed');
events.set('Event_0e43ncy', 'Vendor Creates Invoice');
events.set('Event_07598zy', 'endEvent');

export function isActivity(elementId: string): boolean {
  return activities.has(elementId);
}

export function isGateway(elementId: string): boolean {
  return gateways.has(elementId);
}

export function isEvent(elementId: string): boolean {
  return events.has(elementId);
}

export function getElementIdByName(elementName: string): string | undefined {
  for (const [key, value] of activities.entries()) {
    if (value === elementName) {
      return key;
    }
  }

  for (const [key, value] of events.entries()) {
    if (value === elementName) {
      return key;
    }
  }

  return undefined;
}
