const { initProject } = require('./cli/init');
const { generateFromBrief } = require('./cli/from-brief');
const { generateComponent } = require('./cli/component');
const { exportProject } = require('./cli/export');
const { generateTokens } = require('./cli/tokens');

module.exports = {
  initProject,
  generateFromBrief,
  generateComponent,
  exportProject,
  generateTokens,
};