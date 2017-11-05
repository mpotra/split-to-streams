# StreamSplit
A Node.JS `stream.Transform` interface that splits input into streams.

- [How it works](#how-it-works)
- [Features](#features)
- [Install and usage](#install-and-usage)
    - [Example](#example)
- [Documentation](#documentation)
    - [class `StreamSplit`](#class-streamsplit)
        - [`constructor()`](#constructordelimiter----options--)
        - [Extending](#extending)
    - [class `SimpleSplit`](#class-simplesplit)
    - [class `LineSplit`](#class-linesplit)
        - [Example](#example-1)
- [License](#license)

## How it works

Given `input`, the `StreamSplit` class will split input in real-time, and provide a `stream.Readable` object for each segment delimited by `delimiter`.
Each `stream.Readable` provided, will in turn provide one or more data chunks, within the matched segment.

The utility of `StreamSplit` is to provide consumer interfaces the ability to process incoming chunks as they become available, without having to wait for a `delimiter` to be matched first.

##### Traditional string splitters:
```
_________________________________
| chunk | chunk | chunk | chunk |  => { [chunk, chunk, chunk, chunk].join() }
----------- delimiter -----------
| chunk | chunk | chunk | chunk |  => { [chunk, chunk, chunk, chunk].join() }
----------- delimiter -----------
```

##### StreamSplit default:
```
_________________________________
| chunk | chunk | chunk | chunk |  => { [Readable Stream] } => [ {chunk} | {chunk} | {chunk} | {chunk} ]
----------- delimiter -----------
| chunk | chunk | chunk | chunk |  => { [Readable Stream] } => [ {chunk} | {chunk} | {chunk} | {chunk} ]
----------- delimiter -----------
```

## Features
- Allows splitting input based on a custom `delimiter`
- Buffer-safe; does not convert to strings for searching and splitting
- Support partial matching

## Install and usage

`npm install split-to-streams`

### Testing

`npm test` or `node test/`

### Example

```javascript
const StreamSplit = require('split-to-streams');

const input = getReadableStream();
const spliter = new StreamSplit('\n'); // Split by LF
splitter.on('data', function (stream) {
    // `stream` is a `stream.Readable` instance that will push data chunks within each line.
    stream.on('data', function (chunk) {
        // Handle chunks in a line.
    });
});

input.pipe(splitter);
```
## Documentation
### `class StreamSplit`

The class extends on [stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform) and transforms input by splitting it based on a `delimiter` parameter.

##### `constructor(delimiter = '' [, options = {}])`
Creates a new `StreamSplit` instance.
- `delimiter`, the delimiter to split input by
- `options` *(optional)* Object with options to pass to the `stream.Transform` super.
    - `ignorePrevious` - *default: false* If set to `true`, disables partial matching.
    - `createStream` - *(optional)* - A custom `function` to create a `stream.Readable`-like object, every time the `delimiter` is matched.

#### Note: Emit at creation
`StreamSplit` instances will always emit a new stream object on creation, in order to capture initial chunks until and if first delimiter is found.

As such, overwriting the `createStream()` method after creation, will result in different objects being emitted (first will always be the default).
Please use `options.createStream` or by extending the `StreamSplit` class, instead of replacing the `createStream()` method.

#### Extending
```javascript
const StreamSplit = require('split-to-streams');

class MyCustomStreamSplit extends StreamSplit {
    constructor( ... ) {
        super( ... );
    }

    createStream() {
        // Overwrite creating `stream.Readable` instances, and create custom objects.
        // Note: object must have a `push()` method.
        return new CustomObject();
    }

    _transform(chunk, encoding, callback) {
        // Do something before passing the chunk to `StreamSplit`
        super._transform(chunk, encoding, callback);
    }
}
```

### `class SimpleSplit`

The class extends on `StreamSplit`, but does not provide `stream.Readable` objects. Instead consumers can read chunks delimited by `delimiter`, just like with traditional string splitters.

##### `constructor(delimiter = '' [, options = {}])`
Creates a new `SimpleSplit` instance.
- `delimiter`, the delimiter to split input by
- `options` *(optional)* Object with options to pass to the `stream.Transform` super.

### `class LineSplit`

The class extends on `SimpleSplit`, and splits input by `\n` (CR) delimiters, providing lines as chunks.

##### Example
```javascript
const {LineSplit} = require('split-to-stream');
const lineSplitter = new LineSplit();
const input = getReadableStream(); // e.g. fs.createReadStream(filename);

lineSplitter.on('data', function(lineChunk) {
    // handle lineChunk.
});

input.pipe(lineSplitter);
```

## License
MIT
