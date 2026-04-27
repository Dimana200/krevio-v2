function loadNotifications() {
    const container = document.getElementById('notifications-list');
    container.innerHTML = `
        <div class="notification-item">
            <div class="user-avatar" style="background: linear-gradient(45deg, #ff0050, #00f2ea)"></div>
            <div>
                <b>Екипът на KREVIO</b>
                <p>Добре дошли в KREVIO! Започнете да създавате съдържание.</p>
                <small>Преди 1 минута</small>
            </div>
        </div>
    `;
}
