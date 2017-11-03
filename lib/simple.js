const StreamSplit = require('./stream');

class SimpleSplit extends StreamSplit {
  constructor(delimiter, options = {}) {
    super(delimiter, options);
  }

  _createNewChunkStream() {
  }

  _pushChunk(chunk, encoding) {
    this.push(chunk, encoding);
  }

  _endLastChunkStream() {
  }
}

module.exports = SimpleSplit;
