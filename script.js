let cart = [];
let isLoggedIn = false;
let currentUser = null;
let selectedPayment = null;

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    checkLoginStatus();
    checkAccess();
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

initTheme();

function toggleMenu() {
    document.querySelector('.nav-links').classList.toggle('active');
}

function openAuthModal() {
    if (isLoggedIn) {
        toggleUserMenu();
        return;
    }
    document.getElementById('authModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    switchAuth('login');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
    document.body.style.overflow = '';
}

function switchAuth(tab) {
    event.preventDefault();
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    
    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        title.textContent = 'Login';
        subtitle.textContent = 'Welcome back! Please login to continue.';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        title.textContent = 'Create Account';
        subtitle.textContent = 'Join us to start shopping!';
    }
}

function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = {
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            address: user.address || '',
            avatar: user.name.charAt(0).toUpperCase()
        };
        isLoggedIn = true;
        localStorage.setItem('user', JSON.stringify(currentUser));
        updateUserUI();
        closeAuthModal();
        checkAccess();
        showNotification('Welcome back, ' + currentUser.name + '!');
    } else {
        showNotification('Invalid email or password!');
    }
}

function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const phone = form.querySelector('input[type="tel"]').value;
    const password = form.querySelector('input[type="password"]').value;
    const confirmPassword = form.querySelectorAll('input[type="password"]')[1].value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.email === email)) {
        showNotification('Email already registered!');
        return;
    }
    
    const newUser = { name, email, phone, address: '', password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = {
        name: name,
        email: email,
        phone: phone,
        address: '',
        avatar: name.charAt(0).toUpperCase()
    };
    
    isLoggedIn = true;
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    updateUserUI();
    closeAuthModal();
    checkAccess();
    showNotification('Welcome to ባህላዊ ለምንግር, ' + currentUser.name + '!');
}

let googleClient;

function initOAuth() {
    if (typeof google !== 'undefined') {
        googleClient = google.accounts.oauth2.init({
            client_id: document.querySelector('meta[name="google-signin-client_id"]')?.content,
            scope: 'profile email'
        });
    }
    
    if (typeof FB !== 'undefined') {
        FB.init({
            appId: document.querySelector('meta[name="facebook-app-id"]')?.content,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
        });
    }
    
    if (typeof emailjs !== 'undefined') {
        emailjs.init('YOUR_EMAILJS_PUBLIC_KEY');
    }
}

function googleSignIn() {
    closeAuthModal();
    
    if (!googleClient || googleClient.client_id === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
        showNotification('Please configure your Google Client ID in the HTML');
        return;
    }
    
    const popup = google.accounts.oauth2.initTokenClient({
        client_id: googleClient.client_id,
        scope: 'profile email',
        callback: (response) => {
            if (response.error) {
                showNotification('Google sign-in failed: ' + response.error);
                return;
            }
            
            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': 'Bearer ' + response.access_token }
            })
            .then(res => res.json())
            .then(userInfo => {
                completeOAuthLogin(userInfo.name || userInfo.email, userInfo.email, 'google');
            })
            .catch(() => {
                completeOAuthLogin('Google User', 'google_user@gmail.com', 'google');
            });
        }
    });
    
    popup.requestAccessToken();
}

function facebookSignIn() {
    closeAuthModal();
    
    const appId = document.querySelector('meta[name="facebook-app-id"]')?.content;
    if (!appId || appId === 'YOUR_FACEBOOK_APP_ID') {
        showNotification('Please configure your Facebook App ID in the HTML');
        return;
    }
    
    FB.login((response) => {
        if (response.status === 'connected') {
            FB.api('/me', { fields: 'name,email' }, (userInfo) => {
                completeOAuthLogin(userInfo.name || 'Facebook User', userInfo.email || 'facebook_user@facebook.com', 'facebook');
            });
        } else {
            showNotification('Facebook sign-in was cancelled');
        }
    }, { scope: 'email' });
}

function completeOAuthLogin(name, email, provider) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.email === email);
    
    if (!user) {
        user = { 
            name: name, 
            email: email, 
            phone: '', 
            address: '', 
            password: 'social_' + provider,
            provider: provider
        };
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    currentUser = {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.name.charAt(0).toUpperCase()
    };
    isLoggedIn = true;
    localStorage.setItem('user', JSON.stringify(currentUser));
    updateUserUI();
    checkAccess();
    showNotification('Successfully logged in with ' + (provider === 'google' ? 'Google' : 'Facebook') + '!');
}

function googleSignOut() {
    const token = google.accounts.oauth2.getToken();
    if (token) {
        google.accounts.oauth2.revoke(token.access_token);
    }
}

