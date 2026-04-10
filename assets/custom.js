$(document).ready(function () {
  $("body").on(
    "keyup",
    '.additional_properties .propeties input[type="text"]',
    function () {
      if (
        $(".shopify-product-form").find('[name="' + $(this).attr("name") + '"]')
          .length > 0
      ) {
        $(".shopify-product-form")
          .find('[name="' + $(this).attr("name") + '"]')
          .val($(this).val());
      } else {
        $(".shopify-product-form").append(
          '<input type="hidden" name="' +
            $(this).attr("name") +
            '" class="stitched_properties" value="' +
            $(this).val() +
            '">',
        );
      }
      if ($(this).val().length == 0) {
        $(".shopify-product-form")
          .find('[name="' + $(this).attr("name") + '"]')
          .remove();
      }
    },
  );

  $(".checkbox").click(function () {
    if (
      this.checked &&
      $(".mul").length > 0 &&
      $("input:checkbox:checked").length > 0
    ) {
      var multNum1 = $(".mul").val();
      var multNum = $("input:checkbox:checked").val();
      let number = multNum1 * multNum;
      $(".mul").val(number);
    } else {
      $(".mul").val(1);
    }
  });

  $(".product-info__property:first input").addClass("checkboxnew");
  $(".checkboxnew").click(function () {
    if (this.checked) {
      $(".mul").val(1);
      // $('.price-list.price-list--lg sale-price.text-lg').text('₹ '+price);
    }
  });
  var price = $(".price-list.price-list--lg sale-price.text-lg").attr(
    "data-price",
  );
  var path = window.location.href;
  $(".cstmTabs .inner-color-div a").each(function () {
    if (this.href === path) {
      $(this).addClass("active");
    }
  });
});

window.onload = function () {
  $(".cstmhome-tabs").each(function (i) {
    $(this).addClass("tabsnew" + i);
  });
};

// ============================================================

var pInfScrLoading = false;
var pInfScrDelay = 50;
window.__infScrollLoading = false;

function pInfScrExecute() {
  if (
    $(document).height() - 800 <
    $(document).scrollTop() + $(window).height()
  ) {
    var pInfScrNode = $(".more").last();
    var pInfScrURL = $(".more a").last().attr("href");

    // ❌ stop if already loading or no next page
    if (pInfScrLoading || !pInfScrURL) return;

    $.ajax({
      type: "GET",
      url: pInfScrURL,

      beforeSend: function () {
        pInfScrLoading = true;
        window.__infScrollLoading = true;

        if (!$(".loader-ellips").length) {
          $("#product-list-foot").before(
            '<div class="loader-ellips">' +
              '<span class="loader-ellips__dot"></span>' +
              '<span class="loader-ellips__dot"></span>' +
              '<span class="loader-ellips__dot"></span>' +
              '<span class="loader-ellips__dot"></span>' +
              "</div>",
          );
        }

        pInfScrNode.hide();
      },

      success: function (data) {
        var $data = $(data);

        // 1️⃣ Get new products
        var $newProducts = $data.find("product-list > *");

        // 2️⃣ Get next pagination link
        var $newMore = $data.find(".more").last();

        if ($newProducts.length) {
          // Append products
          $("product-list").append($newProducts);

          // 3️⃣ Replace old ".more" with new one
          if ($newMore.length) {
            $(".more").replaceWith($newMore);
            pInfScrLoading = false;
            window.__infScrollLoading = false;
            $(".loader-ellips").remove();
          } else {
            // ❌ No next page
            $(".loader-ellips").remove();
            $(".more").remove();
            $(window).off("scroll");
          }
        } else {
          // ❌ No products returned
          $(".loader-ellips").remove();
          $(".more").remove();
          $(window).off("scroll");
        }
      },

      error: function () {
        $(".loader-ellips").remove();
        pInfScrLoading = false;
        window.__infScrollLoading = false;
      },

      dataType: "html",
    });
  }
}

$(document).ready(function () {
  $(window).scroll(function () {
    $.doTimeout("scroll", pInfScrDelay, pInfScrExecute);
    if (
      $(document).height() - 800 >
      $(document).scrollTop() + $(window).height()
    ) {
      pInfScrDelay = 50;
    }
  });
  if (window.location.href.indexOf("/products/") > -1) {
    let el = document.querySelector(
      ".shopify-section--main-product .product-info__buy-buttons",
    );
    let element = document.querySelector(
      ".shopify-section--main-product .product-quick-add",
    );
    function isInViewport(el) {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
          (window.innerWidth || document.documentElement.clientWidth)
      );
    }
  }
});

