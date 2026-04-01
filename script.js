let cart = JSON.parse(localStorage.getItem('cart')) || [];
let isLoggedIn = false;
let currentUser = null;
let selectedPayment = null;
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
let compareList = JSON.parse(localStorage.getItem('compareList')) || [];
let productReviews = JSON.parse(localStorage.getItem('productReviews')) || {};

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
    const select = document.getElementById('categorySelect');
    const category = select.value;
    if (category) {
        window.location.href = 'shop.html?category=' + category;
    } else {
        window.location.href = 'shop.html';
    }
}

function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput');
    const category = document.getElementById('categorySelect').value;
    let url = 'shop.html?';
    const params = [];
    if (category) params.push('category=' + category);
    if (searchInput.value) params.push('search=' + encodeURIComponent(searchInput.value));
    url += params.join('&');
    window.location.href = url;
}

function checkUrlCategory() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const search = urlParams.get('search');
    
    if (document.getElementById('categorySelect')) {
        document.getElementById('categorySelect').value = category || '';
    }
    if (document.getElementById('searchInput')) {
        document.getElementById('searchInput').value = search || '';
    }
    
    if (category) {
        const radios = document.querySelectorAll('.filter-list input[type="radio"]');
        radios.forEach(radio => {
            if (radio.value === category) {
                radio.checked = true;
            } else {
                radio.checked = false;
            }
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
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
    updateProductWishlistButtons();
}

function isInWishlist(productId) {
    return wishlist.includes(productId);
}

function updateWishlistUI() {
    const wishlistCount = document.getElementById('wishlistCount');
    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
    }
    updateWishlistMenuLink();
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
        title.textContent = 'Welcome Back';
        subtitle.textContent = 'Sign in to your account';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        title.textContent = 'Create Account';
        subtitle.textContent = 'Join us today';
    }
}

function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.querySelector('input[type="text"], input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    if (!email) {
        showNotification('Please enter your email or phone number!');
        return;
    }
    
    if (!password) {
        showNotification('Please enter your password!');
        return;
    }
    
    if (password.length < 8) {
        showNotification('Password must be at least 8 characters!');
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
        updateUserUI();
        closeAuthModal();
        showNotification('Welcome back, ' + currentUser.name + '!');
    } else {
        showNotification('Invalid email/phone or password!');
    }
}

function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const phone = form.querySelector('input[type="tel"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    if (!name || name.length < 2) {
        showNotification('Please enter a valid name!');
        return;
    }
    
    if (!email || !email.includes('@')) {
        showNotification('Please enter a valid email address!');
        return;
    }
    
    if (!phone || phone.length < 10) {
        showNotification('Please enter a valid phone number!');
        return;
    }
    
    if (!password || password.length < 8) {
        showNotification('Password must be at least 8 characters!');
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
    showNotification('Welcome to Habesha Traditional, ' + currentUser.name + '!');
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
    localStorage.removeItem('user');
    updateUserUI();
    toggleUserMenu();
    showNotification('Logged out successfully!');
}

function toggleUserMenu() {
    if (!isLoggedIn) {
        openAuthModal();
        return;
    }
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.classList.toggle('active');
    }
}

function closeUserMenu() {
    const userMenu = document.getElementById('userMenu');
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
    document.getElementById('cartSidebar').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.body.style.overflow = '';
}