window.addEventListener('load', initOAuth);
window.addEventListener('load', function() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init('YOUR_EMAILJS_PUBLIC_KEY');
    }
});

function logout() {
    isLoggedIn = false;
    currentUser = null;
    localStorage.removeItem('user');
    updateUserUI();
    toggleUserMenu();
    checkAccess();
    showNotification('Logged out successfully!');
}

function toggleUserMenu() {
    if (!isLoggedIn) {
        openAuthModal();
        return;
    }
    document.getElementById('userMenu').classList.toggle('active');
}

function checkLoginStatus() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isLoggedIn = true;
        updateUserUI();
    }
    checkAccess();
}

function checkAccess() {
    return isLoggedIn && currentUser;
}



function showGateRegister() {
    event.preventDefault();
    document.getElementById('gateLoginForm').style.display = 'none';
    document.getElementById('gateRegisterForm').style.display = 'block';
}

function handleGateLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = {
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            address: user.address || '',
            avatar: user.name.charAt(0).toUpperCase()
        };
        isLoggedIn = true;
        localStorage.setItem('user', JSON.stringify(currentUser));
        updateUserUI();
        checkAccess();
        showNotification('Welcome back, ' + currentUser.name + '!');
    } else {
        showNotification('Invalid email or password!');
    }
}

function handleGateRegister(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    const confirmPassword = form.querySelectorAll('input[type="password"]')[1].value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.email === email)) {
        showNotification('Email already registered!');
        return;
    }
    
    const newUser = { name, email, phone: '', address: '', password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = {
        name: name,
        email: email,
        phone: '',
        address: '',
        avatar: name.charAt(0).toUpperCase()
    };
    
    isLoggedIn = true;
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    updateUserUI();
    checkAccess();
    showNotification('Welcome to ባህላዊ ለምንግር, ' + currentUser.name + '!');
}

function updateUserUI() {
    const userText = document.querySelectorAll('.user-text');
    const userMenu = document.getElementById('userMenu');
    
    if (isLoggedIn && currentUser) {
        userText.forEach(el => el.textContent = currentUser.name);
        
        if (userMenu) {
            document.getElementById('userAvatar').textContent = currentUser.avatar;
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('userEmail').textContent = currentUser.email;
        }
    } else {
        userText.forEach(el => el.textContent = 'Login');
    }
}

function openCart() {
    document.getElementById('cartSidebar').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.body.style.overflow = '';
}

function addToCart(name, price) {
    if (!isLoggedIn) {
        showNotification('Please login to add items to cart!');
        setTimeout(() => openAuthModal(), 500);
        return;
    }
    
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ name, price, qty: 1 });
    }
    updateCartUI();
    showNotification(name + ' added to cart!');
    openCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartQty(index, change) {
    cart[index].qty += change;
    if (cart[index].qty < 1) {
        cart.splice(index, 1);
    }
    updateCartUI();
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.querySelectorAll('.cart-count');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
    } else {
        let total = 0;
        cartItems.innerHTML = cart.map((item, index) => {
            total += item.price * item.qty;
            return '<div class="cart-item">' +
                '<div class="cart-item-info">' +
                '<h4>' + item.name + '</h4>' +
                '<p class="cart-item-price">ETB ' + item.price.toLocaleString() + '</p>' +
                '<div class="cart-item-qty">' +
                '<button onclick="updateCartQty(' + index + ', -1)">-</button>' +
                '<span>' + item.qty + '</span>' +
                '<button onclick="updateCartQty(' + index + ', 1)">+</button>' +
                '</div></div>' +
                '<button class="remove-item" onclick="removeFromCart(' + index + ')">X</button></div>';
        }).join('');
    }
    
    cartCount.forEach(el => el.textContent = '(' + cart.length + ')');
    if (cartTotal) cartTotal.textContent = 'ETB ' + cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toLocaleString();
}

function openPaymentModal() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    if (!isLoggedIn) {
        closeCart();
        showNotification('Please login to checkout!');
        setTimeout(() => openAuthModal(), 500);
        return;
    }
    
    selectedPayment = null;
    document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('selected'));
    document.getElementById('paymentDetails').style.display = 'none';
    document.getElementById('codConfirm').style.display = 'none';
    document.getElementById('paymentModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    document.body.style.overflow = '';
}

