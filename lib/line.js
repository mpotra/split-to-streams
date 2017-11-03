const SimpleSplit = require('./simple');

class LineSplit extends SimpleSplit {
  constructor(options = {}) {
    super('\n', options);
  }
}

module.exports = LineSplit;