// Force cart drawer behavior instead of redirecting to /cart page.
(function () {
  const CART_DRAWER_SELECTOR = "#cart-drawer";
  const CART_SECTION_SELECTOR = "#shopify-section-cart-drawer";
  let lastAtcSubmitQty = null;
  let lastAtcSubmitAt = 0;

  function getVisibleRuntimeQty() {
    const isVisible = function (el) {
      if (!el) return false;
      if (el.hidden) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      return Boolean(el.offsetParent || el.getClientRects().length);
    };

    const selectors = [
      "#homeatcc",
      '#additionalContent input[name="overlay_quantity"]',
      '.shopify-section--main-product input[name="quantity"]',
      'input[id$="-sticky-quantity"]',
    ];

    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);
      for (const input of nodes) {
        if (!isVisible(input)) continue;
        const qty = parseInt(input.value || input.getAttribute("value"), 10);
        if (Number.isFinite(qty) && qty > 0) return qty;
      }
    }

    return null;
  }

  function isCartPage() {
    return /^\/cart(?:\/|$)/.test(window.location.pathname);
  }

  function createFallbackOverlay(drawer) {
    let overlay = document.querySelector(
      '.drawer-overlay[data-cart-drawer-fallback="true"]',
    );

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "drawer-overlay";
      overlay.dataset.cartDrawerFallback = "true";
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.right = "0";
      overlay.style.bottom = "0";
      overlay.style.height = "100vh";
      overlay.style.background = "#0000008c";
      overlay.style.zIndex = "1";
      overlay.style.opacity = "1";
      overlay.style.cursor = "pointer";
      overlay.addEventListener("click", function () {
        closeCartDrawerFallback();
      });
      document.body.appendChild(overlay);
    }

    drawer.addEventListener(
      "click",
      function (event) {
        if (event.target.closest('[is="close-button"]')) {
          closeCartDrawerFallback();
        }
      },
      { once: true },
    );
  }

  function closeCartDrawerFallback() {
    const drawer = document.querySelector(CART_DRAWER_SELECTOR);
    if (drawer) {
      drawer.removeAttribute("open");
      drawer.style.removeProperty("transform");
      drawer.style.removeProperty("visibility");
      drawer.style.removeProperty("opacity");
      drawer.style.removeProperty("display");
      drawer.style.removeProperty("z-index");
    }

    const overlay = document.querySelector(
      '.drawer-overlay[data-cart-drawer-fallback="true"]',
    );
    if (overlay) {
      overlay.remove();
    }

    document.body.style.overflow = "";
    document.body.classList.remove("drawer-open");
  }

  function openCartDrawer() {
    const drawer = document.querySelector(CART_DRAWER_SELECTOR);
    if (!drawer) return;

    // Prefer the theme's own trigger path so any internal drawer logic runs.
    const nativeTrigger = document.querySelector(
      '[aria-controls="cart-drawer"]',
    );
    if (nativeTrigger && !drawer.hasAttribute("open")) {
      nativeTrigger.click();
    }

    if (typeof drawer.show === "function") {
      drawer.show();
    } else {
      drawer.setAttribute("open", "");
      document.body.style.overflow = "hidden";
      document.body.classList.add("drawer-open");
      createFallbackOverlay(drawer);
    }

    // Hard-ensure visibility in heavily overridden themes.
    drawer.style.transform = "translateX(0%)";
    drawer.style.visibility = "visible";
    drawer.style.opacity = "1";
    drawer.style.display = "block";
    drawer.style.zIndex = "9999";
  }

  function closeCartDrawer() {
    const drawer = document.querySelector(CART_DRAWER_SELECTOR);
    if (!drawer) return;

    if (typeof drawer.hide === "function") {
      drawer.hide();
      return;
    }

    closeCartDrawerFallback();
  }

  function updateCartCounters(itemCount) {
    document.querySelectorAll("cart-count").forEach(function (counter) {
      counter.textContent = String(itemCount);

      if (counter.classList.contains("count-bubble")) {
        counter.classList.toggle("opacity-0", itemCount === 0);
      }
    });
  }

  function updateMinusButtonState(root) {
    (root || document)
      .querySelectorAll(".cart-button")
      .forEach(function (wrapper) {
        const input = wrapper.querySelector(".quantity-input");
        const minus = wrapper.querySelector(".cart-mini");

        if (!input || !minus) return;

        const qty = parseInt(input.value, 10) || 1;
        minus.disabled = qty <= 1;
      });
  }

  function getPreferredFormQuantity(form, submitter) {
    if (!form) return 1;

    const parseQty = function (value) {
      const n = parseInt(value, 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    const readInputQty = function (input) {
      if (!input) return null;
      // Some legacy scripts mutate only the value attribute via setAttribute().
      return parseQty(input.value) || parseQty(input.getAttribute("value"));
    };

    const isVisible = function (el) {
      if (!el) return false;
      if (el.hidden) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      return Boolean(el.offsetParent || el.getClientRects().length);
    };

    // Legacy popup ATC uses #homeatcc as visible quantity and #homeatc hidden in form.
    if (form.id === "atcForm" || form.querySelector("#homeatc")) {
      const popupQty = readInputQty(document.getElementById("homeatcc"));
      if (popupQty) return popupQty;
    }

    // Prefer quantity input in the same visible UI context as the clicked submitter.
    if (submitter) {
      const submitContext =
        submitter.closest("product-quick-add") ||
        submitter.closest("#additionalContent") ||
        submitter.closest("#popup") ||
        submitter.closest(".shopify-section--main-product") ||
        form;

      if (submitContext && form.id) {
        const localBound = submitContext.querySelectorAll(
          '[name="quantity"][form="' + form.id + '"]',
        );
        for (const input of localBound) {
          if (!isVisible(input)) continue;
          const qty = readInputQty(input);
          if (qty) return qty;
        }
      }
    }

    // If sticky quick-add submitted, use sticky quantity only when visible.
    if (submitter && submitter.closest("product-quick-add")) {
      const stickyInput = document.getElementById(form.id + "-sticky-quantity");
      const stickyQty = isVisible(stickyInput) ? readInputQty(stickyInput) : null;
      if (stickyQty) return stickyQty;
    }

    // Otherwise use visible enabled quantity fields bound to the form.
    const boundSelector = '[name="quantity"]:not([disabled])[form="' + form.id + '"]';
    const formSelector = '[name="quantity"]:not([disabled])';
    const localCandidates = Array.from(form.querySelectorAll(formSelector));
    const boundCandidates = Array.from(document.querySelectorAll(boundSelector));
    const candidates = localCandidates.concat(boundCandidates);

    for (const input of candidates) {
      if (!isVisible(input)) continue;
      const qty = readInputQty(input);
      if (qty) return qty;
    }

    for (const input of candidates) {
      const qty = readInputQty(input);
      if (qty) return qty;
    }

    return 1;
  }

  async function refreshCartDrawerFromSection() {
    const cartSection = document.querySelector(CART_SECTION_SELECTOR);
    if (!cartSection) return;

    const sectionUrls = [
      "/?section_id=cart-drawer",
      "/cart?section_id=cart-drawer",
    ];
    let updatedSection = null;

    for (const sectionUrl of sectionUrls) {
      const response = await fetch(sectionUrl, { credentials: "same-origin" });
      if (!response.ok) continue;

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      updatedSection = doc.querySelector(CART_SECTION_SELECTOR);
      if (updatedSection) break;
    }

    if (updatedSection) {
      const currentDrawer = cartSection.querySelector("cart-drawer");
      const newDrawer = updatedSection.querySelector("cart-drawer");

      if (currentDrawer && newDrawer) {
        currentDrawer.innerHTML = newDrawer.innerHTML;
      } else {
        cartSection.innerHTML = updatedSection.innerHTML;
      }
    }
  }

  async function syncCartAfterChange(keepDrawerOpen) {
    const drawer = document.querySelector(CART_DRAWER_SELECTOR);
    const shouldKeepOpen = Boolean(keepDrawerOpen) || Boolean(drawer && drawer.hasAttribute("open"));

    await Promise.all([refreshCartDrawerFromSection(), syncCartMeta()]);
    
    const newDrawer = document.querySelector(CART_DRAWER_SELECTOR);
    updateMinusButtonState(newDrawer);

    if (shouldKeepOpen) {
      openCartDrawer();
    }
  }

  async function syncCartMeta() {
    const response = await fetch("/cart.js", { credentials: "same-origin" });
    if (!response.ok) {
      throw new Error("Unable to fetch cart details");
    }

    const cart = await response.json();
    updateCartCounters(cart.item_count || 0);
  }

  let cartUpdateTimer = null;
  const pendingCartUpdates = {};
  let isSyncingCart = false;

  async function performCartUpdate() {
    if (Object.keys(pendingCartUpdates).length === 0) return;

    const updates = {};
    for (const key in pendingCartUpdates) {
      updates[key] = pendingCartUpdates[key];
      delete pendingCartUpdates[key];
    }

    isSyncingCart = true;
    try {
      const response = await fetch("/cart/update.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ updates: updates }),
      });

      if (!response.ok) {
        throw new Error("Cart update failed");
      }

      await syncCartAfterChange(true);
    } catch (error) {
      window.location.reload();
    } finally {
      isSyncingCart = false;
      if (Object.keys(pendingCartUpdates).length > 0) {
        performCartUpdate();
      }
    }
  }

  function queueDrawerLineItemQuantity(input, qty) {
    const key = input.dataset.lineKey;
    if (!key) return;

    input.value = String(qty);
    updateMinusButtonState(input.closest(".cart-button"));

    pendingCartUpdates[key] = qty;

    const lineItem = input.closest("line-item");
    if (lineItem) {
      lineItem.style.opacity = "0.5";
      lineItem.style.pointerEvents = "none";
    }

    if (!isSyncingCart) {
      performCartUpdate();
    }
  }

  async function addDrawerProductToCart(form) {
    const formData = new FormData(form);

    const addResponse = await fetch("/cart/add.js", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      credentials: "same-origin",
      body: formData,
    });

    if (!addResponse.ok) {
      throw new Error("Add to cart failed");
    }

    openCartDrawer();
    await syncCartAfterChange(true);
  }

  document.addEventListener("click", function (event) {
    if (isCartPage()) return;

    const cartDrawer = event.target.closest(CART_DRAWER_SELECTOR);

    if (cartDrawer) {
      const closeButton = event.target.closest('[is="close-button"]');

      if (closeButton) {
        event.preventDefault();
        event.stopPropagation();
        closeCartDrawer();
        return;
      }

      const plus = event.target.closest(".cart-plus");
      const minus = event.target.closest(".cart-mini");
      const removeLink = event.target.closest(
        'a[href*="/cart/change"], a[href*="quantity=0"]',
      );

      if (plus || minus) {
        const wrapper = event.target.closest(".cart-button");
        const input = wrapper && wrapper.querySelector(".quantity-input");

        if (!input) return;

        event.preventDefault();
        event.stopPropagation();

        let qty = parseInt(input.value, 10) || 1;
        const max = input.hasAttribute("max")
          ? parseInt(input.getAttribute("max"), 10)
          : null;

        if (plus && (!max || qty < max)) qty += 1;
        if (minus && qty > 1) qty -= 1;

        if (qty === (parseInt(input.value, 10) || 1)) return;

        queueDrawerLineItemQuantity(input, qty);
        return;
      }

      if (removeLink) {
        const wrapper = removeLink.closest(".line-item");
        const input = wrapper && wrapper.querySelector(".quantity-input");

        if (input) {
          event.preventDefault();
          event.stopPropagation();

          queueDrawerLineItemQuantity(input, 0);
          return;
        }
      }

      const recButton = event.target.closest(
        '.horizontal-product__cta button[type="submit"]',
      );
      if (recButton) {
        event.preventDefault();
        event.stopPropagation();
        const form = recButton.closest("form");
        if (form) {
          addDrawerProductToCart(form).catch(function () {
            if (form.requestSubmit) {
              form.requestSubmit(recButton);
            } else {
              form.submit();
            }
          });
        }
        return;
      }
    }

    const trigger = event.target.closest('[aria-controls="cart-drawer"]');
    const cartLink = event.target.closest(
      'a[href="/cart"], a[href="/cart/"], a[href$="/cart"], a[href*="/cart?"]',
    );

    if (!trigger && !cartLink) return;

    event.preventDefault();
    openCartDrawer();
  });

  document.addEventListener(
    "keydown",
    function (event) {
      if (event.key !== "Escape") return;

      const drawer = document.querySelector(CART_DRAWER_SELECTOR);
      if (!drawer || !drawer.hasAttribute("open")) return;

      event.preventDefault();
      event.stopPropagation();
      closeCartDrawer();
    },
    true,
  );

  // Run in capture phase so quantity is corrected before any theme/app submit handler reads the form.
  document.addEventListener(
    "submit",
    function (event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const formAction = (form.getAttribute("action") || "").toLowerCase();
      const isAddToCartForm =
        formAction.includes("/cart/add") || formAction.endsWith("cart/add");
      if (!isAddToCartForm) return;

      if (
        event.submitter &&
        (event.submitter.name === "checkout" ||
          (event.submitter.formAction &&
            event.submitter.formAction.includes("/checkout")))
      ) {
        return;
      }

      const preferredQty = getPreferredFormQuantity(form, event.submitter || null);
      const qtyString = String(preferredQty);
      lastAtcSubmitQty = qtyString;
      lastAtcSubmitAt = Date.now();

      const inlineQtyField = form.querySelector('[name="quantity"]');
      if (inlineQtyField) {
        inlineQtyField.value = qtyString;
        inlineQtyField.setAttribute("value", qtyString);
      }

      if (form.id) {
        const boundQtyFields = document.querySelectorAll(
          '[name="quantity"][form="' + form.id + '"]',
        );
        boundQtyFields.forEach(function (input) {
          input.value = qtyString;
          input.setAttribute("value", qtyString);
        });
      }

      const legacyAtcQty = form.querySelector("#homeatc") || document.getElementById("homeatc");
      if (legacyAtcQty) {
        legacyAtcQty.value = qtyString;
        legacyAtcQty.setAttribute("value", qtyString);
      }
    },
    true,
  );

  if (!window.__cartAddQtyPayloadPatchApplied) {
    window.__cartAddQtyPayloadPatchApplied = true;
    const nativeFetch = window.fetch.bind(window);

    window.fetch = function (input, init) {
      try {
        const reqUrl = typeof input === "string" ? input : (input && input.url) || "";
        const isCartAdd = /\/cart\/add(?:\.js)?(?:\?|$)/.test(reqUrl);
        const qtyIsFresh = lastAtcSubmitQty !== null && Date.now() - lastAtcSubmitAt < 2500;
        const runtimeQty = getVisibleRuntimeQty();
        const forcedQty =
          runtimeQty !== null ? String(runtimeQty) : qtyIsFresh ? String(lastAtcSubmitQty) : null;

        if (isCartAdd && forcedQty && init && init.body instanceof FormData) {
          const formType = init.body.get("form_type");
          if (formType === "product") {
            init.body.set("quantity", forcedQty);
          }
        } else if (isCartAdd && forcedQty && init && init.body instanceof URLSearchParams) {
          const formType = init.body.get("form_type");
          if (formType === "product") {
            init.body.set("quantity", forcedQty);
          }
        }
      } catch (e) {}

      return nativeFetch(input, init);
    };
  }

  document.addEventListener("submit", async function (event) {
    if (isCartPage()) return;

    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    const formAction = (form.getAttribute("action") || "").toLowerCase();
    const isAddToCartForm =
      formAction.includes("/cart/add") || formAction.endsWith("cart/add");

    if (!isAddToCartForm) return;

    if (
      event.submitter &&
      (event.submitter.name === "checkout" ||
        (event.submitter.formAction &&
          event.submitter.formAction.includes("/checkout")))
    ) {
      return;
    }

    event.preventDefault();

    try {
      const preferredQty = getPreferredFormQuantity(form, event.submitter || null);

      // Force real DOM fields too so any parallel theme/app handlers see the same quantity.
      const inlineQtyField = form.querySelector('[name="quantity"]');
      if (inlineQtyField) inlineQtyField.value = String(preferredQty);
      if (form.id) {
        const boundQtyFields = document.querySelectorAll(
          '[name="quantity"][form="' + form.id + '"]',
        );
        boundQtyFields.forEach(function (input) {
          input.value = String(preferredQty);
          input.setAttribute("value", String(preferredQty));
        });
      }

      const formData = new FormData(form);
      formData.set("quantity", String(preferredQty));

      const addResponse = await fetch("/cart/add.js", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: formData,
      });

      if (!addResponse.ok) {
        throw new Error("Add to cart failed");
      }

      openCartDrawer();
      await syncCartAfterChange(true);
    } catch (error) {
      window.location.href = "/cart";
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      updateMinusButtonState(document.querySelector(CART_DRAWER_SELECTOR));
    });
  } else {
    updateMinusButtonState(document.querySelector(CART_DRAWER_SELECTOR));
  }
})();
