/**
 * gohttp 1.3.3
 * Copyright (c) [2019.08] BraveWang
 * This software is licensed under the MPL-2.0.
 * You can use this software according to the terms and conditions of the MPL-2.0.
 * See the MPL for more details:
 *     https://www.mozilla.org/en-US/MPL/2.0/
 */
'use strict';

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const urlparse = require('url');
const qs = require('querystring');
const bodymaker = require('./bodymaker');

var gohttp = function (options = {}) {
    if (! (this instanceof gohttp)) { return new gohttp(options); }

    this.config = {
        cert: '',
        
        key:  '',

        //不验证证书，针对HTTPS
        ignoreTLSAuth : true,
    };

    //针对HTTPS协议，不验证证书
    if (this.config.ignoreTLSAuth) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    this.bodymaker = new bodymaker(options);
};

gohttp.prototype.parseUrl = function (url) {
    var u = new urlparse.URL(url);
    var urlobj = {
        hash :      u.hash,
        host :      u.host,
        hostname :  u.hostname,
        port :      u.port,
        protocol :  u.protocol,
        path :      u.pathname,
        method :    'GET',
        headers : {},
    };
    if (u.search.length > 0) {
        urlobj.path += u.search;
    }
    if (u.protocol === 'https:' && this.config.ignoreTLSAuth) {
        urlobj.requestCert = false;
        urlobj.rejectUnauthorized = false;
    }
    else if (u.protocol === 'https:') {
        try {
            urlobj.cert = fs.readFileSync(this.config.cert);
            urlobj.key = fs.readFileSync(this.config.key);
        } catch (err) {
            throw err;
        }
    }
    return urlobj;
};

gohttp.prototype.eventTable = {};

gohttp.prototype.on = function (evt, callback){
    if (typeof callback !== 'function') return;
    this.eventTable[evt] = callback;
};

gohttp.prototype.request = function (url, options = {}) {
    var opts = this.parseUrl(url);
    if (typeof options !== 'object') { options = {}; }

    var writeStream = null;
    for(var k in options) {
        switch (k) {
            case 'timeout':
                opts.timeout = options.timeout; break;
            case 'auth':
                opts.auth = options.auth; break;
            case 'headers':
                for(var k in options.headers) {
                  opts.headers[k] = options.headers[k];
                } break;
            case 'method':
                opts.method = options.method; break;
            case 'encoding':
                opts.encoding = options.encoding; break;
            case 'stream':
                writeStream = options.stream;
            case 'dir':
                opts.dir = options.dir; break;
            case 'target':
                opts.target = options.target; break;
            case 'progress':
                opts.progress = options.progress; break;
            case 'body':
                opts.body = options.body; break;
            default: ;
        }
    }

    if (opts.encoding === undefined) {
        opts.encoding = 'utf8';
    }

    /**
     * body : string | object
     *   upload files: {
     *     files: [
     *       "image" : [
     *         //...
     *       ]
     *     ],
     *     form: {}
     *   }
     */
    var postData = {
        'body': '',
        'content-length': 0,
        'content-type': ''
    };
    var postState = {
        isUpload: false,
        isPost: false
    };
    if (opts.method === 'PUT' || opts.method == 'POST') {
        if (opts.body === undefined) {
            throw new Error('POST/PUT must with body data, please set body');
        }
        if (opts.headers['content-type'] === undefined) {
            opts.headers['content-type'] = 'application/x-www-form-urlencoded';
            //throw new Error('you need to set content-type in header');
        }

        postState.isPost = true;

        switch (opts.headers['content-type']) {
            case 'application/x-www-form-urlencoded':
                postData.body = qs.stringify(opts.body); break;
            case 'multipart/form-data':
                postState.isUpload = true;
                postData = this.bodymaker.makeUploadData(opts.body);
                opts.headers['content-type'] = postData['content-type'];
                break;
            default:
                postData.body = JSON.stringify(opts.body);
        }
    }
    
    if (postState.isPost && !postState.isUpload) {
        postData['content-type'] = opts.headers['content-type'];
        postData['content-length'] = Buffer.byteLength(postData.body);
    }

    if (postState.isPost) {
        opts.headers['content-length'] = postData['content-length'];
    }

    if (options.isDownload) {
        return this._coreDownload(opts, postData, postState);
    }
    return this._coreRequest(opts, postData, postState, writeStream);
};

gohttp.prototype._coreRequest = async function (opts, postData, postState, wstream=null) {
    var h = (opts.protocol === 'https:') ? https : http;
    return new Promise ((rv, rj) => {
        var r = h.request(opts, (res) => {
            var res_data = '';
            res.setEncoding(opts.encoding||'utf8');
            if (wstream) {
                res.on('data', data => {
                    wstream.write(data.toString(opts.encoding), opts.encoding);
                });
                res.on('end', () => {
                    wstream.end();
                    rv(true);
                });
    
                res.on('error', (err) => {
                    wstream.destroy();
                    rj(err);
                });
            } else {
                res.on('data', (data) => {
                    res_data += data.toString(opts.encoding);
                });
                res.on('end', () => {
                    if (res.statusCode == 200) {    
                        rv(res_data);
                    } else {
                        rj(new Error(`${res.statusCode}: ${res_data}`));
                    }
                });
    
                res.on('error', (err) => { rj(err); });
            }
        });

        if (wstream) {
            r.on('error', (e) => { wstream.destroy(); rj(e); });
        } else {
            r.on('error', (e) => { rj(e); });
        }

        if (postState.isPost) {
            r.write(postData.body, postState.isUpload ? 'binary' : 'utf8');
        }
        r.end();
    });
};

