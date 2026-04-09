// Base Drawer class that NavigationDrawer extends
export class Drawer extends HTMLElement {
  constructor() {
    super();
    this._abortController = new AbortController();
  }

  connectedCallback() {
    this.addEventListener('click', this._onBackdropClick.bind(this));
    document.addEventListener('keydown', this._onKeyDown.bind(this), { signal: this._abortController.signal });
    
    // Find trigger buttons
    const triggers = document.querySelectorAll(`[aria-controls="${this.id}"]`);
    triggers.forEach(trigger => {
      trigger.addEventListener('click', this._onTriggerClick.bind(this), { signal: this._abortController.signal });
    });
    
    // Handle close button
    const closeButton = this.querySelector('[is="close-button"]');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide(), { signal: this._abortController.signal });
    }
  }

  disconnectedCallback() {
    this._abortController.abort();
  }

  get openFrom() {
    return this.getAttribute('open-from') || 'left';
  }

  async show() {
    if (this.hasAttribute('open')) return;
    
    this.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('drawer-open');
    this._createOverlay();

    
    // Update aria-expanded on triggers
    this._updateTriggers(true);
    
    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('dialog:before-show', { bubbles: true }));
    
    // Focus management
    this._trapFocus();
    
    this.dispatchEvent(new CustomEvent('dialog:after-show', { bubbles: true }));
  }

  async hide() {
    if (!this.hasAttribute('open')) return;
    document.body.classList.remove('drawer-open');
    
    this.dispatchEvent(new CustomEvent('dialog:before-hide', { bubbles: true }));
    
    this.removeAttribute('open');
    document.body.style.overflow = '';

    this._removeOverlay();

    
    // Update aria-expanded on triggers
    this._updateTriggers(false);
    
    // Return focus to trigger
    const trigger = document.querySelector(`[aria-controls="${this.id}"]`);
    if (trigger) {
      trigger.focus();
    }
    
    this.dispatchEvent(new CustomEvent('dialog:after-hide', { bubbles: true }));
  }

  _onTriggerClick(event) {
    event.preventDefault();
    if (this.hasAttribute('open')) {
      this.hide();
    } else {
      this.show();
    }
  }

  _onBackdropClick(event) {
    if (event.target === this) {
      this.hide();
    }
  }

  _onKeyDown(event) {
    if (event.key === 'Escape' && this.hasAttribute('open')) {
      this.hide();
    }
  }

  _updateTriggers(isOpen) {
    const triggers = document.querySelectorAll(`[aria-controls="${this.id}"]`);
    triggers.forEach(trigger => {
      trigger.setAttribute('aria-expanded', isOpen.toString());
    });
  }

  _trapFocus() {
    const focusableElements = this.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    firstFocusable.focus();

    const trapFocusHandler = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    };

    this.addEventListener('keydown', trapFocusHandler, { signal: this._abortController.signal });
  }

_createOverlay() {
  // Remove existing overlay if any
  this._removeOverlay();
  
  // Create overlay element
  this._overlay = document.createElement('div');
  this._overlay.className = 'drawer-overlay';
  this._overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 350px;
    right: 0;
    height: 100vh;
    background: #0000008c;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.3s ease;
    cursor: pointer;
  `;
  
  // For mobile bottom drawer, cover the top area
  const isMobile = window.matchMedia("(max-width: 699px)").matches;
  const isBottomOpening = this.getAttribute('mobile-opening') === 'bottom';
  
  if (isMobile && isBottomOpening) {
    this._overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 20vh;
      height: 100%;
      background: #0000008c;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.3s ease;
      cursor: pointer;
    `;
  }
  
  // Add overlay to body
  document.body.appendChild(this._overlay);
  
  // Trigger fade in
  requestAnimationFrame(() => {
    this._overlay.style.opacity = '1';
  });
  
  // Click overlay to close
  this._overlay.addEventListener('click', () => {
    this.hide();
  });
}

  _removeOverlay() {
    if (this._overlay) {
      // Fade out overlay
      this._overlay.style.opacity = '0';
      
      // Remove after transition
      setTimeout(() => {
        if (this._overlay && this._overlay.parentNode) {
          this._overlay.parentNode.removeChild(this._overlay);
        }
        this._overlay = null;
      }, 300);
    }
  }
}

// AnimatedDetails class for dropdown functionality
export class AnimatedDetails extends HTMLElement {
  constructor() {
    super();
    this.summaryElement = this.querySelector('summary');
    this.contentElement = this.querySelector('summary ~ *');
    
    if (this.summaryElement) {
      this.summaryElement.addEventListener('click', this._onSummaryClicked.bind(this));
    }
  }

  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    if (value) {
      this._transition(true);
    } else {
      this._transition(false);
    }
  }

  _onSummaryClicked(event) {
    event.preventDefault();
    this.open = !this.open;
  }

  async _transition(value) {
    if (value) {
      this.setAttribute('open', '');
      await this._transitionIn();
    } else {
      await this._transitionOut();
      this.removeAttribute('open');
    }
  }

  _transitionIn() {
    // Override in subclasses
    return Promise.resolve();
  }

  _transitionOut() {
    // Override in subclasses
    return Promise.resolve();
  }
}

