const {Readable, Transform} = require('stream');
const {lengthOfPartial} = require('./util');

class StreamSplit extends Transform {
  constructor(delimiter = '', options = {}) {
    const opts = Object.assign({}, options);

    super(Object.assign(opts, {
      readableObjectMode: true
    }));

    const {ignorePrevious = false} = opts;

    if (typeof opts.createStream === 'function') {
      this.createStream = opts.createStream;
    }

    this.delimiter = delimiter;
    this.ignorePrevious = ignorePrevious;

    this.lastChunk = null;
    this.lastChunkStream = null;
  }

  _transform(data, encoding, callback) {
    if (encoding !== 'string' && encoding !== 'buffer') {
      throw new TypeError('Cannot parse non-string data');
    }

    if (!Buffer.isBuffer(data)) {
      data = Buffer.from(data, encoding);
    }

    this._parseChunk(data, callback);
  }

  _flush(callback) {
    if (this.lastChunkStream) {
      this._endLastChunkStream();
    }

    callback();
  }

  createStream() {
    return new Readable({read: () => {}});
  }

  _parseChunk(chunk, callback) {
    if (chunk && chunk.length) {
      const delimiter = Buffer.from(this.delimiter);
      const partialMatchingEnabled = (!this.ignorePrevious && delimiter.length > 1);

      if (partialMatchingEnabled && this.lastChunk && this.lastChunk.length) {
        // If partial matching is enabled, and there's a previous chunk
        // prepend it to the current chunk.

        const lastChunk = this.lastChunk;
        this.lastChunk = null;
        const len = lastChunk.length + chunk.length;
        chunk = Buffer.concat([lastChunk, chunk], len);
      }

      const idx = (delimiter && delimiter.length < chunk.length ? chunk.indexOf(delimiter) : -1);

      if (idx !== -1) {
        const firstChunk = chunk.slice(0, idx);
        const remainder = chunk.slice(idx + delimiter.length);

        this._pushChunk(firstChunk);

        this._createNewChunkStream();

        return this._parseChunk(remainder, callback);
      } else if (partialMatchingEnabled) {
        // Partial matching is enabled, allowing the pushing of irrelevant chunks,
        // before an actual delimiter match.

        // Because partial matching iterates over characters,
        // test if the first character of the delimiter exists in the chunk.
        if (chunk.indexOf(delimiter[0]) !== -1) {

          // Find the len of the largest partial match.
          const lenPartial = lengthOfPartial(chunk, delimiter, delimiter.length - 1);

          if (lenPartial > 0) {
            // A partial match has been found at the end of the chunk.

            // Index within the chunk of the partial match.
            const partialIdx = chunk.length - lenPartial;
            // Create a new chunk with the first part of the chunk, up to the partial match.
            const consumeChunk = chunk.slice(0, partialIdx);
            // Create a chunk out of the partial match.
            const partialMatch = chunk.slice(partialIdx);

            if (partialMatch.length) {
              this.lastChunk = partialMatch;
            }

            if (consumeChunk.length) {
              // Push the unused chunk to the stream.
              this._pushChunk(consumeChunk);
            }
          } else {
            // No partial match has been found within this chunk.

            // Safe to push it to the stream.
            this._pushChunk(chunk);
          }
        } else {
          // The first character of the delimiter does not exist in the chunk,
          // meaning there's no partial delimiter within this chunk.

          // Safe to push it to the stream.
          this._pushChunk(chunk);
        }
      } else {
        // Partial matching disabled or unnecessary (delimiter.length === 1)

        this._pushChunk(chunk);
      }
    }

    if (typeof callback === 'function') {
      callback();
    }
  }

  _createNewChunkStream() {
    if (this.lastChunkStream) {
      this._endLastChunkStream();
    }

    this.lastChunkStream = this.createStream();
    this.push(this.lastChunkStream);
  }

  _flushLastChunk() {
    if (this.lastChunk) {
      const lastChunk = this.lastChunk;

      this.lastChunk = null;
      this._pushChunk(lastChunk);
    }
  }

  _pushChunk(chunk, encoding) {
    if (!this.lastChunkStream) {
      this._createNewChunkStream()
    }

    this.lastChunkStream.push(chunk, encoding);
  }

  _endLastChunkStream() {
    this._flushLastChunk();

    this.lastChunkStream.push(null);
    this.lastChunkStream = null;
  }

}

module.exports = StreamSplit;
