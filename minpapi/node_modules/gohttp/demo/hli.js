const hcli = (require('../httpcli.js')());

for(let i=0; i<600; i++) {
    hcli.get('http://localhost:2019/')
    .then(data => {
        console.log(data);
    }, err => {
        throw err; 
    })
    .catch(err => {
        console.log(err);
    });

    hcli.post('http://localhost:2019/p', {
        body : {user : 'brave'}
    })
    .then(data => {
        console.log(data);
    }, err => {
        throw err; 
    })
    .catch(err => {
        console.log(err);
    });
}