// Basic EffectCarousel class
export class EffectCarousel extends HTMLElement {
  constructor() {
    super();
    this._currentIndex = 0;
    this._autoplayTimer = null;
  }

  connectedCallback() {
    this.items = Array.from(this.children);
    this._setupAutoplay();
    this._setupControls();
  }

  get selectedIndex() {
    return this._currentIndex;
  }

  get selectedSlide() {
    return this.items[this._currentIndex];
  }

  next() {
    this.select((this._currentIndex + 1) % this.items.length);
  }

  previous() {
    this.select(this._currentIndex === 0 ? this.items.length - 1 : this._currentIndex - 1);
  }

  select(index) {
    if (index === this._currentIndex) return;
    
    const fromSlide = this.items[this._currentIndex];
    const toSlide = this.items[index];
    
    this._currentIndex = index;
    
    this._transitionTo(fromSlide, toSlide);
    
    this.dispatchEvent(new CustomEvent('carousel:select', {
      detail: { slide: toSlide, index }
    }));
  }

  _transitionTo(fromSlide, toSlide) {
    // Override in subclasses
    fromSlide.classList.remove('is-selected');
    toSlide.classList.add('is-selected');
  }

  _setupAutoplay() {
    if (this.hasAttribute('autoplay')) {
      const delay = parseInt(this.getAttribute('autoplay')) || 5000;
      this._autoplayTimer = setInterval(() => this.next(), delay);
    }
  }

  _setupControls() {
    // Add basic control support
    this.addEventListener('control:prev', () => this.previous());
    this.addEventListener('control:next', () => this.next());
  }
}

