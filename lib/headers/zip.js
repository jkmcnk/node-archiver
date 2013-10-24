/**
 * node-archiver
 *
 * Copyright (c) 2012-2013 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */

var int64 = require('node-int64');

var MAX32 = 0xffffffff;
var MAX16 = 0xffff;

var headers = {};

function invcopy(dst, dstoff, src, srcoff, len) {
  for(i = 0; i < len; i++) {
    dst[dstoff + i] = src[srcoff + len - 1 - i];
  }
}

headers.file = {
  fields: [
    {'field': 'signature', 'length': 4, 'type': 'UInt32LE', 'default': 0x04034b50},
    {'field': 'versionNeededToExtract', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'flags', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'compressionMethod', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'lastModifiedDate', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'crc32', 'length': 4, 'type': 'Int32LE', 'default': 0},
    {'field': 'compressedSize', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'uncompressedSize', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'filenameLength', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'extraFieldLength', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'name', 'length': -1, 'type': 'string'},
    {'field': 'extraField', 'length': -1, 'type': 'buffer'}
  ],

  toBuffer: function(data) {
    var self = this;

    var buffer = new Buffer(4*1024);
    var offset = 0;
    var val;
    var fallback;

    self.fields.forEach(function(value) {
      fallback = (value.type === 'string') ? '' : 0;
      val = data[value.field] || value.default || fallback;

      if (value.field === 'name') {
        value.length = buffer.write(val, offset);
        buffer.writeUInt16LE(value.length, 26);
      } else if (value.field === 'extraField') {
        value.length = (val) ? val.length : 0;
        if(value.length > 0) {
          val.copy(buffer, offset, 0, value.length);
        }
        buffer.writeUInt16LE(value.length, 28);
      } else if (value.name === 'crc32'
                 || value.name === 'uncompressedSize'
                 || value.name === 'compressedSize') {
        /* we will write the data descriptor, put 0 in header */
        buffer.writeUInt32LE(0, offset);
      } else if (value.type === 'UInt32LE') {
        buffer.writeUInt32LE(val, offset);
      } else if (value.type === 'Int32LE') {
        buffer.writeInt32LE(val, offset);
      } else if (value.type === 'UInt16LE') {
        buffer.writeUInt16LE(val, offset);
      } else {
        buffer.write(val, offset);
      }

      offset += value.length;
    });

    return buffer.slice(0, offset);
  }
};

headers.fileDescriptor = {
  fields: [
    {'field': 'signature', 'length': 4, 'type': 'UInt32LE', 'default': 0x08074b50},
    {'field': 'crc32', 'length': 4, 'type': 'Int32LE'},
    {'field': 'compressedSize', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'uncompressedSize', 'length': 4, 'type': 'UInt32LE'}
  ],

  toBuffer: function(data) {
    var self = this;

    var buffer = new Buffer(16);
    var offset = 0;
    var val;

    self.fields.forEach(function(value) {
      val = data[value.field] || value.default || 0;

      if (value.type === 'UInt32LE') {
        buffer.writeUInt32LE(val, offset);
      } else if (value.type === 'Int32LE') {
        buffer.writeInt32LE(val, offset);
      }

      offset += value.length;
    });

    return buffer;
  }
};

headers.fileDescriptor64 = {
  fields: [
    {'field': 'signature', 'length': 4, 'type': 'UInt32LE', 'default': 0x08074b50},
    {'field': 'crc32', 'length': 4, 'type': 'Int32LE'},
    {'field': 'compressedSize', 'length': 8, 'type': 'UInt64LE'},
    {'field': 'uncompressedSize', 'length': 8, 'type': 'UInt64LE'}
  ],

  toBuffer: function(data) {
    var self = this;

    var buffer = new Buffer(24);
    var offset = 0;
    var val;

    self.fields.forEach(function(value) {
      val = data[value.field] || value.default || 0;

      if (value.type === 'UInt32LE') {
        buffer.writeUInt32LE(val, offset);
      } else if (value.type === 'Int32LE') {
        buffer.writeInt32LE(val, offset);
      } else if (value.type === 'UInt64LE') {
        val = new int64(val);
        // val.buffer.copy(buffer, offset, 0, 8);
        invcopy(buffer, offset, val.buffer, 0, 8);
      }

      offset += value.length;
    });

    return buffer;
  }
};