gohttp.prototype._coreDownload = function (opts, postData, postState) {
    var h = (opts.protocol === 'https:') ? https : http;

    if (!opts.dir) {opts.dir = './';}

    var getWriteStream = function (filename) {
        if (opts.target) {
            return fs.createWriteStream(opts.target, {encoding:'binary'});
        } else {
            try {
                fs.accessSync(opts.dir+filename, fs.constants.F_OK);
                filename = `${(new Date()).getTime()}-${filename}`;
            } catch(err) {
            }
            return fs.createWriteStream(opts.dir+filename,{encoding:'binary'});
        }
    };

    var checkMakeFileName = function (filename = '') {
        if (!filename) {
            var nh = crypto.createHash('sha1');
            nh.update(`${(new Date()).getTime()}--`);
            filename = nh.digest('hex');
        }
        return filename;
    };

    var parseFileName = function (headers) {
        var fname = '';
        if(headers['content-disposition']) {
            var name_split = headers['content-disposition'].split(';').filter(p => p.length > 0);

            for(let i=0; i<name_split.length; i++) {
                if (name_split[i].indexOf('filename*=') >= 0) {
                    fname = name_split[i].trim().substring(10);
                    fname = fname.split('\'')[2];
                    fname = decodeURIComponent(fname);
                } else if(name_split[i].indexOf('filename=') >= 0) {
                    fname = name_split[i].trim().substring(9);
                }
            }
        }
        return fname;
    };

    var downStream = null;
    var filename = '';
    var total_length = 0;
    var sid = null;
    var progressCount = 0;
    var down_length = 0;
    if (opts.progress === undefined) {
        opts.progress = true;
    }
    return new Promise((rv, rj) => {
        var r = h.request(opts, res => {
            res.setEncoding('binary');
            filename = parseFileName(res.headers);
            if (res.headers['content-length']) {
                total_length = parseInt(res.headers['content-length']);
            }
            try {
                filename = checkMakeFileName(filename);
                downStream = getWriteStream(filename);
            } catch (err) {
                res.destroy();
                return ;
            }

            res.on('data', data => {
                downStream.write(data.toString('binary'), 'binary');
                down_length += data.length;
                if (opts.progress && total_length > 0) {
                    if (down_length >= total_length) {
                        console.clear();
                        console.log('100.00%');
                    } else if (progressCount > 25) {
                        console.clear();
                        console.log(`${((down_length/total_length)*100).toFixed(2)}%`);
                        progressCount = 0;
                    }
                }
            });
            res.on('end', () => {rv(true);});
            res.on('error', (err) => { rj(err); });
            sid = setInterval(() => {progressCount+=1;}, 20);
        });
        if (postState.isPost) {
            r.write(postData.body, postState.isUpload ? 'binary' : 'utf8');
        }
        r.end();
    })
    .then((r) => {
        if (opts.progress) { console.log('done...'); }
    }, (err) => {
        throw err;
    })
    .catch(err => {
        throw err;
    })
    .finally(() => {
        if (downStream) {
            downStream.end();
        }
        clearInterval(sid);
    });
};

gohttp.prototype.checkMethod = function (method, options) {
    if (typeof options !== 'object') { options = {method: method}; }
    else if (!options.method || options.method !== method) {
        options.method = method;
    }
};

gohttp.prototype.get = async function (url, options = {}) {
    this.checkMethod('GET', options);
    return this.request(url, options);
};

gohttp.prototype.post = async function (url, options = {}) {
    this.checkMethod('POST', options);
    if (!options.body) {
        throw new Error('must with body data');
    }
    return this.request(url, options);
};

gohttp.prototype.put = async function (url, options = {}) {
    this.checkMethod('PUT', options);
    if (!options.body) {
        throw new Error('must with body data');
    }
    return this.request(url, options);
};

gohttp.prototype.delete = async function (url, options = {}) {
    this.checkMethod('DELETE', options);
    return this.request(url, options);
};

gohttp.prototype.options = async function (url, options = {}) {
    thid.checkMethod('OPTIONS', options);
    return this.request(url, options);
};

gohttp.prototype.upload = async function (url, options = {}) {
    if (typeof options !== 'object') {options = {method: 'POST'}; }
    if (options.method === undefined) {options.method = 'POST'; }
    if (options.method !== 'POST' && options.method !== 'PUT') {
        console.log('Warning: upload must use POST or PUT method, already set to POST');
    }
    if (!options.files && !options.form && !options.body) {
        throw new Error('Error: file or form not found.');
    }
    //没有设置body，但是存在files或form，则自动打包成request需要的格式。
    if (!options.body) {
        options.body = {};
        if (options.files) {
            options.body.files = options.files;
            delete options.files;
        }
        if (options.form) {
            options.body.form = options.form;
            delete options.form;
        }
    }
    if (!options.headers) {
        options.headers = {
            'content-type' : 'multipart/form-data'
        };
    }
    if (!options.headers['content-type'] 
        || options.headers['content-type'] !== 'multipart/form-data')
    {
        options.headers['content-type'] = 'multipart/form-data';
    }
    return this.request(url, options);
};

gohttp.prototype.download = function(url, options = {}) {
    if (typeof options !== 'object') {
        options = {
            method: 'GET',
            isDownload: true
        };
    } else {
        if (!options.isDownload) {options.isDownload = true; }
    }
    return this.request(url, options);

};

module.exports = gohttp;

