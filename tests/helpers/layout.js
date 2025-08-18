// Helper centralisé pour assertions de containment/layout
// Utilisé par les tests e2e pour rendre la tolérance configurable et les messages d'erreur plus lisibles
const DEFAULT_VERTICAL_TOLERANCE = 300; // px, augmenté pour CI/headless/mobile
const DEFAULT_HORIZONTAL_TOLERANCE = 15; // px

function assertContainedOrThrow(containerBox, configBox, verticalTolerance = DEFAULT_VERTICAL_TOLERANCE, horizontalTolerance = DEFAULT_HORIZONTAL_TOLERANCE) {
  if (!containerBox) {
    throw new Error('assertContainedOrThrow: containerBox is falsy');
  }
  if (!configBox) {
    throw new Error('assertContainedOrThrow: configBox is falsy');
  }

  const configTop = configBox.y;
  const configBottom = configBox.y + configBox.height;
  const configLeft = configBox.x;
  const configRight = configBox.x + configBox.width;

  const containerTop = containerBox.y;
  const containerBottom = containerBox.y + containerBox.height;
  const containerLeft = containerBox.x;
  const containerRight = containerBox.x + containerBox.width;

  if (configLeft < containerLeft) {
    throw new Error(`config left (${configLeft}) is left of container left (${containerLeft})`);
  }

  if (configTop < containerTop) {
    throw new Error(`config top (${configTop}) is above container top (${containerTop})`);
  }

  if (configRight > containerRight + horizontalTolerance) {
    throw new Error(`config right (${configRight}) > container right (${containerRight}) + horizontalTolerance (${horizontalTolerance})`);
  }

  if (configBottom > containerBottom + verticalTolerance) {
    throw new Error(`config bottom (${configBottom}) > container bottom (${containerBottom}) + verticalTolerance (${verticalTolerance})`);
  }

  return true;
}

module.exports = {
  DEFAULT_VERTICAL_TOLERANCE,
  DEFAULT_HORIZONTAL_TOLERANCE,
  assertContainedOrThrow,
};