headers.centralHeader = {
  fields: [
    {'field': 'signature', 'length': 4, 'type': 'UInt32LE', 'default': 0x02014b50},
    {'field': 'versionMadeBy', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'versionNeededToExtract', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'flags', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'compressionMethod', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'lastModifiedDate', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'crc32', 'length': 4, 'type': 'Int32LE'},
    {'field': 'compressedSize', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'uncompressedSize', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'filenameLength', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'extraFieldLength', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'commentLength', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'diskNumberStart', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'internalFileAttributes', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'externalFileAttributes', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'offset', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'name', 'length': -1, 'type': 'string'},
    {'field': 'extraField', 'length': -1, 'type': 'buffer'},
    {'field': 'comment', 'length': -1, 'type': 'string'}
  ],

  toBuffer: function(data) {
    var self = this;

    var buffer = new Buffer(4*1024);
    var offset = 0;
    var val;
    var fallback;

    var nameLength;
    var eb;
    var v64;
    var oeb;
    var is64 = (data.uncompressedSize > MAX32 || data.offset > MAX32);

    if (is64) {
      /* this file needs a shiny zip64 extra entry */
      eb = new Buffer(28);
      oeb = 0;
      eb.writeUInt16LE(0x0001, oeb); oeb += 2;
      eb.writeUInt16LE(24, oeb); oeb += 2;
      v64 = [ new int64(data.uncompressedSize),
              new int64(data.compressedSize),
              new int64(data.offset) ];
      for(i in v64) {
        // v64[i].buffer.copy(eb, oeb, 0, 8); oeb += 8;
        invcopy(eb, oeb, v64[i].buffer, 0, 8); oeb += 8;
      }
      data.extraField = eb;
    }

    self.fields.forEach(function(value) {
      fallback = (value.type === 'string') ? '' : 0;
      val = data[value.field] || value.default || fallback;

      if (value.field === 'name') {
        value.length = buffer.write(val, offset);
        buffer.writeUInt16LE(value.length, 28);
      } else if (value.field === 'extraField') {
        value.length = (val) ? val.length : 0;
        if(value.length > 0) {
          val.copy(buffer, offset, 0, value.length);
        }
        buffer.writeUInt16LE(value.length, 30);
      } else if (value.field === 'comment') {
        value.length = (val.length > 0) ? buffer.write(val, offset) : 0;
        buffer.writeUInt16LE(value.length, 32);
      } else if (value.field === 'offset'
                 || value.field === 'compressedSize'
                 || value.field === 'uncompressedSize') {
        if(is64) {
          buffer.writeUInt32LE(MAX32, offset);
        }
        else {
          buffer.writeUInt32LE(val, offset);
        }
      } else if (value.type === 'UInt32LE') {
        buffer.writeUInt32LE(val, offset);
      } else if (value.type === 'Int32LE') {
        buffer.writeInt32LE(val, offset);
      } else if (value.type === 'UInt16LE') {
        buffer.writeUInt16LE(val, offset);
      } else {
        buffer.write(val, offset);
      }

      offset += value.length;
    });

    return buffer.slice(0, offset);
  }
};

headers.centralFooter64 = {
  fields: [
    {'field': 'endSignature', 'length': 4, 'type': 'UInt32LE', 'default': 0x06064b50},
    {'field': 'length', 'length': 8, 'type': 'UInt64LE', 'default': 56},
    {'field': 'versionMadeBy', 'length': 2, 'type': 'UInt16LE', 'default': 45},
    {'field': 'versionToExtract', 'length': 2, 'type': 'UInt16LE', 'default': 45},
    {'field': 'thisDisk', 'length': 4, 'type': 'UInt32LE', 'default': 0},
    {'field': 'cdStartDisk', 'length': 4, 'type': 'UInt32LE', 'default': 0},
    {'field': 'records', 'length': 8, 'type': 'UInt64LE' },
    {'field': 'recordsTotal', 'length': 8, 'type': 'UInt64LE' },
    {'field': 'cdSize', 'length': 8, 'type': 'UInt64LE' },
    {'field': 'cdOffset', 'length': 8, 'type': 'UInt64LE' },
    {'field': 'locSignature', 'length': 4, 'type': 'UInt32LE', 'default': 0x07064b50},
    {'field': 'eocdDisk', 'length': 4, 'type': 'UInt32LE', 'default': 0},
    {'field': 'eocdOffset', 'length': 8, 'type': 'UInt64LE' },
    {'field': 'disksTotal', 'length': 4, 'type': 'UInt32LE', 'default': 1}
  ],

  /* data should provide:
     - records
     - recordsTotal
     - cdSize
     - cdOffset
     - eocsOffset */
  toBuffer: function(data) {
    var self = this;

    var buffer = new Buffer(76);
    var offset = 0;
    var val;
    var fallback;

    self.fields.forEach(function(value) {
      fallback = (value.type === 'string') ? '' : 0;
      val = data[value.field] || value.default || fallback;

      if (value.type === 'UInt64LE') {
        val = new int64(val);
        // val.buffer.copy(buffer, offset, 0, 8);
        invcopy(buffer, offset, val.buffer, 0, 8);
      } else if (value.type === 'UInt32LE') {
        buffer.writeUInt32LE(val, offset);
      } else if (value.type === 'UInt16LE') {
        buffer.writeUInt16LE(val, offset);
      } else {
        buffer.write(val, offset);
      }

      offset += value.length;
    });

    return buffer.slice(0, offset);
  }
};

headers.centralFooter = {
  fields: [
    {'field': 'signature', 'length': 4, 'type': 'UInt32LE', 'default': 0x06054b50},
    {'field': 'diskNumber', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'diskNumberStart', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'directoryRecordsDisk', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'directoryRecords', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'directorySize', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'directoryOffset', 'length': 4, 'type': 'UInt32LE'},,
    {'field': 'commentLength', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'comment', 'length': -1, 'type': 'string'}
  ],

  toBuffer: function(data) {
    var self = this;

    var buffer = new Buffer(512);
    var offset = 0;
    var val;
    var fallback;

    self.fields.forEach(function(value) {
      fallback = (value.type === 'string') ? '' : 0;
      val = data[value.field] || value.default || fallback;

      if (value.field === 'comment') {
        value.length = (val.length > 0) ? buffer.write(val, offset) : 0;
        buffer.writeUInt16LE(value.length, 20);
      } else if (value.type === 'UInt32LE') {
        buffer.writeUInt32LE(val, offset);
      } else if (value.type === 'Int32LE') {
        buffer.writeInt32LE(val, offset);
      } else if (value.type === 'UInt16LE') {
        buffer.writeUInt16LE(val, offset);
      } else {
        buffer.write(val, offset);
      }

      offset += value.length;
    });

    return buffer.slice(0, offset);
  }
};

var encode = exports.encode = function(type, data) {
  if (typeof headers[type].toBuffer === 'function') {
    return headers[type].toBuffer(data);
  } else {
    return false;
  }
};

var decode = exports.decode = function(type, data) {
  if (typeof headers[type].toObject === 'function') {
    return headers[type].toObject(data);
  } else {
    return false;
  }
};
