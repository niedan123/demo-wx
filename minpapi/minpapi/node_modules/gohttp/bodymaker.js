'use strict';

const crypto = require('crypto');
const fs = require('fs');

var bodymaker = function (options = {}) {
    if (!(this instanceof bodymaker)) {return new bodymaker(options);}

    //最大同时上传文件数量限制
    this.max_upload_limit = 10;

    //上传文件最大数据量，JS限制最大字符串不能超过 1073741824
    this.max_upload_size = 1073000000;

    //单个文件最大上传大小
    this.max_file_size = 220000000;

    this.mime_map = {
        'css'   : 'text/css',
        'der'   : 'application/x-x509-ca-cert',
        'gif'   : 'image/gif',
        'gz'    : 'application/x-gzip',
        'h'     : 'text/plain',
        'htm'   : 'text/html',
        'html'  : 'text/html',
        'jpg'   : 'image/jpeg',
        'jpeg'  : 'image/jpeg',
        'png'   : 'image/png',
        'js'    : 'application/x-javascript',
        'mp3'   : 'audio/mpeg',
        'mp4'   : 'video/mp4',
        'c'     : 'text/plain',
        'exe'   : 'application/octet-stream',
        'txt'   : 'text/plain',
        'wav'   : 'audio/x-wav',
        'svg'   : 'image/svg+xml',
        'tar'   : 'application/x-tar',
    };

    this.default_mime   = 'application/octet-stream';

    this.extName = function (filename = '') {
        if (filename.length <= 0) { return ''; }
        var name_split = filename.split('.').filter(p => p.length > 0);
        if (name_split.length < 2) { return ''; }
        return name_split[name_split.length - 1];
    };

    this.mimeType = function (filename) {
        var extname = this.extName(filename);
        extname = extname.toLowerCase();
        if (extname !== '' && this.mime_map[extname] !== undefined) {
            return this.mime_map[extname];
        }
        return this.default_mime;
    };

};

bodymaker.prototype.makeUploadData = function (r) {
    var bdy = this.boundary();

    var formData = '';
    if (r.form !== undefined) {
        if (typeof r.form === 'object') {
            for (var k in r.form) {
                formData += `\r\n--${bdy}\r\nContent-Disposition: form-data; name=${'"'}${k}${'"'}\r\n\r\n${r.form[k]}`;
            }
        }
    }

    var header_data = '';
    var payload = '';
    var body_data = Buffer.from(formData).toString('binary');
    var content_length = Buffer.byteLength(formData);

    if (r.files && typeof r.files === 'object') {
        let t = '';
        let tmp = '';
        for (var k in r.files) {
            if (typeof r.files[k] === 'string') {
                t = [ r.files[k] ];
            } else {
                t = r.files[k];
            }
            for (let i=0; i<t.length; i++) {
                header_data = `Content-Disposition: form-data; name=${'"'}${k}${'"'}; filename=${'"'}${t[i]}${'"'}\r\nContent-Type: ${this.mimeType(t[i])}`;

                payload = `\r\n--${bdy}\r\n${header_data}\r\n\r\n`;
                tmp = fs.readFileSync(t[i], {encoding:'binary'});
                content_length += Buffer.byteLength(payload) + tmp.length;
                body_data += Buffer.from(payload).toString('binary') + tmp;
                tmp = '';
            }
        }
    }

    var end_data = `\r\n--${bdy}--\r\n`;
    content_length += Buffer.byteLength(end_data);
    body_data += Buffer.from(end_data).toString('binary');

    return {
        'content-type' : `multipart/form-data; boundary=${bdy}`,
        'body' : body_data,
        'content-length' : content_length
    };
};

bodymaker.prototype.boundary = function() {
    var hash = crypto.createHash('md5');
    hash.update(`${Date.now()}-${Math.random()}`);
    var bdy = hash.digest('hex');

    return `----${bdy}`;
};

module.exports = bodymaker;
