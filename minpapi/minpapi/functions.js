const fs = require('fs');

exports.readFile = async function (filename, encoding = 'utf8') {
    return new Promise((rv, rj) => {
      fs.readFile(filename, {encoding:encoding},(err, data)=>{
        if (err) {
          rj(err);
        } else {
          rv(data);
        }
      });
    });
};

