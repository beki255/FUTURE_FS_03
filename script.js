let cart = [];
let isLoggedIn = false;
let currentUser = null;
let selectedPayment = null;
let wishlist = [];
let recentlyViewed = [];
let compareList = [];
let productReviews = {};
let selectedDeliveryCity = localStorage.getItem('selectedDeliveryCity') || 'addis-ababa';

function loadUserCart() {
    if (currentUser && currentUser.email) {
        const userCartKey = 'cart_' + currentUser.email;
        cart = JSON.parse(localStorage.getItem(userCartKey)) || [];
    } else {
        cart = [];
    }
}

function saveUserCart() {
    if (currentUser && currentUser.email) {
        const userCartKey = 'cart_' + currentUser.email;
        localStorage.setItem(userCartKey, JSON.stringify(cart));
    }
}

function loadUserWishlist() {
    if (currentUser && currentUser.email) {
        const userWishlistKey = 'wishlist_' + currentUser.email;
        wishlist = JSON.parse(localStorage.getItem(userWishlistKey)) || [];
    } else {
        wishlist = [];
    }
}

function saveUserWishlist() {
    if (currentUser && currentUser.email) {
        const userWishlistKey = 'wishlist_' + currentUser.email;
        localStorage.setItem(userWishlistKey, JSON.stringify(wishlist));
    }
}

// Helper function for safe element access
const $ = (id) => document.getElementById(id);
const $el = (el) => el;
const getVal = (id) => { const el = $(id); return el ? el.value : ''; };
const setVal = (id, val) => { const el = $(id); if (el) el.value = val; };
const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };
const setDisplay = (id, val) => { const el = $(id); if (el) el.style.display = val; };
const addClass = (id, cls) => { const el = $(id); if (el) el.classList.add(cls); };
const removeClass = (id, cls) => { const el = $(id); if (el) el.classList.remove(cls); };

const deliveryOptions = {
    'addis-ababa': { fee: 0, days: 1, label: 'Free Delivery' },
    'dire-dawa': { fee: 200, days: 2, label: 'Express Delivery' },
    'bahir-dar': { fee: 250, days: 3, label: 'Standard Delivery' },
    'gondar': { fee: 300, days: 3, label: 'Standard Delivery' },
    'mekelle': { fee: 350, days: 4, label: 'Standard Delivery' },
    'hawassa': { fee: 200, days: 2, label: 'Express Delivery' },
    'jimma': { fee: 250, days: 3, label: 'Standard Delivery' },
    'harar': { fee: 300, days: 3, label: 'Standard Delivery' },
    'other': { fee: 400, days: 5, label: 'Standard Delivery' }
};

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    checkLoginStatus();
    updateCartUI();
    updateHeaderCartCount();
    updateWishlistUI();
    updateProductWishlistButtons();
    renderRecentlyViewed();
    checkUrlCategory();
}

function goToCategory() {
    const select = $('categorySelect');
    const category = select ? select.value : '';
    if (category) {
        window.location.href = 'shop.html?category=' + category;
    } else {
        window.location.href = 'shop.html';
    }
}

function handleSearch(event) {
    event.preventDefault();
    const searchInput = $('searchInput');
    const category = $('categorySelect');
    let url = 'shop.html?';
    const params = [];
    if (category && category.value) params.push('category=' + category.value);
    if (searchInput && searchInput.value) params.push('search=' + encodeURIComponent(searchInput.value));
    url += params.join('&');
    window.location.href = url;
}

function checkUrlCategory() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const search = urlParams.get('search');
    
    if ($('categorySelect')) $('categorySelect').value = category || '';
    if ($('searchInput')) $('searchInput').value = search || '';
    
    if (category) {
        const radios = document.querySelectorAll('.filter-list input[type="radio"]');
        radios.forEach(radio => {
            radio.checked = radio.value === category;
        });
    }
    
    filterProducts();
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.querySelector('.theme-btn');
    if (themeIcon) {
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
}

initTheme();

function toggleWishlist(productId) {
    const existingIndex = wishlist.indexOf(productId);
    if (existingIndex > -1) {
        wishlist.splice(existingIndex, 1);
        showNotification('Removed from wishlist');
    } else {
        wishlist.push(productId);
        showNotification('Added to wishlist');
    }
    saveUserWishlist();
    updateWishlistUI();
    updateProductWishlistButtons();
}

function isInWishlist(productId) {
    return wishlist.includes(productId);
}

function updateWishlistUI() {
    const wishlistCount = $('wishlistCount');
    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
    }
    updateWishlistMenuLink();
}

