
var array2=[];


async function foor() {
for(let i=0;i<10;i++) {

    array2[i] =  new Promise((resolve, reject) => {
       
             array2[i]  =  i;
             resolve(array2[i]);
        

      
    });
}
}


Promise.all(array2).then(values => { 
  console.log(values); 
});


