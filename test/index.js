const test = require('tape');
const {Readable} = require('stream');
const {StreamSplit, LineSplit} = require('../index.js');

test('Single chunk input', function(assert) {
  const delimiter = '<delimiter>';

  const input = [
    'Hello world',
    'This is a test',
    'with 3 lines',
  ];
  const nExpectedStreams = input.length;

  assert.plan(4);

  const splitter = new StreamSplit(delimiter);
  const receivedStreams = [];
  const receivedChunks = [];
  const onEndPromises = [];

  splitter.on('data', function(stream) {
    receivedStreams.push(stream);
    stream.on('data', (chunk) => receivedChunks.push(chunk));

    onEndPromises.push(
      new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      })
    );
  });

  splitter.on('finish', function() {
    assert.equal(receivedStreams.length, nExpectedStreams, 'Split into expected number of streams');

    Promise.all(onEndPromises).then(() => {
      assert.pass('Received streams did not error');
    }).catch((err) => {
      assert.fail('At least one of the streams did not end');
    }).then(() => {
      assert.equal(receivedChunks.length, input.length, 'Received the expected number of chunks');
      assert.equal(receivedChunks.join(delimiter), input.join(delimiter), 'Chunks received in order');
    });
  });

  splitter.end(input.join(delimiter));
});

test('Multiple chunks input (delimiter-ended)', function(assert) {
  const delimiter = '<delimiter>';

  const input = [
    'Hello world',
    'This is a test',
    'with 3 lines',
  ];
  const nExpectedStreams = input.length;

  assert.plan(4);

  const splitter = new StreamSplit(delimiter);
  const receivedStreams = [];
  const receivedChunks = [];
  const onEndPromises = [];

  splitter.on('data', function(stream) {
    receivedStreams.push(stream);
    stream.on('data', (chunk) => receivedChunks.push(chunk));

    onEndPromises.push(
      new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      })
    );
  });

  splitter.on('finish', function() {
    assert.equal(receivedStreams.length, nExpectedStreams, 'Split into expected number of streams');

    Promise.all(onEndPromises).then(() => {
      assert.pass('Received streams did not error');
    }).catch((err) => {
      assert.fail('At least one of the streams did not end');
    }).then(() => {
      assert.equal(receivedChunks.length, input.length, 'Received the expected number of chunks');
      assert.equal(receivedChunks.join(delimiter), input.join(delimiter), 'Chunks received in order');
    });
  });

  input.forEach((line, index) => {
    if (index !== input.length - 1) {
      splitter.write(line + delimiter);
    } else {
      splitter.end(line);
    }
  });
});

test('Multiple chunks input (inline delimiter)', function(assert) {
  const delimiter = '<delimiter>';

  const input = [
    `Hello world${delimiter}This `,
    `is a test${delimiter}with<ogre`,
    '3 lines<delimiter',
  ];
  const nExpectedStreams = input.length;

  assert.plan(4);

  const splitter = new StreamSplit(delimiter);
  const receivedStreams = [];
  const receivedChunks = [];
  const onEndPromises = [];

  splitter.on('data', function(stream) {
    receivedStreams.push(stream);
    stream.on('data', (chunk) => receivedChunks.push(chunk));

    onEndPromises.push(
      new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      })
    );
  });

  splitter.on('finish', function() {
    assert.equal(receivedStreams.length, nExpectedStreams, 'Split into expected number of streams');

    Promise.all(onEndPromises).then(() => {
      assert.pass('Received streams did not error');
    }).catch((err) => {
      assert.fail('At least one of the streams did not end');
    }).then(() => {
      const sentInput = input.join('').split(delimiter);
      assert.equal(receivedChunks.length, 6, 'Received the expected number of chunks');
      assert.equal(receivedChunks.join(''), sentInput.join(''), 'Chunks received in order');
    });
  });

  input.forEach((line, index) => {
    if (index !== input.length - 1) {
      splitter.write(line);
    } else {
      splitter.end(line);
    }
  });
});

test('Multiple chunks input (delimiter splinters)', function(assert) {
  const delimiter = '<delimiter>';
  const delimiter1 = '<deli|miter>';
  const delimiter2 = '<|deli|miter>';
  const delimiter3 = '<delimiter|>';

  const preinput = `Hello world${delimiter1}This is a test${delimiter2}with ${delimiter3}splinters<delimiter`;
  const input = preinput.split('|');

  const nExpectedStreams = 4;

  assert.plan(4);

  const splitter = new StreamSplit(delimiter);
  const receivedStreams = [];
  const receivedChunks = [];
  const onEndPromises = [];

  splitter.on('data', function(stream) {
    receivedStreams.push(stream);
    stream.on('data', (chunk) => receivedChunks.push(chunk));

    onEndPromises.push(
      new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      })
    );
  });

  splitter.on('finish', function() {
    assert.equal(receivedStreams.length, nExpectedStreams, 'Split into expected number of streams');

    Promise.all(onEndPromises).then(() => {
      assert.pass('Received streams did not error');
    }).catch((err) => {
      assert.fail('At least one of the streams did not end');
    }).then(() => {
      const sentInput = input.join('').split(delimiter);
      assert.equal(receivedChunks.length, 5, 'Received the expected number of chunks');
      assert.equal(receivedChunks.join(''), sentInput.join(''), 'Chunks received in order');
    });
  });

  input.forEach((line, index) => {
    if (index !== input.length - 1) {
      splitter.write(line);
    } else {
      splitter.end(line);
    }
  });
});

test('Allows custom Stream instances', function(assert) {
  const input = [
    'Hello world',
    'This is a test',
    'with 3 lines',
  ];
  const nExpectedStreams = input.length;

  assert.plan(1);

  class CustomReadableStream extends Readable {
    constructor() {
      super();
    }

    _read() {
    }
  }

  class CustomSplitStream extends StreamSplit {
    constructor(...args) {
      super(...args);
    }

    createStream() {
      return new CustomReadableStream();
    }
  }

  const splitter = new CustomSplitStream('\n');
  let customStreams = 0;

  splitter.on('data', function(stream) {
    if (stream instanceof CustomReadableStream) {
      customStreams++;
    }
  });

  splitter.on('finish', function() {
    assert.equal(customStreams, nExpectedStreams, 'Split into expected number of custom streams instances');
  });

  splitter.end(input.join('\n'));
});

test('(LineSplit) Simple line split implementation', function(assert) {
  const input = [
    'Hello world',
    'This is a test',
    'with 3 lines',
  ];

  assert.plan(2);

  const splitter = new LineSplit();
  const receivedChunks = [];

  splitter.on('data', function(chunk) {
    receivedChunks.push(chunk);
  });

  splitter.on('finish', function() {
    assert.equal(receivedChunks.length, input.length, 'Received the expected number of line chunks');
    assert.equal(input.join('\n'), receivedChunks.join('\n'), 'Line chunks received in order');
  });

  input.forEach((line, index) => {
    if (index !== input.length - 1) {
      splitter.write(line + '\n');
    } else {
      splitter.end(line);
    }
  });
});