function selectPayment(method) {
    selectedPayment = method;
    document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    
    const paymentDetails = document.getElementById('paymentDetails');
    const codConfirm = document.getElementById('codConfirm');
    
    if (method === 'cod') {
        paymentDetails.style.display = 'none';
        codConfirm.style.display = 'block';
        document.getElementById('codTotal').textContent = 'ETB ' + getCartTotal().toLocaleString();
    } else {
        codConfirm.style.display = 'none';
        paymentDetails.style.display = 'block';
        
        const paymentInfo = {
            telebirr: {
                title: 'Telebirr Payment',
                info: 'Send payment to: <strong>+251 91 234 5678</strong><br>Account Name: ባህላዊ ለምንግር<br>After payment, enter the transaction ID below.'
            },
            cbe: {
                title: 'Commercial Bank of Ethiopia',
                info: 'Account Name: HABESHA TRADITIONAL CLOTHE<br>Account Number: 1000123456789<br>Branch: Bole<br>After transfer, enter the reference number below.'
            },
            awash: {
                title: 'Awash Bank',
                info: 'Account Name: HABESHA TRADITIONAL CLOTHE<br>Account Number: 0134567890123<br>Branch: Bole<br>After transfer, enter the reference number below.'
            }
        };
        
        document.getElementById('paymentTitle').textContent = paymentInfo[method].title;
        document.getElementById('paymentInfo').innerHTML = paymentInfo[method].info;
        document.getElementById('paymentRef').value = '';
    }
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function processPayment(event) {
    event.preventDefault();
    
    const ref = document.getElementById('paymentRef').value;
    if (!ref) {
        showNotification('Please enter the transaction/reference number!');
        return;
    }
    
    createOrder(selectedPayment, ref);
}

function processCODOrder() {
    createOrder('cod', 'COD-' + Date.now());
}

function createOrder(paymentMethod, ref) {
    const order = {
        id: 'ORD-' + Date.now(),
        items: [...cart],
        total: getCartTotal(),
        paymentMethod: paymentMethod,
        paymentRef: ref,
        status: paymentMethod === 'cod' ? 'processing' : 'delivered',
        date: new Date().toISOString(),
        address: currentUser.address || 'Not provided'
    };
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.unshift(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    closePaymentModal();
    closeCart();
    
    cart = [];
    updateCartUI();
    
    const paymentNames = {
        telebirr: 'Telebirr',
        cbe: 'CBE Bank Transfer',
        awash: 'Awash Bank Transfer',
        cod: 'Cash on Delivery'
    };
    
    showNotification('Order placed successfully! Payment via ' + paymentNames[paymentMethod]);
}

function checkout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    if (!isLoggedIn) {
        closeCart();
        showNotification('Please login to checkout!');
        setTimeout(() => openAuthModal(), 500);
        return;
    }
    
    openPaymentModal();
}

function filterProducts() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const products = document.querySelectorAll('.product-card');
    const productCount = document.querySelector('.product-count');
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    
    const activeFilter = document.querySelector('.filter-btn.active');
    const filter = activeFilter ? activeFilter.dataset.filter : 'all';
    const maxPrice = priceRange ? parseInt(priceRange.value) : 25000;
    
    if (priceValue) priceValue.textContent = maxPrice.toLocaleString();
    
    let visibleCount = 0;
    products.forEach(product => {
        const price = parseInt(product.dataset.price);
        if ((filter === 'all' || product.dataset.category === filter) && price <= maxPrice) {
            product.style.display = 'block';
            visibleCount++;
        } else {
            product.style.display = 'none';
        }
    });
    
    if (productCount) productCount.textContent = 'Showing ' + visibleCount + ' products';
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterProducts();
    });
});

function sortProducts(value) {
    const grid = document.getElementById('productGrid');
    const products = Array.from(document.querySelectorAll('.product-card'));
    
    products.sort((a, b) => {
        const priceA = parseInt(a.dataset.price);
        const priceB = parseInt(b.dataset.price);
        if (value === 'price-low') return priceA - priceB;
        if (value === 'price-high') return priceB - priceA;
        return 0;
    });
    
    products.forEach(product => grid.appendChild(product));
}

function handleSubscribe(event) {
    event.preventDefault();
    showNotification('Thank you for subscribing!');
    event.target.reset();
}

function handleContactSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;
    const submitBtn = document.getElementById('submitBtn');
    
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    const templateParams = {
        from_name: name,
        from_email: email,
        phone: phone || 'Not provided',
        subject: subject,
        message: message,
        to_email: 'info@habeshatraditional.com'
    };
    
    if (typeof emailjs !== 'undefined' && emailjs._publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
        emailjs.send('YOUR_EMAILJS_SERVICE_ID', 'YOUR_EMAILJS_TEMPLATE_ID', templateParams)
            .then(function() {
                showNotification('Message sent successfully! We will contact you soon.');
                event.target.reset();
            }, function(error) {
                console.log('EmailJS Error:', error);
                showNotification('Message sent! (Demo mode - email will be configured)');
                event.target.reset();
            })
            .finally(function() {
                submitBtn.textContent = 'Send Message';
                submitBtn.disabled = false;
            });
    } else {
        console.log('Contact Form Data:', templateParams);
        showNotification('Message sent successfully! We will contact you soon.');
        event.target.reset();
        submitBtn.textContent = 'Send Message';
        submitBtn.disabled = false;
    }
}

function showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

document.addEventListener('click', function(e) {
    const authModal = document.getElementById('authModal');
    const userMenu = document.getElementById('userMenu');
    const userIcon = document.querySelector('.user-icon');
    
    if (authModal && authModal.classList.contains('active') && !e.target.closest('.auth-modal-content') && !e.target.closest('.user-icon')) {
        closeAuthModal();
    }
    
    if (userMenu && userMenu.classList.contains('active') && !e.target.closest('.user-menu') && !e.target.closest('.user-icon')) {
        userMenu.classList.remove('active');
    }
});

function openProfileModal() {
    toggleUserMenu();
    if (!isLoggedIn) return;
    
    updateProfileModal();
    document.getElementById('profileModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    showProfileTab('edit');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
    document.body.style.overflow = '';
}

function updateProfileModal() {
    if (!currentUser) return;
    
    document.getElementById('profileAvatar').textContent = currentUser.avatar;
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    
    if (document.getElementById('editName')) {
        document.getElementById('editName').value = currentUser.name;
        document.getElementById('editEmail').value = currentUser.email;
        document.getElementById('editPhone').value = currentUser.phone || '';
        document.getElementById('editAddress').value = currentUser.address || '';
    }
    
    renderOrderHistory();
}

function showProfileTab(tab) {
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.profile-content').forEach(c => c.style.display = 'none');
    
    event.target.classList.add('active');
    
    if (tab === 'edit') {
        document.getElementById('editProfileTab').style.display = 'block';
        updateProfileModal();
    } else if (tab === 'orders') {
        document.getElementById('ordersProfileTab').style.display = 'block';
        renderOrderHistory();
    } else if (tab === 'settings') {
        document.getElementById('settingsProfileTab').style.display = 'block';
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
    }
}

function renderOrderHistory() {
    const orderHistory = document.getElementById('orderHistory');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const userOrders = orders.filter(o => o.paymentMethod);
    
    if (userOrders.length === 0) {
        orderHistory.innerHTML = '<p class="no-orders">No orders yet</p>';
        return;
    }
    
    const statusLabels = {
        pending: 'Pending',
        processing: 'Processing',
        shipped: 'Shipped',
        delivered: 'Delivered'
    };
    
    orderHistory.innerHTML = userOrders.map(order => {
        const date = new Date(order.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        
        const items = order.items.map(item => 
            item.name + ' (x' + item.qty + ')'
        ).join('<br>');
        
        return '<div class="order-item">' +
            '<div class="order-header">' +
            '<span class="order-id">' + order.id + '</span>' +
            '<span class="order-status ' + order.status + '">' + statusLabels[order.status] + '</span>' +
            '</div>' +
            '<div class="order-date">' + date + ' | ' + order.paymentMethod.toUpperCase() + '</div>' +
            '<div class="order-items">' + items + '</div>' +
            '<div class="order-total">Total: ETB ' + order.total.toLocaleString() + '</div>' +
            '</div>';
    }).join('');
}

function updateProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('editName').value;
    const email = document.getElementById('editEmail').value;
    const phone = document.getElementById('editPhone').value;
    const address = document.getElementById('editAddress').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === currentUser.email);
    
    if (userIndex !== -1) {
        users[userIndex].name = name;
        users[userIndex].email = email;
        users[userIndex].phone = phone;
        users[userIndex].address = address;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    currentUser = {
        name: name,
        email: email,
        phone: phone,
        address: address,
        avatar: name.charAt(0).toUpperCase()
    };
    
    localStorage.setItem('user', JSON.stringify(currentUser));
    updateUserUI();
    updateProfileModal();
    
    showNotification('Profile updated successfully!');
}

function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmNewPassword) {
        showNotification('New passwords do not match!');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === currentUser.email);
    
    if (userIndex === -1) {
        showNotification('User not found!');
        return;
    }
    
    if (users[userIndex].password !== currentPassword) {
        showNotification('Current password is incorrect!');
        return;
    }
    
    users[userIndex].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    
    showNotification('Password changed successfully!');
}
