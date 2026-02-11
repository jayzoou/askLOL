console.log('child started');
process.send && process.send({ready:true});
setTimeout(()=>{
  console.log('child exiting');
  process.exit(0);
},1000);
