const cp = require('child_process');
const path = require('path');
const childPath = path.resolve(__dirname, './fork-child.js');
console.log('parent forking', childPath);
try{
  const child = cp.fork(childPath, {stdio:'inherit'});
  child.on('exit', (code, sig)=>{
    console.log('child exit', code, sig);
  });
  child.on('error', (e)=>{
    console.error('child error', e);
  });
}catch(e){
  console.error('fork threw', e);
}
