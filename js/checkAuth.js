const token = localStorage.getItem('authorization');

if(!token){
    window.location.href='/auth/login';
}else{
    fetch('/api/protected', {
        headers : {
            authorization : token,
            'Content-Type' : 'application/json',
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);
    })
    .catch(err => {
        'error: ', err;
    })
}