// Utility functions
export function throttle(func, delay = 16) {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

export function extractSectionId(section) {
  return section.id.replace('shopify-section-', '');
}

export async function imageLoaded(images) {
  const imageArray = Array.isArray(images) ? images : [images];
  
  return Promise.all(
    imageArray.map(img => {
      if (img.complete) return Promise.resolve();
      
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    })
  );
}

export function getHeadingKeyframe(heading, options = {}) {
  if (!heading) return [];
  
  return [
    heading,
    {
      opacity: [0, 1],
      transform: ['translateY(20px)', 'translateY(0)']
    },
    {
      duration: 0.3,
      ...options
    }
  ];
}

export function createMediaImg(media, widths, attributes = {}) {
  const img = document.createElement('img');
  
  // Basic implementation - you might need to adjust based on your media object structure
  if (media.src) {
    img.src = media.src;
  }
  
  Object.entries(attributes).forEach(([key, value]) => {
    img.setAttribute(key, value);
  });
  
  return img;
}

// ScrollArea utility class
export class ScrollArea extends HTMLElement {
  constructor(element) {
    super();
    this.element = element || this;
    this._setupScrollHandling();
  }

  _setupScrollHandling() {
    this.element.addEventListener('scroll', this._onScroll.bind(this));
  }

  _onScroll() {
    // Basic scroll handling - can be extended
    this.dispatchEvent(new CustomEvent('scroll:change', {
      detail: {
        scrollLeft: this.element.scrollLeft,
        scrollTop: this.element.scrollTop
      }
    }));
  }
}

// QuantitySelector Web Component for existing HTML structure
export class QuantitySelector extends HTMLElement {
  constructor() {
    super();
    this._abortController = new AbortController();
    this._input = null;
    this._decreaseButton = null;
    this._increaseButton = null;
  }

  connectedCallback() {
    this._setupElements();
    this._setupEventListeners();
    this._updateButtonStates();
    this._overrideInlineHandlers();
  }

  disconnectedCallback() {
    this._abortController.abort();
  }

  // Getters for configuration
  get min() {
    return parseInt(this.getAttribute('min')) || parseInt(this._input?.getAttribute('min')) || 1;
  }

  get max() {
    return parseInt(this.getAttribute('max')) || parseInt(this._input?.getAttribute('max')) || 999;
  }

  get step() {
    return parseInt(this.getAttribute('step')) || parseInt(this._input?.getAttribute('step')) || 1;
  }

  get value() {
    return this._input ? parseInt(this._input.value) || this.min : this.min;
  }

  set value(newValue) {
    const clampedValue = Math.max(this.min, Math.min(this.max, parseInt(newValue) || this.min));
    if (this._input) {
      this._input.value = clampedValue;
      this._updateButtonStates();
      this._dispatchChangeEvent();
    }
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
    this._updateDisabledState();
  }

  _setupElements() {
    // Find existing elements in your HTML structure
    this._input = this.querySelector('.quantity-selector__input') || this.querySelector('input[name="quantity"]');
    this._decreaseButton = this.querySelector('.quantity-selector__button:first-of-type');
    this._increaseButton = this.querySelector('.quantity-selector__button:last-of-type');

    // Set up input attributes if not already set
    if (this._input) {
      if (!this._input.hasAttribute('min')) this._input.setAttribute('min', this.min);
      if (!this._input.hasAttribute('max')) this._input.setAttribute('max', this.max);
      if (!this._input.hasAttribute('step')) this._input.setAttribute('step', this.step);
      
      // Ensure initial value is valid
      const initialValue = parseInt(this._input.value) || this.min;
      this._input.value = Math.max(this.min, Math.min(this.max, initialValue));
    }
  }

  _setupEventListeners() {
    const { signal } = this._abortController;

    // Button click events - override the inline onClick handlers
    if (this._decreaseButton) {
      this._decreaseButton.addEventListener('click', this._onDecrease.bind(this), { signal });
    }

    if (this._increaseButton) {
      this._increaseButton.addEventListener('click', this._onIncrease.bind(this), { signal });
    }

    // Input events (even though it's readonly, we still listen for programmatic changes)
    if (this._input) {
      this._input.addEventListener('change', this._onInputChange.bind(this), { signal });
      this._input.addEventListener('keydown', this._onKeyDown.bind(this), { signal });
    }
  }

  _overrideInlineHandlers() {
    // Remove inline onClick handlers and replace with our logic
    if (this._decreaseButton) {
      this._decreaseButton.removeAttribute('onClick');
    }
    if (this._increaseButton) {
      this._increaseButton.removeAttribute('onClick');
    }

    // Override global updateInputValue function if it exists
    if (window.updateInputValue) {
      window.updateInputValue = this._updateInputValue.bind(this);
    } else {
      window.updateInputValue = this._updateInputValue.bind(this);
    }
  }

  _updateInputValue(change) {
    // This replaces the original updateInputValue function
    const newValue = this.value + change;
    this.value = newValue;
  }

  _onDecrease(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.disabled) return;

    const newValue = Math.max(this.min, this.value - this.step);
    this.value = newValue;
  }

  _onIncrease(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.disabled) return;

    const newValue = Math.min(this.max, this.value + this.step);
    this.value = newValue;
  }

  _onInputChange(event) {
    if (this.disabled) return;
    this._validateAndUpdateValue();
  }

  _onKeyDown(event) {
    if (this.disabled) return;

    // Handle arrow keys even on readonly input
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._onIncrease(event);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._onDecrease(event);
    }
  }

  _validateAndUpdateValue() {
    if (!this._input) return;

    let value = parseInt(this._input.value);
    
    if (isNaN(value) || value < this.min) {
      value = this.min;
    } else if (value > this.max) {
      value = this.max;
    }

    this._input.value = value;
    this._updateButtonStates();
    this._dispatchChangeEvent();
  }

  _updateButtonStates() {
    if (!this._decreaseButton || !this._increaseButton) return;

    const currentValue = this.value;
    
    // Update decrease button
    const canDecrease = currentValue > this.min && !this.disabled;
    this._decreaseButton.disabled = !canDecrease;
    this._decreaseButton.setAttribute('aria-disabled', (!canDecrease).toString());
    
    if (canDecrease) {
      this._decreaseButton.classList.remove('disabled');
    } else {
      this._decreaseButton.classList.add('disabled');
    }

    // Update increase button
    const canIncrease = currentValue < this.max && !this.disabled;
    this._increaseButton.disabled = !canIncrease;
    this._increaseButton.setAttribute('aria-disabled', (!canIncrease).toString());
    
    if (canIncrease) {
      this._increaseButton.classList.remove('disabled');
    } else {
      this._increaseButton.classList.add('disabled');
    }
  }

  _updateDisabledState() {
    const isDisabled = this.disabled;

    if (this._input) {
      this._input.disabled = isDisabled;
    }

    this._updateButtonStates();

    if (isDisabled) {
      this.classList.add('disabled');
    } else {
      this.classList.remove('disabled');
    }
  }

  _dispatchChangeEvent() {
    this.dispatchEvent(new CustomEvent('quantity:change', {
      detail: {
        value: this.value,
        element: this,
        input: this._input
      },
      bubbles: true
    }));

    // Trigger a change event on the input for form compatibility
    if (this._input) {
      this._input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  // Public methods
  increase() {
    this._onIncrease({ preventDefault: () => {}, stopPropagation: () => {} });
  }

  decrease() {
    this._onDecrease({ preventDefault: () => {}, stopPropagation: () => {} });
  }

  reset() {
    this.value = this.min;
  }

  // Method to update max based on variant inventory (useful for Shopify)
  updateInventory(inventoryQuantity) {
    const newMax = Math.max(1, parseInt(inventoryQuantity) || 999);
    this.setAttribute('max', newMax);
    this._input.setAttribute('max', newMax);
    
    // If current value exceeds new max, reduce it
    if (this.value > newMax) {
      this.value = newMax;
    }
    
    this._updateButtonStates();
  }

  // Static method to register the custom element
  static register() {
    if (!customElements.get('quantity-selector')) {
      customElements.define('quantity-selector', QuantitySelector);
    }
  }
}

// Auto-register the component
QuantitySelector.register();

// Additional utility for global access (if needed)
window.QuantitySelector = QuantitySelector;