const allowedLayerTypes = new Set(['background', 'midground', 'foreground', 'overlay', 'hotspot']);
const allowedFormats = new Set(['png', 'svg']);
const allowedPriorities = new Set(['high', 'medium', 'low']);
const allowedSides = new Set(['traditional', 'regenerative', 'shared']);
const allowedInteractions = new Set(['none', 'hotspot_optional', 'hotspot_required']);
const allowedTopics = new Set([
  'soil',
  'water',
  'biodiversity',
  'energy',
  'governance',
  'synthetic_inputs',
  'hunting',
  'animal_welfare',
  'community',
]);

export function assertVisualLayerPlan(plan) {
  assertObject(plan, 'visual layer plan');
  assertArray(plan.layers, 'layers');
  assertArray(plan.assets, 'assets');
  assertArray(plan.hotspots, 'hotspots');
  assertArray(plan.export_instructions, 'export_instructions');
  assertArray(plan.codex_integration_notes, 'codex_integration_notes');

  for (const layer of plan.layers) {
    assertObject(layer, 'layer');
    assertString(layer.id, 'layer.id');
    assertEnum(layer.type, allowedLayerTypes, 'layer.type');
    assertString(layer.description, 'layer.description');
    assertEnum(layer.export_format, allowedFormats, 'layer.export_format');
    assertBoolean(layer.transparency, 'layer.transparency');
    assertEnum(layer.priority, allowedPriorities, 'layer.priority');
  }

  for (const asset of plan.assets) {
    assertObject(asset, 'asset');
    assertString(asset.id, 'asset.id');
    assertString(asset.layer, 'asset.layer');
    assertEnum(asset.side, allowedSides, 'asset.side');
    assertString(asset.description, 'asset.description');
    assertPosition(asset.suggested_position, 'asset.suggested_position');
    assertEnum(asset.interaction, allowedInteractions, 'asset.interaction');
  }

  for (const hotspot of plan.hotspots) {
    assertObject(hotspot, 'hotspot');
    assertString(hotspot.id, 'hotspot.id');
    assertPercent(hotspot.x, 'hotspot.x');
    assertPercent(hotspot.y, 'hotspot.y');
    assertEnum(hotspot.topic, allowedTopics, 'hotspot.topic');
    assertString(hotspot.entry_cluster, 'hotspot.entry_cluster');
  }

  for (const instruction of plan.export_instructions) {
    assertString(instruction, 'export instruction');
  }

  for (const note of plan.codex_integration_notes) {
    assertString(note, 'codex integration note');
  }

  return true;
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid ${label}: expected object.`);
  }
}

function assertArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${label}: expected array.`);
  }
}

function assertString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid ${label}: expected non-empty string.`);
  }
}

function assertBoolean(value, label) {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid ${label}: expected boolean.`);
  }
}

function assertEnum(value, allowed, label) {
  if (!allowed.has(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}

function assertPosition(value, label) {
  assertObject(value, label);
  assertPercent(value.x, `${label}.x`);
  assertPercent(value.y, `${label}.y`);
}

function assertPercent(value, label) {
  if (typeof value !== 'number' || value < 0 || value > 100) {
    throw new Error(`Invalid ${label}: expected number between 0 and 100.`);
  }
}
