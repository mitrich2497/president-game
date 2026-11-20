// The result is committed before presentation. Animation failure cannot undo a
// payment, reroll dice on reload, or leave the turn locked.
export async function presentTurn(next,{save,animate,finish,onError=()=>{}}){
 try{save(next);await animate();}
 catch(error){onError(error);}
 finally{finish(next);}
}
