interface Swap{
    a:number;
    b:number;
}

const swap = (a:number,b:number):Swap=>{
    let temp = a;
    a = b;
    b = temp;
    return {a,b};
}

export default swap;