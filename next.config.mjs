import fs from 'fs';

// Patch Node on Windows FAT32 drives where readlink throws EISDIR instead of EINVAL on regular files
const origReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function (path, options) {
  try {
    return origReadlinkSync.call(fs, path, options);
  } catch (err) {
    if (err && err.code === 'EISDIR') {
      try {
        const stat = fs.statSync(path);
        if (!stat.isDirectory()) {
          const einval = new Error(`EINVAL: invalid argument, readlink '${path}'`);
          einval.code = 'EINVAL';
          throw einval;
        }
      } catch (statErr) {
        if (statErr.code === 'EINVAL') throw statErr;
      }
    }
    throw err;
  }
};

const origReadlink = fs.readlink;
fs.readlink = function (path, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'function' ? undefined : options;
  origReadlink.call(fs, path, opts, (err, linkString) => {
    if (err && (err.code === 'EISDIR' || err.code === 'EINVAL' || err.code === 'UNKNOWN')) {
      const einval = new Error(`EINVAL: invalid argument, readlink '${path}'`);
      einval.code = 'EINVAL';
      return cb(einval);
    }
    cb(err, linkString);
  });
};

if (fs.promises && fs.promises.readlink) {
  const origPromisesReadlink = fs.promises.readlink;
  fs.promises.readlink = async function (p, opts) {
    try {
      return await origPromisesReadlink.call(fs.promises, p, opts);
    } catch (err) {
      if (err && (err.code === 'EISDIR' || err.code === 'EINVAL' || err.code === 'UNKNOWN')) {
        const einval = new Error(`EINVAL: invalid argument, readlink '${p}'`);
        einval.code = 'EINVAL';
        throw einval;
      }
      throw err;
    }
  };
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  webpack: (config) => {
    config.resolve.symlinks = false;
    config.cache = false;
    return config;
  }
};

export default nextConfig;
