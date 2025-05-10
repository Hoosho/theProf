const authorization = localStorage.getItem('teacherToken');
if(!authorization){
    window.location.href = '/auth/login';
}
