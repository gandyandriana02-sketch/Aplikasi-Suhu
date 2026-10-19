const fs = require('fs');

function isNotLinkError(err) {
  return err && (err.code === 'EISDIR' || err.code === 'EINVAL' || err.code === 'UNKNOWN');
}

function makeEinval(p) {
  const e = new Error(`EINVAL: invalid argument, readlink '${p}'`);
  e.code = 'EINVAL';
  e.errno = -4071;
  e.syscall = 'readlink';
  e.path = p;
  return e;
}

const origReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function (p, opts) {
  try {
    return origReadlinkSync.call(fs, p, opts);
  } catch (err) {
    if (isNotLinkError(err)) {
      throw makeEinval(p);
    }
    throw err;
  }
};

const origReadlink = fs.readlink;
fs.readlink = function (p, opts, cb) {
  const callback = typeof opts === 'function' ? opts : cb;
  const options = typeof opts === 'function' ? undefined : opts;
  origReadlink.call(fs, p, options, (err, link) => {
    if (err && isNotLinkError(err)) {
      return callback(makeEinval(p));
    }
    callback(err, link);
  });
};

if (fs.promises && fs.promises.readlink) {
  const origPromisesReadlink = fs.promises.readlink;
  fs.promises.readlink = async function (p, opts) {
    try {
      return await origPromisesReadlink.call(fs.promises, p, opts);
    } catch (err) {
      if (isNotLinkError(err)) {
        throw makeEinval(p);
      }
      throw err;
    }
  };
}
