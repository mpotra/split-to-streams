
module.exports.lengthOfPartial = function lengthOfPartial(source, target, len = undefined) {
  if (typeof len === 'undefined') {
    len = target.length;
  }

  if (len > source.length) {
    len = source.length;
  }

  if (len < 1) {
    return 0;
  }

  const sourceStart = source.length - len;

  const res = source.compare(target, 0, len, sourceStart);

  if (res === 0) {
    return len;
  } else {
    return lengthOfPartial(source, target, len - 1);
  }
};
