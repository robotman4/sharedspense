document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('buttonLogin').addEventListener('click', function() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        login(username, password);
    });

    document.getElementById('dismissError').addEventListener('click', function() {
        const progress = document.getElementById('dialogProgress');
        progress.close();
    });
});