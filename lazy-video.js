
/**
  * `lazy-video`
  * 
  *   Auto lazy-loads when visible on screen.
  *   html5 video wrapper.
  * 
  * 
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  isOnScreen, 
  schedule
}                 from '@longlost/utils/utils.js';
import htmlString from './lazy-video.html';
import '@longlost/app-spinner/app-spinner.js';


class LazyVideo extends AppElement {
  static get is() { return 'lazy-video'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {
      // Placeholder image url. 
      // Optional.
      poster: String, 
      // When set to true, video will 
      // autoplay with no controls, 
      // on mute and loop continuously.
      // Optional.
      presentation: {
        type: Boolean,
        value: false
      },
      // Video source url.
      src: String,
      // The distance in pixels to pad
      // to the carousel trigger threshold.
      // For instance, 0 would mean that the
      // next lazy image would not start to download
      // until a single pixel intersects the edge of
      // the carousel.
      // Or 128 means that the image would start to
      // download 128px before the next image comes
      // into view.
      // Optional.
      trigger: {
        type: Number,
        value: 0
      },
      // Cached IntersectionObserver instance.
      // Used to unobserve and cleanup when not needed.
      _intersectionObserver: Object,
      // Set after element comes into view on screen.
      _lazySrc: String

    };
  }


  static get observers() {
    return [
      '__presentationChanged(presentation)',
      '__srcChanged(src, trigger)'
    ];
  }


  disconnectedCallback() {
    this.__unobserve();
  }


  async __srcChanged(src, trigger) {
    try {
      if (!src) { return; }

      await isOnScreen(this, trigger);
      await this.$.spinner.show();
      this._lazySrc = src;
    }
    catch (error) {
      if (error === 'Element removed.');
      console.error(error);
    }
  }


  __presentationChanged(presentation) {
    if (!presentation) {
      this.__unobserve();
    }
  }


  __autoPlayWhenVisible() {
    let playState = false;
    const video   = this.select('video');

    const options = {
      root:        null, // 'null' sets root to device viewport.
      rootMargin: `${this.trigger}px`,
      threshold:   0.75
    };

    const callback = entries => {
      const {isIntersecting} = entries[0];

      if (isIntersecting) {
        if (playState) { return; }
        playState = true;
        video.play();
      }
      else {
        if (!playState) { return; }
        playState = false;
        video.pause();
      }
    };

    this._intersectionObserver = 
      new window.IntersectionObserver(callback, options);
    this._intersectionObserver.observe(this);
  }


  async __metadataLoaded() {
    this.fire('metadata-loaded', {src: this.src});
    await schedule();
    this.$.spinner.hide();
    if (this.presentation) {
      this.__autoPlayWhenVisible();
    }
  }


  __unobserve() {
    if (this._intersectionObserver) {
      this._intersectionObserver.unobserve(this);
    }
  }

}

window.customElements.define(LazyVideo.is, LazyVideo);
