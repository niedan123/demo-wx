const fs = require('fs');
const funcs = require('./functions');
const marked = require('marked');

/**
 * 这是一个不需要使用数据加载数据的解决方案，
 * 其目的在于快速应用于小站点或者是学习测试。
 * 通过调用loadData去加载指定路径的.md文件，并解析成html保存。
 * 然后可以通过search进行搜索，search第二个参数是限制数量，默认为8。
 */

module.exports = new function () {
  var self = this;

  this.domain = '';

  this.dbIndex = {
    filedata : {},
    index : {}
  };

  this.loadData = async (dbpath) => {
    try {
      let files = fs.readdirSync(dbpath, {withFileTypes: true});  
      let tmp = '';
      let data = '';
      for(let i=0; i<files.length; i++) {
        if (files[i].isFile() && files[i].name.indexOf('.md') > 0) {
          try {
            tmp = `${dbpath}/${files[i].name}`;
            data = await funcs.readFile(tmp);
            data = this.replaceImageSrc(data);
            data = marked(data, {breaks:true, gfm: true});
            data = this.setImageStyle(data);
            data = data.replace(/<p>/ig, '<p style="margin-top:0.5rem;">');

            this.dbIndex.filedata[ files[i].name ] = {
              name : files[i].name,
              data : data
            };

            //截取文件名和数据的前32个字作为索引项，用于search函数的查找
            this.dbIndex.index[ `${files[i].name}${data.substring(0,32)}` ] = files[i].name;
          } catch (err) {
            console.log(err);
            continue;
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  this.search = (kwd, limit = 8) => {
    let results = [];
    let preg = new RegExp(kwd, 'i');
    for(let k in this.dbIndex.index) {
      if (results.length >= limit) { break; }
      if (preg.test(k)) {
        results.push(this.dbIndex.filedata[ this.dbIndex.index[k] ]);
      }
    }
    return results;
  };

  this.resetImgSrc = (data, imgsrc) => {
      let realsrc = '';
      if (this.domain[this.domain.length-1] == '/') {
        this.domain = this.domain.substring(0, this.domain.length-1);
      }
      realsrc = this.domain + '/' + imgsrc;

      let i = 0;
      while ( data.indexOf(`](${imgsrc}`) >= 0  && i < 20) {
          data = data.replace(imgsrc, realsrc);
          i+=1;
      }
      return data;
  }

  this.replaceImageSrc = (data) => {
      var images = data.match(/\!\[[^\]]*\]\(.*\)/ig);
      
      if (!images) {
          return data;
      }
      let tmp = '';
      for(let i=0; i<images.length; i++) {
          tmp = images[i].split('](')[1];
          data = this.resetImgSrc(data, tmp.substring(0, tmp.length-1));
      }
      return data;
  }

  this.setImageStyle = (html) => {
      return html.replace(/\<img /ig, '<img style="width:100%;height:auto;" ');
  }
};