function getProducts() {
    return [
        { id: 1, name: 'Handwoven Habesha Kemis - Traditional Ethiopian Dress', price: 8500, category: 'habesha', image: 'https://images.pexels.com/photos/2736832/pexels-photo-2736832.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 5, reviews: 2847 },
        { id: 2, name: 'Handwoven Leather Sandals - Artisan Crafted', price: 5500, category: 'shoes', image: 'https://images.pexels.com/photos/267202/pexels-photo-267202.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 5, reviews: 1523 },
        { id: 3, name: 'Festival Kemis - Hand-Dyed Cotton', price: 12000, category: 'habesha', image: 'https://images.pexels.com/photos/3617500/pexels-photo-3617500.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4, reviews: 856 },
        { id: 4, name: "Men's Habesha Kemis - Classic White Cotton", price: 7500, category: 'mens', image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4, reviews: 1234 }
    ];
}

function openProductModal(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    addToRecentlyViewed(productId);
    
    const modal = document.getElementById('productModal');
    if (!modal) {
        showNotification('Product details coming soon!');
        return;
    }
    
    document.getElementById('productModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = '';
}

function submitReview(productId) {
    if (!isLoggedIn) {
        showNotification('Please sign in to write a review!');
        setTimeout(() => openAuthModal(), 500);
        return;
    }
    
    const rating = document.querySelector('input[name="rating"]:checked');
    const reviewText = document.getElementById('reviewText')?.value;
    
    if (!rating) {
        showNotification('Please select a rating!');
        return;
    }
    
    if (!reviewText || reviewText.trim().length < 10) {
        showNotification('Please write at least 10 characters!');
        return;
    }
    
    const review = {
        id: Date.now(),
        productId: productId,
        userId: currentUser.email,
        userName: currentUser.name,
        rating: parseInt(rating.value),
        text: reviewText.trim(),
        date: new Date().toISOString()
    };
    
    if (!productReviews[productId]) {
        productReviews[productId] = [];
    }
    
    const existingReview = productReviews[productId].find(r => r.userId === currentUser.email);
    if (existingReview) {
        existingReview.rating = review.rating;
        existingReview.text = review.text;
        existingReview.date = review.date;
        showNotification('Review updated successfully!');
    } else {
        productReviews[productId].unshift(review);
        showNotification('Review submitted successfully!');
    }
    
    localStorage.setItem('productReviews', JSON.stringify(productReviews));
    
    document.getElementById('reviewText').value = '';
    const checkedRadio = document.querySelector('input[name="rating"]:checked');
    if (checkedRadio) checkedRadio.checked = false;
    
    updateProductRating(productId);
}
function updateProductRating(productId) {
    const reviews = productReviews[productId] || [];
    const count = document.querySelector(`.product-card[data-id="${productId}"] .rating-count`);
    if (count) {
        const totalReviews = reviews.length || getProducts().find(p => p.id === productId)?.reviews || 0;
        count.textContent = `(${totalReviews.toLocaleString()})`;
    }
    const stars = document.querySelector(`.product-card[data-id="${productId}"] .stars`);
    if (stars) {
        const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : getProducts().find(p => p.id === productId)?.rating || 5;
        stars.textContent = getStarsHTML(Math.round(avgRating));
    }
}

function getStarsHTML(rating) {
    const fullStar = '★';
    const emptyStar = '☆';
    return fullStar.repeat(rating) + emptyStar.repeat(5 - rating);
}

function getProductReviews(productId) {
    return productReviews[productId] || [];
}

function getAverageRating(productId) {
    const reviews = productReviews[productId] || [];
    if (reviews.length === 0) {
        const product = getProducts().find(p => p.id === productId);
        return product?.rating || 5;
    }
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

function addToRecentlyViewed(productId) {
    const existing = recentlyViewed.indexOf(productId);
    if (existing > -1) {
        recentlyViewed.splice(existing, 1);
    }
    recentlyViewed.unshift(productId);
    if (recentlyViewed.length > 10) {
        recentlyViewed.pop();
    }
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    renderRecentlyViewed();
}

function renderRecentlyViewed() {
    const container = document.getElementById('recentlyViewedGrid');
    if (!container) return;
    
    if (recentlyViewed.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    const products = getProducts();
    const recentProducts = recentlyViewed.map(id => products.find(p => p.id === id)).filter(Boolean);
    
    container.innerHTML = recentProducts.slice(0, 6).map(p => `
        <div class="product-card" data-id="${p.id}">
            <div class="product-image">
                <img src="${p.image}" alt="${p.name}" onclick="openProductModal(${p.id})" style="cursor: pointer;">
            </div>
            <div class="product-info">
                <h3 class="product-title">${p.name}</h3>
                <div class="product-price">
                    <span class="price-current">ETB ${p.price.toLocaleString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function addToCart(name, price) {
    if (!isLoggedIn) {
        showNotification('Please sign in to add items to cart!');
        setTimeout(() => openAuthModal(), 500);
        return;
    }
    
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ name, price, qty: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    updateHeaderCartCount();
    showNotification(name + ' added to cart!');
    openCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    updateHeaderCartCount();
}

function updateCartQty(index, change) {
    cart[index].qty += change;
    if (cart[index].qty < 1) {
        cart.splice(index, 1);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    updateHeaderCartCount();
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
    } else {
        let total = 0;
        cartItems.innerHTML = cart.map((item, index) => {
            total += item.price * item.qty;
            return '<div class="cart-item">' +
                '<img src="https://images.pexels.com/photos/2736832/pexels-photo-2736832.jpeg?auto=compress&cs=tinysrgb&w=100" alt="' + item.name + '" class="cart-item-img">' +
                '<div class="cart-item-info">' +
                '<h4>' + item.name + '</h4>' +
                '<p class="cart-item-price">ETB ' + item.price.toLocaleString() + '</p>' +
                '<div class="cart-item-qty">' +
                '<button onclick="updateCartQty(' + index + ', -1)">-</button>' +
                '<span>' + item.qty + '</span>' +
                '<button onclick="updateCartQty(' + index + ', 1)">+</button>' +
                '</div></div>' +
                '<button class="cart-remove" onclick="removeFromCart(' + index + ')">✕</button></div>';
        }).join('');
    }
    
    if (cartTotal) cartTotal.textContent = 'ETB ' + cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toLocaleString();
    updateHeaderCartCount();
}

function updateHeaderCartCount() {
    const headerCount = document.getElementById('headerCartCount');
    if (headerCount) {
        headerCount.textContent = cart.length;
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
        document.getElementById('deliveryName').value = currentUser.name || '';
        document.getElementById('deliveryPhone').value = currentUser.phone || '';
        document.getElementById('deliverySubCity').value = currentUser.subCity || '';
        document.getElementById('deliveryHouse').value = currentUser.house || '';
    }
    
    // Reset to delivery step
    document.getElementById('deliveryStep').style.display = 'block';
    document.getElementById('paymentStep').style.display = 'none';
    document.getElementById('deliverySummary').style.display = 'none';
    
    // Update totals
    updateDeliveryFee();
    
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
    const city = document.getElementById('deliveryCity').value;
    const fee = deliveryFees[city] || 400;
    const subtotal = getCartTotal();
    const total = subtotal + fee;
    
    document.getElementById('deliveryFeeAmount').textContent = fee === 0 ? 'Free' : 'ETB ' + fee.toLocaleString();
    document.getElementById('deliveryTotal').textContent = 'ETB ' + total.toLocaleString();
}

function getDeliveryFee() {
    const city = document.getElementById('deliveryCity').value;
    return deliveryFees[city] || 400;
}

function goToPaymentStep() {
    const form = document.getElementById('deliveryForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const name = document.getElementById('deliveryName').value;
    const phone = document.getElementById('deliveryPhone').value;
    const city = document.getElementById('deliveryCity').value;
    const subCity = document.getElementById('deliverySubCity').value;
    const house = document.getElementById('deliveryHouse').value;
    const instructions = document.getElementById('deliveryInstructions').value;
    
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
    document.getElementById('summaryName').textContent = name;
    document.getElementById('summaryPhone').textContent = phone;
    document.getElementById('summaryAddress').textContent = (house ? house + ', ' : '') + subCity + ', ' + city.charAt(0).toUpperCase() + city.slice(1);
    
    // Update COD total
    const fee = getDeliveryFee();
    document.getElementById('codTotal').textContent = 'ETB ' + (getCartTotal() + fee).toLocaleString();
    
    // Switch to payment step
    document.getElementById('deliveryStep').style.display = 'none';
    document.getElementById('paymentStep').style.display = 'block';
    document.getElementById('deliverySummary').style.display = 'block';
}

function backToDeliveryStep() {
    document.getElementById('paymentStep').style.display = 'none';
    document.getElementById('deliveryStep').style.display = 'block';
}

function getDeliveryAddress() {
    return {
        name: document.getElementById('deliveryName').value,
        phone: document.getElementById('deliveryPhone').value,
        city: document.getElementById('deliveryCity').value,
        subCity: document.getElementById('deliverySubCity').value,
        house: document.getElementById('deliveryHouse').value,
        instructions: document.getElementById('deliveryInstructions').value,
        fee: getDeliveryFee()
    };
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
    const delivery = getDeliveryAddress();
    const orderTotal = getCartTotal() + delivery.fee;
    
    const order = {
        id: 'ORD-' + Date.now(),
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
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.unshift(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    closePaymentModal();
    closeCart();
    
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
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

function showProfileTab(tab) {
    event?.preventDefault();
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
}

function renderOrderHistory() {
    const orderHistory = document.getElementById('orderHistory');
    if (!orderHistory) return;
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
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


