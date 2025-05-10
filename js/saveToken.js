fetch('auth/login', {
    method : 'POST',
    body : JSON.stringify({
        code : document.getElementById('code').value,
        role : document.getElementById('role').value,
    }),
    headers : {
        'Content-Type' : 'application/json',
    }
})
.then(res => res.json())
.then(data => {
    if(data.authorization){
        localStorage.setItem('accessToken', data.authorization);
        window.location.href = '/teacher/dashboard';
    }else{
        alert(data.message);
    }
});