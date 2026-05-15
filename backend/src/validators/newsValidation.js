const allowedElementIds = new Set([
  'river-central-axis',
  'left-landslide-infected-water-body',
  'infected-water-outflow',
  'right-earth-relational-body',
  'left-industrial-plateau',
  'central-divide-bridge',
  'traditional-trapped-right-arm',
  'semi-flooded-field',
  'black-dog-chained-tree',
  'tractor-with-shooter',
  'shot-black-bird',
  'falling-black-bird',
  'industrial-truck-convoy',
  'right-nymph-profile',
  'water-channeling-hand',
  'wetland-braided-streams',
  'riparian-buffer-strip',
  'paulownia-flowering-north',
  'paulownia-flowering-south',
  'canopy-understory-guild',
  'wetland-reed-beds',
  'fungal-mycorrhizal-zone',
  'rocks-living-soil',
  'community-practice-paths',
]);

const allowedTriggerTypes = new Set([
  'study',
  'retraction',
  'claim',
  'funding_shift',
  'policy_update',
  'field_report',
  'community_upload',
  'overclaim_correction',
  'dataset',
  'court_ruling',
  'natural_event',
  'sensor_signal',
  'news',
]);

export function assertNewsValidation(value) {
  assertObject(value, 'news validation');
  assertBoolean(value.relevant, 'relevant');
  assertScore(value.evidenceScore, 'evidenceScore');

  if (value.relevant) {
    assertString(value.element_id, 'element_id');
    if (!allowedElementIds.has(value.element_id)) {
      throw new Error(`Invalid element_id: ${value.element_id}`);
    }
  } else if (value.element_id !== null) {
    throw new Error('Invalid element_id: expected null when relevant=false.');
  }

  assertString(value.summary, 'summary');
  assertString(value.reason, 'reason');
  assertArray(value.domains, 'domains');
  value.domains.forEach((domain) => assertString(domain, 'domain'));
  assertString(value.trigger_type, 'trigger_type');
  if (!allowedTriggerTypes.has(value.trigger_type)) {
    throw new Error(`Invalid trigger_type: ${value.trigger_type}`);
  }

  return true;
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid ${label}: expected object.`);
  }
}

function assertBoolean(value, label) {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid ${label}: expected boolean.`);
  }
}

function assertScore(value, label) {
  if (typeof value !== 'number' || value < 0 || value > 1) {
    throw new Error(`Invalid ${label}: expected number between 0 and 1.`);
  }
}

function assertString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid ${label}: expected non-empty string.`);
  }
}

function assertArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${label}: expected array.`);
  }
}