function openWishlistModal() {
    if (!isLoggedIn) {
        openAuthModal();
        return;
    }
    const modal = $('wishlistModal');
    if (!modal) return;
    
    const container = $('wishlistItems');
    if (!container) return;
    
    if (wishlist.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>No products in wishlist</p></div>`;
    } else {
        const products = getProducts();
        const wishlistProducts = products.filter(p => wishlist.includes(p.id));
        container.innerHTML = wishlistProducts.map(p => `
            <div class="wishlist-item">
                <img src="${p.image}" alt="${p.name}" onclick="openProductModal(${p.id})" style="cursor: pointer;">
                <div class="wishlist-item-info">
                    <h4 onclick="openProductModal(${p.id})" style="cursor: pointer;">${p.name}</h4>
                    <p class="price">ETB ${p.price.toLocaleString()}</p>
                    <div class="wishlist-item-actions">
                        <button class="add-cart-btn" onclick="addToCart('${p.name}', ${p.price}); toggleWishlist(${p.id});">Add to Cart</button>
                        <button class="remove-btn" onclick="toggleWishlist(${p.id})">✕</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeWishlistModal() {
    const modal = $('wishlistModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

function openAuthModal() {
    if (isLoggedIn) {
        toggleUserMenu();
        return;
    }
    const modal = $('authModal');
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    switchAuth('login');
}

function updateWishlistMenuLink() {
    const wishlistLink = document.querySelector('.wishlist-link');
    if (wishlistLink) {
        wishlistLink.innerHTML = `<span>♡</span> Wishlist (${wishlist.length})`;
    }
}

function updateProductWishlistButtons() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const productId = btn.getAttribute('data-id');
        if (isInWishlist(parseInt(productId))) {
            btn.classList.add('active');
            btn.innerHTML = '♥';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '♡';
        }
    });
}

function openWishlistModal() {
    if (!isLoggedIn) {
        openAuthModal();
        return;
    }
    const modal = document.getElementById('wishlistModal');
    if (!modal) return;
    
    const container = document.getElementById('wishlistItems');
    if (!container) return;
    
    if (wishlist.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>No products in wishlist</p></div>`;
    } else {
        const products = getProducts();
        const wishlistProducts = products.filter(p => wishlist.includes(p.id));
        container.innerHTML = wishlistProducts.map(p => `
            <div class="wishlist-item">
                <img src="${p.image}" alt="${p.name}" onclick="openProductModal(${p.id})" style="cursor: pointer;">
                <div class="wishlist-item-info">
                    <h4 onclick="openProductModal(${p.id})" style="cursor: pointer;">${p.name}</h4>
                    <p class="price">$${p.price}</p>
                    <div class="wishlist-item-actions">
                        <button class="add-cart-btn" onclick="addToCart(${p.id}); toggleWishlist(${p.id});">Add to Cart</button>
                        <button class="remove-btn" onclick="toggleWishlist(${p.id})">✕</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeWishlistModal() {
    document.getElementById('wishlistModal').classList.remove('active');
    document.body.style.overflow = '';
}

function closeAuthModal() {
    const modal = $('authModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

function switchAuth(tab) {
    if (event) event.preventDefault();
    const loginForm = $('loginForm');
    const registerForm = $('registerForm');
    const title = $('authTitle');
    const subtitle = $('authSubtitle');
    
    if (tab === 'login') {
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (title) title.textContent = 'Welcome Back';
        if (subtitle) subtitle.textContent = 'Sign in to your account';
    } else {
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        if (title) title.textContent = 'Create Account';
        if (subtitle) subtitle.textContent = 'Join us today';
    }
}

function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const inputs = form.querySelectorAll('input');
    const email = inputs[0] ? inputs[0].value.trim() : '';
    const password = inputs[1] ? inputs[1].value : '';
    
    // Validation
    if (!email) {
        showNotification('⚠️ Please enter your email or phone number!');
        return;
    }
    
    if (!password) {
        showNotification('⚠️ Please enter your password!');
        return;
    }
    
    if (password.length < 8) {
        showNotification('⚠️ Password must be at least 8 characters!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => (u.email === email || u.phone === email) && u.password === password);
    
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
        loadUserCart();
        loadUserWishlist();
        updateUserUI();
        updateCartUI();
        updateWishlistUI();
        updateHeaderCartCount();
        closeAuthModal();
        showNotification('✅ Welcome back, ' + currentUser.name + '!');
    } else {
        showNotification('❌ Invalid email/phone or password!');
    }
}

function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const inputs = form.querySelectorAll('input');
    const name = inputs[0] ? inputs[0].value.trim() : '';
    const email = inputs[1] ? inputs[1].value.trim() : '';
    const phone = inputs[2] ? inputs[2].value.trim() : '';
    const password = inputs[3] ? inputs[3].value : '';
    
    // Validation
    if (!name || name.length < 2) {
        showNotification('⚠️ Please enter a valid name (at least 2 characters)!');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showNotification('⚠️ Please enter a valid email address!');
        return;
    }
    
    if (!phone || phone.length < 10) {
        showNotification('⚠️ Please enter a valid phone number (at least 10 digits)!');
        return;
    }
    
    if (!password || password.length < 8) {
        showNotification('⚠️ Password must be at least 8 characters!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.email === email)) {
        showNotification('❌ Email already registered! Please login.');
        return;
    }
    
    if (users.find(u => u.phone === phone)) {
        showNotification('❌ Phone number already registered! Please login.');
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
    loadUserCart();
    loadUserWishlist();
    updateUserUI();
    updateCartUI();
    updateWishlistUI();
    updateHeaderCartCount();
    closeAuthModal();
    showNotification('✅ Welcome to Habesha Traditional, ' + currentUser.name + '!');
}

function googleSignIn() {
    showNotification('Google sign-in requires API configuration');
}

function facebookSignIn() {
    showNotification('Facebook sign-in requires API configuration');
}

function logout() {
    isLoggedIn = false;
    currentUser = null;
    cart = [];
    wishlist = [];
    localStorage.removeItem('user');
    updateUserUI();
    updateCartUI();
    updateWishlistUI();
    updateHeaderCartCount();
    toggleUserMenu();
    showNotification('Logged out successfully!');
}

function toggleUserMenu() {
    if (!isLoggedIn) {
        openAuthModal();
        return;
    }
    const userMenu = $('userMenu');
    if (userMenu) {
        userMenu.classList.toggle('active');
    }
}

function closeUserMenu() {
    const userMenu = $('userMenu');
    if (userMenu) {
        userMenu.classList.remove('active');
    }
}

function checkLoginStatus() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isLoggedIn = true;
        updateUserUI();
    }
}

function updateUserUI() {
    const headerUserName = document.getElementById('headerUserName');
    const userMenu = document.getElementById('userMenu');
    
    if (isLoggedIn && currentUser) {
        if (headerUserName) headerUserName.textContent = currentUser.name;
        
        if (userMenu) {
            const avatarEl = document.getElementById('userAvatar');
            const nameEl = document.getElementById('userName');
            const emailEl = document.getElementById('userEmail');
            if (avatarEl) avatarEl.textContent = currentUser.avatar;
            if (nameEl) nameEl.textContent = currentUser.name;
            if (emailEl) emailEl.textContent = currentUser.email;
        }
    } else {
        if (headerUserName) headerUserName.textContent = 'Sign in';
    }
}

function openCart() {
    if (!isLoggedIn) {
        showNotification('Please sign in to view your cart!');
        openAuthModal();
        return;
    }
    const sidebar = $('cartSidebar');
    if (sidebar) {
        sidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeCart() {
    const sidebar = $('cartSidebar');
    if (sidebar) {
        sidebar.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function renderRecentlyViewed() {
    // Placeholder for recently viewed products
}

function getDeliveryInfo(city) {
    return deliveryOptions[city] || deliveryOptions['other'];
}

function setDeliveryCity(city) {
    selectedDeliveryCity = city;
    localStorage.setItem('selectedDeliveryCity', city);
    updateCartUI();
}

function getDeliveryDay() {
    const info = getDeliveryInfo(selectedDeliveryCity);
    const date = new Date();
    date.setDate(date.getDate() + info.days);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()] + ', ' + date.toLocaleDateString();
}

function calculateDeliveryFee() {
    const info = getDeliveryInfo(selectedDeliveryCity);
    return info.fee;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveUserCart();
    updateCartUI();
    updateHeaderCartCount();
}

function addToCart(name, price) {
    if (!isLoggedIn) {
        showNotification('Please sign in to add items to cart!');
        openAuthModal();
        return;
    }
    
    const existing = cart.find(item => item.name === name);
    if (existing) {
        if (existing.qty < 10) {
            existing.qty++;
            showNotification(name + ' quantity increased to ' + existing.qty + '!');
        } else {
            showNotification('Maximum quantity (10) reached for ' + name);
            return;
        }
    } else {
        cart.push({ name, price, qty: 1 });
        showNotification(name + ' added to cart!');
    }
    
    saveUserCart();
    updateCartUI();
    updateHeaderCartCount();
    
    const sidebar = $('cartSidebar');
    if (sidebar) {
        sidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function updateCartQty(index, change) {
    cart[index].qty += change;
    if (cart[index].qty < 1) {
        cart.splice(index, 1);
    }
    if (cart[index].qty > 10) cart[index].qty = 10;
    saveUserCart();
    updateCartUI();
    updateHeaderCartCount();
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;
    
    const cartTotal = document.getElementById('cartTotal');
    const cartFooter = document.querySelector('.cart-footer');
    const deliveryInfo = getDeliveryInfo(selectedDeliveryCity);
    const deliveryFee = calculateDeliveryFee();
    let subtotal = 0;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
    } else {
        cartItems.innerHTML = cart.map((item, index) => {
            subtotal += item.price * item.qty;
            return '<div class="cart-item">' +
                '<img src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 80 80\'%3E%3Crect fill=\'%23ddd\' width=\'80\' height=\'80\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23999\' font-size=\'12\'%3ENo Image%3C/text%3E%3C/svg%3E" alt="' + item.name + '" class="cart-item-img">' +
                '<div class="cart-item-info">' +
                '<h4>' + item.name + '</h4>' +
                '<p class="cart-item-price">ETB ' + item.price.toLocaleString() + '</p>' +
                '<div class="cart-item-delivery">' +
                '<span class="delivery-icon">🚚</span>' +
                '<span class="delivery-info">' + deliveryInfo.label + ' - Arrives ' + getDeliveryDay() + '</span>' +
                '</div>' +
                '<div class="cart-item-qty">' +
                '<button onclick="updateCartQty(' + index + ', -1)">-</button>' +
                '<span>' + item.qty + '</span>' +
                '<button onclick="updateCartQty(' + index + ', 1)" ' + (item.qty >= 10 ? 'disabled style="opacity:0.5"' : '') + '>+</button>' +
                '</div></div>' +
                '<button class="cart-remove" onclick="removeFromCart(' + index + ')">✕</button></div>';
        }).join('');
    }
    
    const total = subtotal + deliveryFee;
    
    if (cartTotal) cartTotal.textContent = 'ETB ' + total.toLocaleString();
    
    if (cartFooter && cart.length > 0) {
        cartFooter.innerHTML = `
            <div class="cart-delivery-select">
                <label>Delivery Location:</label>
                <select onchange="setDeliveryCity(this.value)">
                    <option value="addis-ababa" ${selectedDeliveryCity === 'addis-ababa' ? 'selected' : ''}>Addis Ababa (Free)</option>
                    <option value="dire-dawa" ${selectedDeliveryCity === 'dire-dawa' ? 'selected' : ''}>Dire Dawa (ETB 200)</option>
                    <option value="bahir-dar" ${selectedDeliveryCity === 'bahir-dar' ? 'selected' : ''}>Bahir Dar (ETB 250)</option>
                    <option value="gondar" ${selectedDeliveryCity === 'gondar' ? 'selected' : ''}>Gondar (ETB 300)</option>
                    <option value="mekelle" ${selectedDeliveryCity === 'mekelle' ? 'selected' : ''}>Mekelle (ETB 350)</option>
                    <option value="hawassa" ${selectedDeliveryCity === 'hawassa' ? 'selected' : ''}>Hawassa (ETB 200)</option>
                    <option value="jimma" ${selectedDeliveryCity === 'jimma' ? 'selected' : ''}>Jimma (ETB 250)</option>
                    <option value="harar" ${selectedDeliveryCity === 'harar' ? 'selected' : ''}>Harar (ETB 300)</option>
                    <option value="other" ${selectedDeliveryCity === 'other' ? 'selected' : ''}>Other (ETB 400)</option>
                </select>
            </div>
            <div class="order-summary">
                <div class="summary-row"><span>Subtotal:</span><span>ETB ${subtotal.toLocaleString()}</span></div>
                <div class="summary-row"><span>${deliveryInfo.label}:</span><span>${deliveryFee === 0 ? 'FREE' : 'ETB ' + deliveryFee.toLocaleString()}</span></div>
                <div class="summary-row total"><span>Total:</span><span>ETB ${total.toLocaleString()}</span></div>
            </div>
            <p style="font-size: 11px; color: var(--text-light); margin-bottom: 12px;">Delivery: ${deliveryInfo.label} - Est. arrival: ${getDeliveryDay()}</p>
            <button onclick="openPaymentModal()">Proceed to Checkout</button>
        `;
    } else if (cartFooter) {
        cartFooter.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">Your cart is empty</p>';
    }
    updateHeaderCartCount();
}

function updateHeaderCartCount() {
    const headerCount = document.getElementById('headerCartCount');
    if (headerCount) {
        headerCount.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
    }
}

function openPaymentModal() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    if (!isLoggedIn) {
        closeCart();
        showNotification('Please sign in to checkout!');
        setTimeout(() => openAuthModal(), 500);
        return;
    }
    
    selectedPayment = null;
    
    // Pre-fill with user data if available
    if (currentUser) {
        setVal('deliveryName', currentUser.name || '');
        setVal('deliveryPhone', currentUser.phone || '');
        setVal('deliverySubCity', currentUser.subCity || '');
        setVal('deliveryHouse', currentUser.house || '');
    }
    
    // Reset to delivery step
    setDisplay('deliveryStep', 'block');
    setDisplay('paymentStep', 'none');
    setDisplay('deliverySummary', 'none');
    
    // Update totals
    updateDeliveryFee();
    
    document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('selected'));
    setDisplay('paymentDetails', 'none');
    setDisplay('codConfirm', 'none');
    addClass('paymentModal', 'active');
    document.body.style.overflow = 'hidden';
}

function closePaymentModal() {
    removeClass('paymentModal', 'active');
    document.body.style.overflow = '';
}

const deliveryFees = {
    'addis-ababa': 0,
    'dire-dawa': 150,
    'bahir-dar': 200,
    'gondar': 250,
    'mekelle': 300,
    'hawassa': 200,
    'jimma': 250,
    'harar': 300,
    'other': 400
};

function updateDeliveryFee() {
    const cityEl = document.getElementById('deliveryCity');
    if (!cityEl) return;
    const city = cityEl.value;
    const fee = deliveryFees[city] || 400;
    const subtotal = getCartTotal();
    const total = subtotal + fee;
    
    const feeEl = document.getElementById('deliveryFeeAmount');
    const totalEl = document.getElementById('deliveryTotal');
    if (feeEl) feeEl.textContent = fee === 0 ? 'Free' : 'ETB ' + fee.toLocaleString();
    if (totalEl) totalEl.textContent = 'ETB ' + total.toLocaleString();
}

function getDeliveryFee() {
    const cityEl = document.getElementById('deliveryCity');
    if (!cityEl) return 0;
    const city = cityEl.value;
    return deliveryFees[city] || 400;
}

function goToPaymentStep() {
    const form = $('deliveryForm');
    if (!form || !form.checkValidity()) {
        if (form) form.reportValidity();
        return;
    }
    
    const name = getVal('deliveryName');
    const phone = getVal('deliveryPhone');
    const city = getVal('deliveryCity');
    const subCity = getVal('deliverySubCity');
    const house = getVal('deliveryHouse');
    const instructions = getVal('deliveryInstructions');
    
    // Validation
    if (!name || name.length < 2) {
        showNotification('⚠️ Please enter a valid delivery name!');
        return;
    }
    if (!phone || phone.length < 10) {
        showNotification('⚠️ Please enter a valid phone number!');
        return;
    }
    if (!city) {
        showNotification('⚠️ Please select a delivery city!');
        return;
    }
    
    // Save to user profile
    if (currentUser) {
        currentUser.phone = phone;
        currentUser.subCity = subCity;
        currentUser.house = house;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex > -1) {
            users[userIndex].phone = phone;
            users[userIndex].subCity = subCity;
            users[userIndex].house = house;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    
    // Show delivery summary
    setText('summaryName', name);
    setText('summaryPhone', phone);
    setText('summaryAddress', (house ? house + ', ' : '') + subCity + ', ' + city.charAt(0).toUpperCase() + city.slice(1));
    
    // Update COD total
    const fee = getDeliveryFee();
    setText('codTotal', 'ETB ' + (getCartTotal() + fee).toLocaleString());
    
    // Switch to payment step
    setDisplay('deliveryStep', 'none');
    setDisplay('paymentStep', 'block');
    setDisplay('deliverySummary', 'block');
}

function backToDeliveryStep() {
    setDisplay('paymentStep', 'none');
    setDisplay('deliveryStep', 'block');
}

function getDeliveryAddress() {
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
    };
    return {
        name: getVal('deliveryName'),
        phone: getVal('deliveryPhone'),
        city: getVal('deliveryCity'),
        subCity: getVal('deliverySubCity'),
        house: getVal('deliveryHouse'),
        instructions: getVal('deliveryInstructions'),
        fee: getDeliveryFee()
    };
}

function selectPayment(method) {
    selectedPayment = method;
    document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('selected'));
    if (event && event.currentTarget) event.currentTarget.classList.add('selected');
    
    const paymentDetails = document.getElementById('paymentDetails');
    const codConfirm = document.getElementById('codConfirm');
    
    if (method === 'cod') {
        if (paymentDetails) paymentDetails.style.display = 'none';
        if (codConfirm) {
            codConfirm.style.display = 'block';
            const codTotalEl = document.getElementById('codTotal');
            if (codTotalEl) codTotalEl.textContent = 'ETB ' + getCartTotal().toLocaleString();
        }
    } else {
        if (codConfirm) codConfirm.style.display = 'none';
        if (paymentDetails) paymentDetails.style.display = 'block';
        
        const paymentInfo = {
            telebirr: {
                title: 'Telebirr Payment',
                info: 'Send payment to: <strong>+251 91 234 5678</strong><br>Account Name: HABESHA TRADITIONAL CLOTHE<br>After payment, enter the transaction ID below.'
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
        
        const paymentTitleEl = document.getElementById('paymentTitle');
        const paymentInfoEl = document.getElementById('paymentInfo');
        const paymentRefEl = document.getElementById('paymentRef');
        if (paymentTitleEl) paymentTitleEl.textContent = paymentInfo[method].title;
        if (paymentInfoEl) paymentInfoEl.innerHTML = paymentInfo[method].info;
        if (paymentRefEl) paymentRefEl.value = '';
    }
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function processPayment(event) {
    event.preventDefault();
    
    const refEl = $('paymentRef');
    if (!refEl || !refEl.value.trim()) {
        showNotification('⚠️ Please enter the transaction/reference number!');
        return;
    }
    
    if (refEl.value.trim().length < 5) {
        showNotification('⚠️ Reference number must be at least 5 characters!');
        return;
    }
    
    createOrder(selectedPayment, refEl.value.trim());
}

function processCODOrder() {
    createOrder('cod', 'COD-' + Date.now());
}

function saveUserOrders() {
    if (currentUser && currentUser.email) {
        const userOrdersKey = 'orders_' + currentUser.email;
        const orders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
        localStorage.setItem(userOrdersKey, JSON.stringify(orders));
    }
}

function loadUserOrders() {
    if (currentUser && currentUser.email) {
        const userOrdersKey = 'orders_' + currentUser.email;
        return JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
    }
    return [];
}

function createOrder(paymentMethod, ref) {
    const delivery = getDeliveryAddress();
    const orderTotal = getCartTotal() + delivery.fee;
    
    const order = {
        id: 'ORD-' + Date.now(),
        userEmail: currentUser.email,
        items: [...cart],
        subtotal: getCartTotal(),
        deliveryFee: delivery.fee,
        total: orderTotal,
        paymentMethod: paymentMethod,
        paymentRef: ref,
        status: 'processing',
        date: new Date().toISOString(),
        delivery: delivery
    };
    
    const orders = loadUserOrders();
    orders.unshift(order);
    
    if (currentUser && currentUser.email) {
        const userOrdersKey = 'orders_' + currentUser.email;
        localStorage.setItem(userOrdersKey, JSON.stringify(orders));
    }
    
    closePaymentModal();
    closeCart();
    
    cart = [];
    saveUserCart();
    updateCartUI();
    updateHeaderCartCount();
    
    showNotification('Order placed successfully! We will deliver to ' + delivery.city);
}

function filterProducts() {
    const products = document.querySelectorAll('.product-card');
    const productCount = document.getElementById('productCount');
    const priceMin = parseInt(document.getElementById('priceMin')?.value) || 0;
    const priceMax = parseInt(document.getElementById('priceMax')?.value) || 25000;
    
    const selectedRadio = document.querySelector('.filter-list input[type="radio"]:checked');
    const selectedCategory = selectedRadio ? selectedRadio.value : '';
    
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    let visibleCount = 0;
    products.forEach(product => {
        const price = parseInt(product.dataset.price);
        const category = product.dataset.category;
        const name = product.querySelector('.product-title')?.textContent.toLowerCase() || '';
        const desc = product.querySelector('.product-category')?.textContent.toLowerCase() || '';
        
        const categoryMatch = !selectedCategory || category === selectedCategory;
        const priceMatch = price >= priceMin && price <= priceMax;
        const searchMatch = !searchTerm || name.includes(searchTerm) || desc.includes(searchTerm);
        
        if (categoryMatch && priceMatch && searchMatch) {
            product.style.display = '';
            visibleCount++;
        } else {
            product.style.display = 'none';
        }
    });
    
    if (productCount) productCount.textContent = 'Showing ' + visibleCount + ' products';
}

function sortProducts(value) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
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

function toggleCompare(productId) {
    const index = compareList.indexOf(productId);
    if (index > -1) {
        compareList.splice(index, 1);
        showNotification('Removed from compare list');
    } else {
        if (compareList.length >= 4) {
            showNotification('Maximum 4 products to compare');
            return;
        }
        compareList.push(productId);
        showNotification('Added to compare');
    }
    localStorage.setItem('compareList', JSON.stringify(compareList));
    updateCompareSidebar();
    updateProductCompareButtons();
}

function isInCompareList(productId) {
    return compareList.includes(productId);
}

function updateCompareSidebar() {
    const sidebar = document.getElementById('compareSidebar');
    if (!sidebar) return;
    
    const count = document.getElementById('compareCount');
    if (count) count.textContent = compareList.length;
    
    if (compareList.length > 0) {
        sidebar.classList.add('active');
    } else {
        sidebar.classList.remove('active');
    }
}

function updateProductCompareButtons() {
    document.querySelectorAll('.compare-btn').forEach(btn => {
        const productId = parseInt(btn.getAttribute('data-id'));
        if (isInCompareList(productId)) {
            btn.classList.add('active');
            btn.innerHTML = '⚖';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '⚖';
        }
    });
}

function openCompareModal() {
    if (compareList.length < 2) {
        showNotification('Add at least 2 products to compare!');
        return;
    }
    
    const modal = document.getElementById('compareModal');
    if (!modal) return;
    
    const products = getProducts();
    const compareProducts = compareList.map(id => products.find(p => p.id === id));
    
    const tbody = document.getElementById('compareTableBody');
    if (!tbody) return;
    
    let html = '<tr><td>Image</td>';
    compareProducts.forEach(p => {
        html += `<td><img src="${p.image}" alt="${p.name}"></td>`;
    });
    html += '</tr><tr><td>Name</td>';
    compareProducts.forEach(p => {
        html += `<td>${p.name}</td>`;
    });
    html += '</tr><tr><td>Price</td>';
    compareProducts.forEach(p => {
        html += `<td>ETB ${p.price.toLocaleString()}</td>`;
    });
    html += '</tr><tr><td>Category</td>';
    compareProducts.forEach(p => {
        html += `<td>${p.category}</td>`;
    });
    html += '</tr><tr><td>Rating</td>';
    compareProducts.forEach(p => {
        html += `<td>${getStarsHTML(Math.round(getAverageRating(p.id)))}</td>`;
    });
    html += '</tr><tr><td>Reviews</td>';
    compareProducts.forEach(p => {
        const reviews = getProductReviews(p.id);
        html += `<td>${reviews.length}</td>`;
    });
    html += '</tr><tr><td>Stock</td>';
    compareProducts.forEach(() => {
        html += `<td><span style="color: var(--success);">✓ In Stock</span></td>`;
    });
    html += '</tr><tr><td>Action</td>';
    compareProducts.forEach(p => {
        html += `<td><button class="add-cart-btn" onclick="addToCart('${p.name}', ${p.price})">Add to Cart</button></td>`;
    });
    html += '</tr>';
    
    tbody.innerHTML = html;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCompareModal() {
    document.getElementById('compareModal').classList.remove('active');
    document.body.style.overflow = '';
}

function clearCompare() {
    compareList = [];
    localStorage.setItem('compareList', JSON.stringify(compareList));
    updateCompareSidebar();
    updateProductCompareButtons();
    showNotification('Compare list cleared!');
}

function openSizeGuide() {
    const modal = document.getElementById('sizeGuideModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSizeGuide() {
    document.getElementById('sizeGuideModal').classList.remove('active');
    document.body.style.overflow = '';
}

function openBulkOrderForm() {
    const modal = document.getElementById('bulkOrderModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeBulkOrderModal() {
    document.getElementById('bulkOrderModal').classList.remove('active');
    document.body.style.overflow = '';
}

function submitBulkOrder(event) {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    
    showNotification('Your bulk order request has been submitted! We will contact you within 24 hours.');
    form.reset();
    closeBulkOrderModal();
}

function openOrderTracking(orderId) {
    const modal = document.getElementById('orderTrackingModal');
    if (!modal) return;
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        showNotification('Order not found!');
        return;
    }
    
    const timeline = document.getElementById('orderTrackingTimeline');
    if (timeline) {
        const statuses = ['pending', 'processing', 'shipped', 'outForDelivery', 'delivered'];
        const currentIndex = statuses.indexOf(order.status);
        
        timeline.innerHTML = statuses.map((status, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const statusLabels = {
                pending: 'Order Placed',
                processing: 'Processing',
                shipped: 'Shipped',
                outForDelivery: 'Out for Delivery',
                delivered: 'Delivered'
            };
            return `
                <div class="tracking-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                    <div class="step-icon">${isCompleted ? '✓' : ''}</div>
                    <div class="step-info">
                        <strong>${statusLabels[status]}</strong>
                        ${isCurrent ? '<p>Current status</p>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }  
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeOrderTracking() {
    document.getElementById('orderTrackingModal').classList.remove('active');
    document.body.style.overflow = '';
}
function reorderItems(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    order.items.forEach(item => {
        addToCart(item.name, item.price);
    });
    
    showNotification('Items added to cart! Review your cart to checkout.');
}

function savePaymentMethod(paymentData) {
    if (!isLoggedIn) {
        openAuthModal();
        return;
    }
    
    let savedPayments = JSON.parse(localStorage.getItem('savedPayments') || '[]');
    const existingIndex = savedPayments.findIndex(p => p.last4 === paymentData.last4);
    
    if (existingIndex > -1) {
        savedPayments[existingIndex] = { ...savedPayments[existingIndex], ...paymentData };
    } else {
        savedPayments.push({
            ...paymentData,
            id: Date.now(),
            userId: currentUser.email
        });
    }
    
    localStorage.setItem('savedPayments', JSON.stringify(savedPayments));
    showNotification('Card saved!');
}

function removePaymentMethod(paymentId) {
    let savedPayments = JSON.parse(localStorage.getItem('savedPayments') || '[]');
    savedPayments = savedPayments.filter(p => p.id !== paymentId);
    localStorage.setItem('savedPayments', JSON.stringify(savedPayments));
    showNotification('Payment method removed');
    renderSavedPayments();
}

function setDefaultPayment(paymentId) {
    let savedPayments = JSON.parse(localStorage.getItem('savedPayments') || '[]');
    savedPayments = savedPayments.map(p => ({
        ...p,
        isDefault: p.id === paymentId
    }));
    localStorage.setItem('savedPayments', JSON.stringify(savedPayments));
    showNotification('Default payment method updated');
    renderSavedPayments();
}

function renderSavedPayments() {
    const container = document.getElementById('savedPaymentsList');
    if (!container) return;
    
    const savedPayments = JSON.parse(localStorage.getItem('savedPayments') || '[]')
        .filter(p => p.userId === currentUser?.email);
    
    if (savedPayments.length === 0) {
        container.innerHTML = `<p style="color: var(--text-light); text-align: center; padding: 20px;">No saved payment methods</p>`;
        return;
    }
    
    container.innerHTML = savedPayments.map(p => `
        <div class="payment-card ${p.isDefault ? 'default' : ''}">
            <div class="payment-card-info">
                <div class="payment-card-icon">${p.type === 'telebirr' ? 'T' : p.last4}</div>
                <div>
                    <strong>${p.type === 'telebirr' ? 'Telebirr' : '**** ' + p.last4}</strong>
                    ${p.isDefault ? '<span style="color: var(--primary); font-size: 12px; margin-left: 8px;">Default</span>' : ''}
                </div>
            </div>
            <div class="payment-card-actions">
                ${!p.isDefault ? `<button class="default-btn" onclick="setDefaultPayment(${p.id})">Set Default</button>` : ''}
                <button class="remove-btn" onclick="removePaymentMethod(${p.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

function openNotificationSettings() {
    const modal = document.getElementById('notificationModal');
    if (!modal) return;
    
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    if (!currentUser) {
        showNotification('Please sign in first!');
        return;
    }
    
    const userSettings = settings[currentUser.email] || {
        emailNotifications: true,
        smsNotifications: true,
        orderUpdates: true,
        promotionalEmails: true
    };
    
    document.getElementById('emailNotifToggle').checked = userSettings.emailNotifications;
    document.getElementById('smsNotifToggle').checked = userSettings.smsNotifications;
    document.getElementById('orderUpdatesToggle').checked = userSettings.orderUpdates;
    document.getElementById('promoEmailsToggle').checked = userSettings.promotionalEmails;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeNotificationModal() {
    document.getElementById('notificationModal').classList.remove('active');
    document.body.style.overflow = '';
}

function saveNotificationSettings() {
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    settings[currentUser.email] = {
        emailNotifications: document.getElementById('emailNotifToggle').checked,
        smsNotifications: document.getElementById('smsNotifToggle').checked,
        orderUpdates: document.getElementById('orderUpdatesToggle').checked,
        promotionalEmails: document.getElementById('promoEmailsToggle').checked
    };
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    showNotification('Preferences saved!');
    closeNotificationModal();
}

function getShoppingInsights() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const userOrders = orders.filter(o => o.userId === currentUser?.email);
    
    const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
    const totalItems = userOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0);
    
    const categoryCount = {};
    userOrders.forEach(o => {
        o.items.forEach(i => {
            const product = getProducts().find(p => p.name === i.name);
            if (product) {
                categoryCount[product.category] = (categoryCount[product.category] || 0) + i.qty;
            }
        });
    });
    
    const favoriteCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    return {
        totalOrders: userOrders.length,
        totalSpent,
        totalItems,
        favoriteCategory
    };
}

function openShoppingInsights() {
    const modal = document.getElementById('insightsModal');
    if (!modal) return;
    
    const insights = getShoppingInsights();
    
    document.getElementById('insightTotalOrders').textContent = insights.totalOrders;
    document.getElementById('insightTotalSpent').textContent = 'ETB ' + insights.totalSpent.toLocaleString();
    document.getElementById('insightTotalItems').textContent = insights.totalItems;
    document.getElementById('insightFavoriteCategory').textContent = insights.favoriteCategory.charAt(0).toUpperCase() + insights.favoriteCategory.slice(1);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeInsightsModal() {
    document.getElementById('insightsModal').classList.remove('active');
    document.body.style.overflow = '';
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
    const userIcon = document.querySelector('.header-action');
    
    if (authModal && authModal.classList.contains('active') && !e.target.closest('.modal-content') && !e.target.closest('.header-action')) {
        closeAuthModal();
    }
    
    if (userMenu && userMenu.classList.contains('active') && !e.target.closest('.user-menu') && !e.target.closest('.header-action')) {
        userMenu.classList.remove('active');
    }
});

function openProfileModal(tab) {
    try {
        toggleUserMenu();
    } catch(e) {}
    
    if (!isLoggedIn) {
        openAuthModal();
        return;
    }
    
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        updateProfileModal();
        profileModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        showProfileTab(tab || 'edit');
    }
}

function updateProfileModal() {
    if (!currentUser) return;
    
    const avatarEl = document.getElementById('profileAvatar');
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    
    if (avatarEl) avatarEl.textContent = currentUser.avatar;
    if (nameEl) nameEl.textContent = currentUser.name;
    if (emailEl) emailEl.textContent = currentUser.email;
    
    const editName = document.getElementById('editName');
    const editEmail = document.getElementById('editEmail');
    const editPhone = document.getElementById('editPhone');
    const editAddress = document.getElementById('editAddress');
    
    if (editName) editName.value = currentUser.name;
    if (editEmail) editEmail.value = currentUser.email;
    if (editPhone) editPhone.value = currentUser.phone || '';
    if (editAddress) editAddress.value = currentUser.address || '';
    
    renderOrderHistory();
}

function closeProfileModal() {
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        profileModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function showProfileTab(tab) {
    if (event) event.preventDefault();
    
    try {
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.profile-content').forEach(c => c.style.display = 'none');
        
        const tabs = document.querySelectorAll('.profile-tab');
        tabs.forEach(t => {
            if (t.textContent.toLowerCase().includes(tab === 'edit' ? 'edit' : 'order')) {
                t.classList.add('active');
            }
        });
        
        const tabContent = document.getElementById(tab === 'edit' ? 'editProfileTab' : 'ordersProfileTab');
        if (tabContent) tabContent.style.display = 'block';
        
        if (tab === 'edit') {
            updateProfileModal();
        } else if (tab === 'orders') {
            renderOrderHistory();
        }
    } catch(e) {
        console.log('Profile tabs not available on this page');
    }
}

function deleteOrder(orderId) {
    const orders = loadUserOrders();
    const updatedOrders = orders.filter(order => order.id !== orderId);
    
    if (currentUser && currentUser.email) {
        const userOrdersKey = 'orders_' + currentUser.email;
        localStorage.setItem(userOrdersKey, JSON.stringify(updatedOrders));
    }
    
    renderOrderHistory();
    showNotification('Order deleted successfully!');
}

function renderOrderHistory() {
    const orderHistory = $('orderHistory');
    if (!orderHistory) return;
    
    const orders = loadUserOrders();
    
    if (orders.length === 0) {
        orderHistory.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">No orders yet</p>';
        return;
    }
    
    const statusLabels = {
        pending: 'Pending',
        processing: 'Processing',
        shipped: 'Shipped',
        delivered: 'Delivered'
    };
    
    orderHistory.innerHTML = orders.slice(0, 10).map(order => {
        const date = new Date(order.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        
        const items = order.items.map(item => 
            item.name + ' (x' + item.qty + ')'
        ).join(', ');
        
        return '<div class="order-item">' +
            '<div class="order-header">' +
            '<span class="order-id">' + order.id + '</span>' +
            '<span class="order-status ' + order.status + '">' + statusLabels[order.status] + '</span>' +
            '<button class="order-delete-btn" onclick="deleteOrder(\'' + order.id + '\')" title="Delete Order">🗑️</button>' +
            '</div>' +
            '<div class="order-date">' + date + ' | ' + order.paymentMethod.toUpperCase() + '</div>' +
            '<div class="order-items">' + items + '</div>' +
            '<div class="order-total">Total: ETB ' + order.total.toLocaleString() + '</div>' +
            '</div>';
    }).join('');
}

function updateProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('editName')?.value;
    const email = document.getElementById('editEmail')?.value;
    const phone = document.getElementById('editPhone')?.value;
    const address = document.getElementById('editAddress')?.value;
    
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

document.addEventListener('DOMContentLoaded', function() {
    filterProducts();
    
    const priceInputs = document.querySelectorAll('#priceMin, #priceMax');
    priceInputs.forEach(input => {
        input.addEventListener('input', filterProducts);
    });

    document.addEventListener('click', function(e) {
        const userMenu = document.getElementById('userMenu');
        const userMenuWrapper = document.querySelector('.user-menu-wrapper');
        if (userMenu && userMenuWrapper && !userMenuWrapper.contains(e.target)) {
            closeUserMenu();
        }
    });
});


