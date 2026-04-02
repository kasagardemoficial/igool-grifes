/**
 * iGool Grifes — Script Principal
 * E-commerce de grifes premium
 * Vanilla JS — sem dependências externas
 */

document.addEventListener('DOMContentLoaded', function () {

  // ============================================================
  // 1. MENU MOBILE (hamburger toggle)
  // ============================================================
  var hamburger = document.querySelector('.hamburger');
  var navMenu = document.querySelector('nav, .nav-menu, .nav-links');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function () {
      navMenu.classList.toggle('active');
      hamburger.classList.toggle('open');
    });

    // Fecha o menu ao clicar em qualquer link interno
    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMenu.classList.remove('active');
        hamburger.classList.remove('open');
      });
    });
  }

  // ============================================================
  // 2. POPUP MODAL (exibe após 3s, apenas 1x por sessão)
  // ============================================================
  var popup = document.querySelector('.popup-modal, .popup, .modal-popup');
  var popupClose = document.querySelector('.popup-close, .popup .close, .modal-popup .close');
  var popupOverlay = document.querySelector('.popup-overlay, .overlay');

  if (popup && !sessionStorage.getItem('igool_popup_shown')) {
    setTimeout(function () {
      popup.classList.add('active');
      if (popupOverlay) popupOverlay.classList.add('active');
      sessionStorage.setItem('igool_popup_shown', 'true');
    }, 3000);
  }

  // Fechar popup no X
  if (popupClose) {
    popupClose.addEventListener('click', function () {
      if (popup) popup.classList.remove('active');
      if (popupOverlay) popupOverlay.classList.remove('active');
    });
  }

  // Fechar popup ao clicar no overlay
  if (popupOverlay) {
    popupOverlay.addEventListener('click', function () {
      if (popup) popup.classList.remove('active');
      popupOverlay.classList.remove('active');
    });
  }

  // ============================================================
  // 3. CARRINHO DE COMPRAS (localStorage + badge + quantidades)
  // ============================================================

  /** Recupera o carrinho do localStorage */
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('igool_cart')) || [];
    } catch (e) {
      return [];
    }
  }

  /** Salva o carrinho no localStorage */
  function saveCart(cart) {
    localStorage.setItem('igool_cart', JSON.stringify(cart));
  }

  /** Atualiza o badge do carrinho no header */
  function updateCartBadge() {
    var badges = document.querySelectorAll('.badge, .cart-count');
    var cart = getCart();
    var totalQty = cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
    badges.forEach(function (badge) {
      badge.textContent = totalQty;
      badge.style.display = totalQty > 0 ? 'flex' : 'none';
    });
  }

  // Inicializa o badge ao carregar
  updateCartBadge();

  // Botões "Adicionar ao Carrinho"
  document.querySelectorAll('.add-to-cart, .btn-add-cart').forEach(function (btn) {
    // Salva texto original do botão
    btn.dataset.originalText = btn.textContent.trim();

    btn.addEventListener('click', function () {
      var card = btn.closest('.product-card, .product-detail, .product');
      var cart = getCart();

      // Coleta dados do produto
      var id = btn.dataset.id || (card ? card.dataset.id : '') || Date.now().toString();
      var nameEl = card ? card.querySelector('.product-name, .product-title, h2, h3') : null;
      var name = btn.dataset.name || (nameEl ? nameEl.textContent.trim() : 'Produto');
      var priceText = btn.dataset.price || (card ? (card.querySelector('.product-price, .price') || {}).textContent : '') || '0';
      var price = parseFloat(priceText.replace(/[^\d,.\-]/g, '').replace(',', '.')) || 0;
      var sizeEl = card ? card.querySelector('.size-selector .selected, .sizes .selected') : null;
      var size = sizeEl ? sizeEl.textContent.trim() : '';
      var colorEl = card ? card.querySelector('.color-selector .selected, .colors .selected') : null;
      var color = colorEl ? (colorEl.dataset.color || colorEl.textContent.trim()) : '';
      var imgEl = card ? card.querySelector('img') : null;
      var image = imgEl ? imgEl.src : '';

      // Verifica se já existe item igual no carrinho
      var existingIndex = -1;
      for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === id && cart[i].size === size && cart[i].color === color) {
          existingIndex = i;
          break;
        }
      }

      if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
      } else {
        cart.push({ id: id, name: name, price: price, size: size, color: color, qty: 1, image: image });
      }

      saveCart(cart);
      updateCartBadge();

      // Feedback visual
      btn.textContent = 'Adicionado!';
      btn.classList.add('added');
      setTimeout(function () {
        btn.textContent = btn.dataset.originalText || 'Adicionar ao Carrinho';
        btn.classList.remove('added');
      }, 1500);
    });
  });

  // ---- Página do Carrinho (renderização dinâmica via localStorage) ----
  var cartContainer = document.querySelector('.cart-items, .cart-list');

  /** Calcula desconto atual (cupom) */
  function getDiscountPercent() {
    return parseFloat(sessionStorage.getItem('igool_discount') || '0');
  }

  /** Atualiza os totais exibidos (subtotal, desconto, total) */
  function updateCartTotals(subtotal) {
    var subtotalEl = document.querySelector('#cart-subtotal, .cart-subtotal, .subtotal-value');
    var discountEl = document.querySelector('#cart-discount, .cart-discount, .discount-value');
    var totalEl = document.querySelector('#cart-total, .cart-total, .total-value');

    if (typeof subtotal === 'undefined') {
      // Recalcula a partir das linhas da tabela existente (modo tabela)
      var rows = document.querySelectorAll('.cart-table tbody tr');
      subtotal = 0;
      rows.forEach(function (row) {
        var priceEl = row.querySelector('.cart-unit-price');
        var qtyEl = row.querySelector('.qty-selector input');
        var subEl = row.querySelector('.cart-subtotal');
        if (!priceEl || !qtyEl) return;
        var p = parseFloat(priceEl.dataset.price) || 0;
        var q = parseInt(qtyEl.value) || 1;
        var s = p * q;
        subtotal += s;
        if (subEl) subEl.textContent = 'R$ ' + s.toFixed(2).replace('.', ',');
      });
    }

    var discountPercent = getDiscountPercent();
    var discountValue = subtotal * (discountPercent / 100);
    var total = subtotal - discountValue;

    if (subtotalEl) subtotalEl.textContent = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
    if (discountEl) {
      discountEl.textContent = discountValue > 0
        ? '- R$ ' + discountValue.toFixed(2).replace('.', ',')
        : 'R$ 0,00';
    }
    if (totalEl) totalEl.textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
  }

  /** Renderiza os itens do carrinho na página (modo lista dinâmica) */
  function renderCart() {
    if (!cartContainer) return;

    var cart = getCart();

    if (cart.length === 0) {
      cartContainer.innerHTML = '<p class="cart-empty">Seu carrinho está vazio.</p>';
      updateCartTotals(0);
      return;
    }

    var html = '';
    cart.forEach(function (item, index) {
      html += '<div class="cart-item" data-index="' + index + '">';
      if (item.image) {
        html += '<img src="' + item.image + '" alt="' + item.name + '" class="cart-item-img">';
      }
      html += '<div class="cart-item-info">';
      html += '<h3 class="cart-item-name">' + item.name + '</h3>';
      if (item.size) html += '<span class="cart-item-size">Tam: ' + item.size + '</span>';
      if (item.color) html += '<span class="cart-item-color">Cor: ' + item.color + '</span>';
      html += '<span class="cart-item-price">R$ ' + item.price.toFixed(2).replace('.', ',') + '</span>';
      html += '</div>';
      html += '<div class="cart-item-qty">';
      html += '<button class="qty-btn qty-minus" data-index="' + index + '">\u2212</button>';
      html += '<span class="qty-value">' + item.qty + '</span>';
      html += '<button class="qty-btn qty-plus" data-index="' + index + '">+</button>';
      html += '</div>';
      html += '<span class="cart-item-subtotal">R$ ' + (item.price * item.qty).toFixed(2).replace('.', ',') + '</span>';
      html += '<button class="cart-item-remove" data-index="' + index + '" title="Remover item">&times;</button>';
      html += '</div>';
    });

    cartContainer.innerHTML = html;

    // Calcula subtotal
    var subtotal = cart.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
    updateCartTotals(subtotal);

    // Vincula eventos nos botões de quantidade e remover
    bindCartItemEvents();
  }

  /** Vincula eventos de +, - e remover nos itens renderizados */
  function bindCartItemEvents() {
    // Botão +
    document.querySelectorAll('.cart-item .qty-plus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cart = getCart();
        var index = parseInt(btn.dataset.index);
        if (cart[index]) {
          cart[index].qty += 1;
          saveCart(cart);
          updateCartBadge();
          renderCart();
        }
      });
    });

    // Botão -
    document.querySelectorAll('.cart-item .qty-minus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cart = getCart();
        var index = parseInt(btn.dataset.index);
        if (cart[index] && cart[index].qty > 1) {
          cart[index].qty -= 1;
          saveCart(cart);
          updateCartBadge();
          renderCart();
        }
      });
    });

    // Botão remover
    document.querySelectorAll('.cart-item-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cart = getCart();
        var index = parseInt(btn.dataset.index);
        cart.splice(index, 1);
        saveCart(cart);
        updateCartBadge();
        renderCart();
      });
    });
  }

  // Renderiza o carrinho se o container existe (página do carrinho)
  renderCart();

  // ---- Modo tabela (HTML estático — seletores .qty-selector já existentes) ----
  document.querySelectorAll('.qty-selector').forEach(function (sel) {
    var minus = sel.querySelector('.qty-minus');
    var plus = sel.querySelector('.qty-plus');
    var input = sel.querySelector('input');
    if (!minus || !plus || !input) return;

    minus.addEventListener('click', function () {
      var v = parseInt(input.value) || 1;
      if (v > 1) input.value = v - 1;
      updateCartTotals();
    });
    plus.addEventListener('click', function () {
      var v = parseInt(input.value) || 1;
      input.value = v + 1;
      updateCartTotals();
    });
    input.addEventListener('change', function () {
      if (parseInt(input.value) < 1 || isNaN(parseInt(input.value))) input.value = 1;
      updateCartTotals();
    });
  });

  // Botões remover no modo tabela
  document.querySelectorAll('.cart-remove').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('tr');
      if (row) row.remove();
      updateCartTotals();
    });
  });

  // ============================================================
  // 4. LISTA DE DESEJOS (wishlist — toggle coração)
  // ============================================================
  document.querySelectorAll('.wishlist-btn, .btn-wishlist, .heart-icon').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.toggle('filled');

      // Alterna ícone preenchido/contorno (Font Awesome)
      var icon = btn.querySelector('i, .icon');
      if (icon) {
        if (icon.classList.contains('fa-regular') || icon.classList.contains('far')) {
          icon.classList.remove('fa-regular', 'far');
          icon.classList.add('fa-solid', 'fas');
        } else {
          icon.classList.remove('fa-solid', 'fas');
          icon.classList.add('fa-regular', 'far');
        }
      }
    });
  });

  // ============================================================
  // 5. SELETOR DE TAMANHO
  // ============================================================
  document.querySelectorAll('.size-selector, .sizes').forEach(function (container) {
    var options = container.querySelectorAll('.size-option, .size');
    options.forEach(function (option) {
      option.addEventListener('click', function () {
        // Remove seleção anterior do grupo
        options.forEach(function (o) { o.classList.remove('selected'); });
        // Seleciona/desseleciona o clicado
        option.classList.toggle('selected');
      });
    });
  });

  // ============================================================
  // 6. SELETOR DE COR
  // ============================================================
  document.querySelectorAll('.color-selector, .colors').forEach(function (container) {
    var options = container.querySelectorAll('.color-option, .color');
    options.forEach(function (option) {
      option.addEventListener('click', function () {
        options.forEach(function (o) { o.classList.remove('selected'); });
        option.classList.toggle('selected');
      });
    });
  });

  // ============================================================
  // 7. GALERIA DE IMAGENS DO PRODUTO
  // ============================================================
  var mainImage = document.querySelector('.main-image, .product-main-img');
  var thumbnails = document.querySelectorAll('.thumbnail, .product-thumb');

  if (mainImage && thumbnails.length) {
    thumbnails.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        // Troca imagem principal (suporta <img> e background-image)
        var newSrc = thumb.src || thumb.dataset.src;
        var newBg = thumb.style.backgroundImage || thumb.dataset.bg;

        if (newSrc && mainImage.tagName === 'IMG') {
          mainImage.src = newSrc;
          mainImage.alt = thumb.alt || '';
        } else if (newBg) {
          mainImage.style.backgroundImage = newBg;
        } else if (newSrc) {
          mainImage.style.backgroundImage = 'url(' + newSrc + ')';
        }

        // Destaque visual na miniatura ativa
        thumbnails.forEach(function (t) { t.classList.remove('active'); });
        thumb.classList.add('active');
      });
    });
  }

  // ============================================================
  // 8. SCROLL SUAVE (links âncora)
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href');
      if (targetId === '#' || targetId.length < 2) return;

      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ============================================================
  // 9. BARRA DE BUSCA (Enter redireciona para produtos.html)
  // ============================================================
  var searchInput = document.querySelector('.search-input, .search-bar input, input[type="search"]');

  if (searchInput) {
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var query = searchInput.value.trim();
        if (query) {
          window.location.href = 'produtos.html?busca=' + encodeURIComponent(query);
        }
      }
    });
  }

  // ============================================================
  // 10. FORMULÁRIO DE NEWSLETTER (validação + feedback)
  // ============================================================
  var newsletterForm = document.querySelector('.newsletter-form, .form-newsletter');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var emailInput = newsletterForm.querySelector('input[type="email"], input[name="email"]');
      var email = emailInput ? emailInput.value.trim() : '';

      if (!email || !isValidEmail(email)) {
        showAlert('Por favor, insira um e-mail válido.', 'error');
        return;
      }

      showAlert('Inscrição realizada com sucesso! Você receberá nossas novidades.', 'success');
      newsletterForm.reset();
    });
  }

  /** Valida formato de e-mail */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /** Exibe alerta estilizado temporário */
  function showAlert(message, type) {
    type = type || 'success';

    // Remove alerta anterior se existir
    var existing = document.querySelector('.igool-alert');
    if (existing) existing.remove();

    var alertEl = document.createElement('div');
    alertEl.className = 'igool-alert igool-alert-' + type;
    alertEl.textContent = message;

    // Estilos inline para funcionar sem CSS adicional
    alertEl.style.position = 'fixed';
    alertEl.style.top = '20px';
    alertEl.style.right = '20px';
    alertEl.style.padding = '16px 24px';
    alertEl.style.borderRadius = '8px';
    alertEl.style.color = '#fff';
    alertEl.style.fontWeight = '500';
    alertEl.style.fontSize = '14px';
    alertEl.style.zIndex = '10000';
    alertEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    alertEl.style.transition = 'opacity 0.3s ease';
    alertEl.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
    alertEl.style.maxWidth = '360px';
    alertEl.style.lineHeight = '1.4';

    document.body.appendChild(alertEl);

    setTimeout(function () {
      alertEl.style.opacity = '0';
      setTimeout(function () { alertEl.remove(); }, 300);
    }, 3500);
  }

  // ============================================================
  // 11. FAQ ACCORDION (perguntas e respostas)
  // ============================================================
  document.querySelectorAll('.faq-question, .accordion-header').forEach(function (question) {
    question.addEventListener('click', function () {
      var item = question.closest('.faq-item, .accordion-item') || question.parentElement;
      var answer = item ? item.querySelector('.faq-answer, .accordion-body') : null;
      if (!answer) return;

      var isOpen = item.classList.contains('active');

      // Fecha todos os outros
      document.querySelectorAll('.faq-item, .accordion-item').forEach(function (openItem) {
        openItem.classList.remove('active');
        var openAnswer = openItem.querySelector('.faq-answer, .accordion-body');
        if (openAnswer) openAnswer.style.maxHeight = null;
      });

      // Abre o clicado (se não estava aberto)
      if (!isOpen) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // ============================================================
  // 12. CUPOM DE DESCONTO (IGOOL10 = 10%, IGOOL20 = 20%)
  // ============================================================
  var couponInput = document.querySelector('.coupon-input, .coupon input, input[name="coupon"]');
  var couponBtn = document.querySelector('.coupon-btn, .coupon button, .btn-coupon, .apply-coupon');

  if (couponBtn) {
    couponBtn.addEventListener('click', function () {
      if (!couponInput) return;
      var code = couponInput.value.trim().toUpperCase();

      // Cupons válidos
      var coupons = { 'IGOOL10': 10, 'IGOOL20': 20 };

      if (coupons[code]) {
        var percent = coupons[code];
        sessionStorage.setItem('igool_discount', percent.toString());
        showAlert('Cupom aplicado! Desconto de ' + percent + '% no total.', 'success');
        // Recalcula totais
        renderCart();
        updateCartTotals();
      } else {
        sessionStorage.removeItem('igool_discount');
        showAlert('Cupom inválido. Verifique o código e tente novamente.', 'error');
        updateCartTotals();
      }
    });
  }

  // Aplicar cupom com Enter
  if (couponInput) {
    couponInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (couponBtn) couponBtn.click();
      }
    });
  }

  // ============================================================
  // 13. BOTÃO VOLTAR AO TOPO (aparece após 300px de scroll)
  // ============================================================
  var scrollTopBtn = document.querySelector('.scroll-top, .btn-scroll-top, .back-to-top');

  // Cria o botão caso não exista no HTML
  if (!scrollTopBtn) {
    scrollTopBtn = document.createElement('button');
    scrollTopBtn.className = 'scroll-top';
    scrollTopBtn.innerHTML = '&#8679;';
    scrollTopBtn.setAttribute('aria-label', 'Voltar ao topo');
    scrollTopBtn.style.position = 'fixed';
    scrollTopBtn.style.bottom = '30px';
    scrollTopBtn.style.right = '30px';
    scrollTopBtn.style.width = '48px';
    scrollTopBtn.style.height = '48px';
    scrollTopBtn.style.borderRadius = '50%';
    scrollTopBtn.style.border = 'none';
    scrollTopBtn.style.background = '#111';
    scrollTopBtn.style.color = '#fff';
    scrollTopBtn.style.fontSize = '22px';
    scrollTopBtn.style.cursor = 'pointer';
    scrollTopBtn.style.display = 'none';
    scrollTopBtn.style.alignItems = 'center';
    scrollTopBtn.style.justifyContent = 'center';
    scrollTopBtn.style.zIndex = '9999';
    scrollTopBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    scrollTopBtn.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(scrollTopBtn);
  }

  scrollTopBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ============================================================
  // 14. HEADER STICKY COM SOMBRA NO SCROLL
  // ============================================================
  var header = document.querySelector('header, .header');

  window.addEventListener('scroll', function () {
    var scrollY = window.scrollY;

    // Botão voltar ao topo — exibe após 300px
    if (scrollTopBtn) {
      scrollTopBtn.style.display = scrollY > 300 ? 'flex' : 'none';
    }

    // Sombra no header ao rolar
    if (header) {
      if (scrollY > 0) {
        header.classList.add('shadow');
      } else {
        header.classList.remove('shadow');
      }
    }
  });

  // ============================================================
  // 15. EFEITOS HOVER NOS CARDS DE PRODUTO (transições suaves)
  // ============================================================
  document.querySelectorAll('.product-card, .card-product').forEach(function (card) {
    // Garante transição CSS via JS caso não esteja definida no CSS
    if (!card.style.transition) {
      card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    }
  });

  // ============================================================
  // 16. ABAS DE PAGAMENTO NO CHECKOUT
  // ============================================================

  // Modo radio buttons (input[name="pagamento"])
  var paymentOptions = document.querySelectorAll('input[name="pagamento"]');
  var cardFields = document.getElementById('card-fields');

  if (paymentOptions.length) {
    paymentOptions.forEach(function (opt) {
      opt.addEventListener('change', function () {
        if (cardFields) {
          cardFields.style.display = (opt.value === 'cartao') ? 'block' : 'none';
        }
      });
    });
  }

  // Modo abas (tabs clicáveis)
  var paymentTabs = document.querySelectorAll('.payment-tab, .tab-payment, [data-payment]');
  var paymentPanels = document.querySelectorAll('.payment-panel, .payment-content, [data-payment-panel]');

  if (paymentTabs.length && paymentPanels.length) {
    paymentTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var method = tab.dataset.payment || tab.dataset.method || tab.getAttribute('data-tab');

        // Ativa a aba clicada
        paymentTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');

        // Exibe o painel correspondente e esconde os demais
        paymentPanels.forEach(function (panel) {
          var panelMethod = panel.dataset.paymentPanel || panel.dataset.panel || panel.getAttribute('data-content');
          if (panelMethod === method) {
            panel.classList.add('active');
            panel.style.display = 'block';
          } else {
            panel.classList.remove('active');
            panel.style.display = 'none';
          }
        });
      });
    });
  }

  // ============================================================
  // FORMULÁRIOS EXISTENTES (contato + checkout)
  // ============================================================

  // Formulário de contato
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      showAlert('Mensagem enviada com sucesso! Retornaremos em breve.', 'success');
      contactForm.reset();
    });
  }

  // Formulário de checkout
  var checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', function (e) {
      e.preventDefault();
      showAlert('Pedido finalizado com sucesso! Você receberá um e-mail de confirmação.', 'success');
    });
  }

});
