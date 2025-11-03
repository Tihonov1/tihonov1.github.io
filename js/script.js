// Общие утилиты
function parseQuery() {
    const params = new URLSearchParams(window.location.search);
    return {
        name: params.get('name') || '',
        email: params.get('email') || '',
        role: params.get('role') || ''
    };
}

function buildQuery(user) {
    const p = new URLSearchParams();
    if (user.name) p.set('name', user.name);
    if (user.email) p.set('email', user.email);
    if (user.role) p.set('role', user.role);
    return '?' + p.toString();
}

function goBack() {
    window.history.back();
}
window.goBack = goBack;

document.addEventListener('DOMContentLoaded', function() {
    const { name, email, role } = parseQuery();

    // Регистрация
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nameInput = document.getElementById('name').value.trim();
            const emailInput = document.getElementById('email').value.trim();
            const roleInput = document.getElementById('role').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            if (password !== confirmPassword) {
                alert('Пароли не совпадают!');
                return;
            }
            if (!nameInput || !emailInput || !roleInput || !password) {
                alert('Пожалуйста, заполните все поля.');
                return;
            }
            const q = buildQuery({ name: nameInput, email: emailInput, role: roleInput });
            window.location.href = 'main.html' + q;
        });
    }

    // Авторизация
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            if (!emailInput || !password) {
                alert('Введите email и пароль.');
                return;
            }
            const guessedName = emailInput.split('@')[0] || 'Пользователь';
            const q = buildQuery({ name: guessedName, email: emailInput, role: 'waiter' });
            window.location.href = 'main.html' + q;
        });
    }

    // Главная: навигация
    const goKitchenBtn = document.getElementById('goKitchen');
    if (goKitchenBtn) {
        goKitchenBtn.addEventListener('click', function() {
            const q = buildQuery({ name, email, role });
            window.location.href = 'kitchen.html' + q;
        });
    }
    const goProfileBtn = document.getElementById('goProfile');
    if (goProfileBtn) {
        if (name) goProfileBtn.textContent = name;
        goProfileBtn.addEventListener('click', function() {
            const q = buildQuery({ name, email, role });
            window.location.href = 'profile.html' + q;
        });
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            window.location.href = 'auth.html';
        });
    }

    // Главная: работа с заказом (без localStorage)
    const ordersListEl = document.getElementById('ordersList');
    const subtotalEl = document.getElementById('subtotalValue');
    const vatEl = document.getElementById('vatValue');
    const totalEl = document.getElementById('totalValue');
    const ordersCountBadge = document.getElementById('ordersCountBadge');
    const order = [];

    function findItemByName(n) {
        return order.find(i => i.name === n);
    }

    function formatMoney(v) {
        return `${v.toLocaleString('ru-RU')} ₽`;
    }

    function recalcTotals() {
        const subtotal = order.reduce((s, i) => s + i.price * i.qty, 0);
        const vat = Math.round(subtotal * 0.20);
        const total = subtotal + vat;
        if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
        if (vatEl) vatEl.textContent = formatMoney(vat);
        if (totalEl) totalEl.textContent = formatMoney(total);
        if (ordersCountBadge) ordersCountBadge.textContent = `${order.length} позиций`;
    }

    function renderOrders() {
        if (!ordersListEl) return;
        if (order.length === 0) {
            ordersListEl.innerHTML = '<div class="empty-state">Корзина пуста</div>';
            recalcTotals();
            return;
        }
        ordersListEl.innerHTML = order.map((i, idx) => (
            `<div class="order-item" data-idx="${idx}">`+
                `<img src="${i.image}" alt="${i.name}" class="order-item-image">`+
                `<div class="order-item-details">`+
                    `<div class="order-item-name">${i.name}</div>`+
                    `<div class="order-item-price">${formatMoney(i.price)}</div>`+
                    `<div class="quantity-controls">`+
                        `<button class="quantity-btn" data-action="dec">-</button>`+
                        `<span class="quantity">${i.qty}</span>`+
                        `<button class="quantity-btn" data-action="inc">+</button>`+
                        `<button class="remove-btn" data-action="remove">×</button>`+
                    `</div>`+
                `</div>`+
            `</div>`
        )).join('');
        recalcTotals();
    }

    function addFromMenu(cardEl) {
        const nameEl = cardEl.querySelector('.menu-item-name');
        const priceEl = cardEl.querySelector('.menu-item-price');
        const imgEl = cardEl.querySelector('.menu-item-image');
        if (!nameEl || !priceEl) return;
        const name = nameEl.textContent.trim();
        const price = parseInt(priceEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
        const image = imgEl ? imgEl.getAttribute('src') : '';
        const existing = findItemByName(name);
        if (existing) {
            existing.qty += 1;
        } else {
            order.push({ name, price, qty: 1, image });
        }
        renderOrders();
    }

    // Делегирование: клики по кнопкам Добавить
    document.body.addEventListener('click', function(e) {
        const btn = e.target.closest('.add-button');
        if (btn) {
            const card = btn.closest('.menu-item');
            if (card) addFromMenu(card);
        }
    });

    // Делегирование: управление количеством и удаление в корзине
    if (ordersListEl) {
        ordersListEl.addEventListener('click', function(e) {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;
            const wrap = actionBtn.closest('.order-item');
            if (!wrap) return;
            const idx = parseInt(wrap.getAttribute('data-idx'), 10);
            if (Number.isNaN(idx) || !order[idx]) return;
            const action = actionBtn.getAttribute('data-action');
            if (action === 'inc') order[idx].qty += 1;
            if (action === 'dec') order[idx].qty = Math.max(1, order[idx].qty - 1);
            if (action === 'remove') order.splice(idx, 1);
            renderOrders();
        });
    }

    // Инициал без позиций
    if (ordersListEl) renderOrders();

    // Профиль: заполнение данных
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userRoleBadge = document.getElementById('userRoleBadge');
    const avatarInitials = document.getElementById('avatarInitials');
    if (userNameEl || userEmailEl || userRoleBadge || avatarInitials) {
        const displayName = name || 'Пользователь';
        if (userNameEl) userNameEl.textContent = displayName;
        if (userEmailEl) userEmailEl.textContent = email || '—';
        if (userRoleBadge) userRoleBadge.textContent = role ? roleLabel(role) : 'Сотрудник';
        if (avatarInitials) avatarInitials.textContent = makeInitials(displayName);
    }

    // Кухня: счетчики (демо)
    const totalOrdersBadge = document.getElementById('totalOrdersBadge');
    if (totalOrdersBadge) {
        updateKitchenCounts(0, 0, 0, 0);
    }
});

function roleLabel(role) {
    switch (role) {
        case 'waiter': return 'Официант';
        case 'chef': return 'Повар';
        case 'manager': return 'Менеджер';
        case 'admin': return 'Администратор';
        default: return 'Сотрудник';
    }
}

function makeInitials(displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Кухня: обновление счетчиков
function updateKitchenCounts(all, pending, preparing, ready) {
    const totalOrdersBadge = document.getElementById('totalOrdersBadge');
    const countAll = document.getElementById('countAll');
    const countPending = document.getElementById('countPending');
    const countPreparing = document.getElementById('countPreparing');
    const countReady = document.getElementById('countReady');
    if (totalOrdersBadge) totalOrdersBadge.textContent = `${all} заказов`;
    if (countAll) countAll.textContent = all;
    if (countPending) countPending.textContent = pending;
    if (countPreparing) countPreparing.textContent = preparing;
    if (countReady) countReady.textContent = ready;
}