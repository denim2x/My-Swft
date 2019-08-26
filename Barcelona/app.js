'use strict';

const _Rect = Object.keys(DOMRect.prototype).concat('left', 'top');
const _rects = new WeakMap;
const _indices = new WeakMap;
const _meta = new WeakMap;
$.fn.rect = function() {
  if (this.length == 0)
    return;

  let self = this[0];
  if (!_rects.has(self)) {
    let rect = self.getBoundingClientRect();
    let val = {};
    _Rect.forEach(function (key) {
      val[key] = rect[key];
    });
    val.top += scrollY;
    _rects.set(self, val);
  }
  return _rects.get(self);
};
$.fn.index = function (val) {
  if (this.length == 0)
    return this;

  if (arguments.length == 0)
    return _indices.get(this[0]);

  return this.each(function() {
    _indices.set(this, val);
  });
};
$.fn.iter = function (cb) {
  let len = this.length;
  for (let i = 0; i < len; ++i) {
    cb(this.eq(i), i, this);
  }
  return this;
};
$.fn.meta = function (key, val) {
  if (this.length == 0)
    return this;

  let self = this[0];
  if (!_meta.has(self)) {
    _meta.set(self, new Map);
  }

  let meta = _meta.get(self);
  if (arguments.length < 2)
    return meta.get(key);

  meta.set(key, val);
  return this;
};
$.fn.hasMeta = function (key) {
  if (this.length == 0)
    return false;

  let self = this[0];
  if (!_meta.has(self))
    return false;

  let meta = _meta.get(self);
  return meta.has(key);
};
$.fn.key = function () {
  let val = this.attr('data-key');
  return val ? '_' + val : '';
};

const _boxKeys = ['top', 'right', 'bottom', 'left'];
const _BoxKeys = Sentence(_boxKeys);

const _cornerKeys = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];
const _CornerKeys = Sentence(_cornerKeys);

const _marginKeys = spread('margin', _BoxKeys);
const _borderRadiusKeys = spread('border', _CornerKeys, 'Radius');

$.fn._css = $.fn.css;
$.fn.css = function (key, val) {
  if (arguments.length > 1)
    return this._css(key, val);

  if (this.length == 0)
    return;

  switch (Key(key)) {
  case 'margin':
    return this.pass('_css', _marginKeys).join(' ');

  case 'borderRadius':
    return this.pass('_css', _borderRadiusKeys).join(' ');
  }

  return this._css(key);
};

$.fn.pass = function (key, args) {
  return args.map(function (arg) { return this[key](arg) }, this);
};

function Sentence(self) {
  if (Array.isArray(self))
    return self.map(Sentence);

  if (typeof self === 'string')
    return self[0].toUpperCase() + self.slice(1);

  return self;
}

function spread(prefix, self, suffix) {
  let a = prefix || '';
  let c = suffix || '';
  if (Array.isArray(self))
    return self.map(function (b) { return a + b + c });

  return self;
}

function Key(self) {
  if (typeof self !== 'string')
    return self;

  let temp = self.trim().split(/-/g);
  if (temp.length == 0)
    return self;

  return temp[0] + Sentence(temp.slice(1)).join('');
}

const shade_attr = { 'class': 'u-sidebar u-shade' };
const root = $('.Root');
let sidebars;

setTimeout(function() {
  $('.u-sidebar.u-shaded').iter(function (self) {
    self.addClass(self.key());
    let shade = $('<img>', shade_attr).prependTo(root);
    shade.css({
      height: self.innerHeight() + 'px',
      width: self.innerWidth() + 'px'
    });
    shade.addClass(self.key());
  });

  sidebars = $('.u-sidebar').iter(update_fixed);

  // Can't use '.on()' here (passive listener)
  addEventListener('scroll', function (e) {
    sidebars.iter(update_fixed);
  }, { passive: true });
}, 400);

function update_fixed(sidebar) {
  sidebar.toggleClass('is-fixed', sidebar.rect().top < scrollY);
}

$('.u-slide').iter(function (slide) {
  let frame = slide.find('.u-handle.is-active + .u-frame');
  frame.addClass('is-visible');
  slide.find('.u-handle').iter(function (handle, i) {
    slide.meta(i, handle.index(i).on('click', function (e) {
      activate(handle, slide);
    }));
    handle.meta('frame', handle.next('.u-frame'));
  });
});
$('.u-slide > .u-nav > .u-button').iter(function (btn) {
  let slide = btn.closest('.u-slide');
  btn.on('click', function (e) {
    let handle = slide.find('.u-handle.is-active');
    if (handle) {
      let is_back = btn.hasClass('u-back');
      let is_next = btn.hasClass('u-next');
      let index = handle.index();
      if (is_back && index > 0) {
        activate(slide.meta(index - 1), slide);
      } else if (is_next && slide.hasMeta(index + 1)) {
        activate(slide.meta(index + 1), slide);
      }
    }
  });
});

function activate(handle, slide) {
  if (handle == null || handle.hasClass('is-active')) return;
  let _handle = slide.find('.u-handle.is-active');
  let _frame = _handle.meta('frame');
  _frame.one('transitionend', _frame, frameDeactivated);
  _handle.removeClass('is-active');

  handle.addClass('is-active');
  handle.meta('frame').addClass('is-visible');
}

function frameDeactivated(e) {
  e.data.removeClass('is-visible');
}



