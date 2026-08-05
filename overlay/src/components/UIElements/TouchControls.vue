<template>
  <div
    id="touchControls"
    v-if="$localData.settings.touchControls"
    :style="cssVars"
  >
    <!-- Always-present toggle handle -->
    <button
      class="tcHandle"
      :class="{ active: padVisible }"
      @click="toggleManual"
      title="Toggle touch controls"
    >
      <svg viewBox="0 0 24 24" width="16" height="16">
        <circle cx="12" cy="12" r="5" class="hFill" />
        <path
          d="M12 2v4M12 18v4M2 12h4M18 12h6"
          class="hStroke"
          stroke-width="2.5"
        />
      </svg>
    </button>

    <!-- Edge navigation arrows (reading aid, optional) -->
    <template v-if="$localData.settings.touchNavArrows && !editMode">
      <button class="tcNav tcNavLeft" @click="navPage('left')">&#9668;</button>
      <button class="tcNav tcNavRight" @click="navPage('right')">
        &#9658;
      </button>
    </template>

    <!-- Game pad: joystick + action buttons -->
    <div v-show="padVisible || editMode" class="tcPad">
      <div
        class="tcJoy"
        ref="joy"
        :style="posStyle('joy')"
        @touchstart.prevent="joyStart"
        @touchmove.prevent="joyMove"
        @touchend.prevent="joyEnd"
        @touchcancel.prevent="joyEnd"
        @mousedown.prevent="joyStart"
      >
        <div class="tcJoyBase">
          <div
            class="tcJoyStick"
            :style="{
              transform: `translate(${stick.x}px, ${stick.y}px)`
            }"
          ></div>
        </div>
        <div v-if="editMode" class="tcEditTag">drag</div>
      </div>

      <div class="tcBtns" ref="btns" :style="posStyle('btns')">
        <button
          v-for="(b, i) in buttons"
          :key="i"
          class="tcBtn"
          :class="{ pressed: pressedBtns[i] }"
          @touchstart.prevent="btnDown(i)"
          @touchend.prevent="btnUp(i)"
          @touchcancel.prevent="btnUp(i)"
          @mousedown.prevent="btnDown(i)"
          @mouseup.prevent="btnUp(i)"
          @mouseleave="pressedBtns[i] && btnUp(i)"
        >
          {{ b.label }}
        </button>
        <div v-if="editMode" class="tcEditTag">drag</div>
      </div>
    </div>

    <!-- Layout edit mode banner -->
    <div v-if="editMode" class="tcEditBar">
      <span>Drag the joystick and buttons where you want them.</span>
      <button @click="endEdit">Done</button>
    </div>
  </div>
</template>

<script>
// On-screen joystick + buttons that dispatch synthetic key events into the
// active flash iframe. Settings live in DEFAULT_SETTINGS (localData.js).

const ARROWS = {
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40
};

export default {
  name: "TouchControls",
  data() {
    return {
      flashPresent: false,
      manualShow: null, // null = follow auto, true/false = user override
      stick: { x: 0, y: 0 },
      joyTouchId: null,
      joyCenter: { x: 0, y: 0 },
      heldArrows: new Set(),
      pressedBtns: {},
      editMode: false,
      dragTarget: null,
      observer: null,
      mouseActive: false
    };
  },
  computed: {
    settings() {
      return this.$localData.settings;
    },
    buttons() {
      return (
        this.settings.touchButtons || [
          { label: "␣", key: " ", code: "Space", keyCode: 32 },
          { label: "↵", key: "Enter", code: "Enter", keyCode: 13 }
        ]
      );
    },
    padVisible() {
      if (this.editMode) return true;
      if (this.manualShow !== null) return this.manualShow;
      return Boolean(this.settings.touchAutoShow && this.flashPresent);
    },
    cssVars() {
      return {
        "--tc-opacity": this.settings.touchOpacity != null
          ? this.settings.touchOpacity
          : 0.4,
        "--tc-scale": this.settings.touchScale || 1
      };
    },
    activeTabUrl() {
      return this.$localData.tabData.tabs[
        this.$localData.tabData.activeTabKey
      ].url;
    }
  },
  watch: {
    "$localData.temp.touchEdit"(to) {
      if (to) {
        this.editMode = true;
        this.$localData.temp.touchEdit = false;
      }
    },
    activeTabUrl() {
      // navigation clears the manual override
      this.manualShow = null;
      this.releaseAll();
      this.scheduleFlashCheck();
    }
  },
  mounted() {
    this.scheduleFlashCheck();
    // catch embeds that appear late (spoiler reveals etc)
    this.observer = new MutationObserver(() => this.scheduleFlashCheck());
    this.observer.observe(document.getElementById("app") || document.body, {
      childList: true,
      subtree: true
    });
    window.addEventListener("mousemove", this.winMouseMove);
    window.addEventListener("mouseup", this.winMouseUp);
    window.addEventListener("touchstart", this.swipeStart, { passive: true });
    window.addEventListener("touchend", this.swipeEnd, { passive: true });
  },
  beforeDestroy() {
    if (this.observer) this.observer.disconnect();
    window.removeEventListener("mousemove", this.winMouseMove);
    window.removeEventListener("mouseup", this.winMouseUp);
    window.removeEventListener("touchstart", this.swipeStart);
    window.removeEventListener("touchend", this.swipeEnd);
    this.releaseAll();
  },
  methods: {
    // ---------- visibility ----------
    scheduleFlashCheck() {
      if (this._checkTimer) clearTimeout(this._checkTimer);
      this._checkTimer = setTimeout(() => {
        const present = Boolean(this.findFlashIframe() || this.findGameDiv());
        if (present !== this.flashPresent) this.flashPresent = present;
      }, 250);
    },
    findFlashIframe() {
      return document.querySelector("#app iframe.mediaembed");
    },
    findGameDiv() {
      // JS walkarounds (Sburb engine) render into #SBURBgameDiv and listen
      // for keys directly on that element.
      return document.getElementById("SBURBgameDiv");
    },
    toggleManual() {
      this.haptic();
      if (this.manualShow === null) this.manualShow = !this.padVisible;
      else this.manualShow = !this.manualShow;
    },
    // ---------- key dispatch ----------
    keyTarget() {
      const iframe = this.findFlashIframe();
      if (iframe && iframe.contentDocument) {
        const doc = iframe.contentDocument;
        return (
          doc.querySelector("ruffle-player, ruffle-embed, ruffle-object") ||
          doc.querySelector("object, embed") ||
          doc
        );
      }
      // JS walkarounds listen on their own game div
      const gameDiv = this.findGameDiv();
      if (gameDiv) return gameDiv;
      // Fallback: main document (global listeners)
      return document;
    },
    sendKey(b, down) {
      const target = this.keyTarget();
      const ev = new KeyboardEvent(down ? "keydown" : "keyup", {
        key: b.key,
        code: b.code,
        bubbles: true,
        cancelable: true,
        composed: true
      });
      // Legacy games (Sburb etc.) read keyCode/which
      Object.defineProperty(ev, "keyCode", { get: () => b.keyCode });
      Object.defineProperty(ev, "which", { get: () => b.keyCode });
      try {
        if (target.focus && down) target.focus({ preventScroll: true });
      } catch (e) {
        /* focus is best-effort */
      }
      target.dispatchEvent(ev);
    },
    sendArrow(key, down) {
      this.sendKey({ key, code: key, keyCode: ARROWS[key] }, down);
    },
    releaseAll() {
      for (const key of this.heldArrows) this.sendArrow(key, false);
      this.heldArrows.clear();
      this.stick = { x: 0, y: 0 };
      this.joyTouchId = null;
      Object.keys(this.pressedBtns).forEach(i => this.btnUp(Number(i)));
    },
    haptic() {
      if (this.settings.touchHaptics !== false && navigator.vibrate) {
        try {
          navigator.vibrate(8);
        } catch (e) {
          /* unsupported */
        }
      }
    },
    // ---------- joystick ----------
    joyPoint(e) {
      if (e.changedTouches) {
        for (const t of e.changedTouches) {
          if (this.joyTouchId === null || t.identifier === this.joyTouchId) {
            return t;
          }
        }
        return null;
      }
      return e; // mouse
    },
    joyStart(e) {
      if (this.editMode) return this.dragStart(e, "joy");
      const p = this.joyPoint(e);
      if (!p) return;
      if (e.changedTouches) this.joyTouchId = p.identifier;
      else this.mouseActive = true;
      const base = this.$refs.joy.querySelector(".tcJoyBase");
      const r = base.getBoundingClientRect();
      this.joyCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      this.haptic();
      this.joyTrack(p);
    },
    joyMove(e) {
      if (this.editMode) return this.dragMove(e);
      const p = this.joyPoint(e);
      if (p) this.joyTrack(p);
    },
    joyEnd(e) {
      if (this.editMode) return this.dragEnd();
      if (e.changedTouches) {
        const p = this.joyPoint(e);
        if (!p) return;
        this.joyTouchId = null;
      } else {
        this.mouseActive = false;
      }
      this.stick = { x: 0, y: 0 };
      this.updateArrows(new Set());
    },
    joyTrack(p) {
      const maxR = 40 * (this.settings.touchScale || 1);
      let dx = p.clientX - this.joyCenter.x;
      let dy = p.clientY - this.joyCenter.y;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
      }
      this.stick = { x: dx, y: dy };

      const next = new Set();
      if (dist > maxR * 0.35) {
        // 8-way with 67.5-degree sectors per axis
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180
        if (angle > -157.5 && angle < -22.5) next.add("ArrowUp");
        if (angle > 22.5 && angle < 157.5) next.add("ArrowDown");
        if (Math.abs(angle) > 112.5) next.add("ArrowLeft");
        if (Math.abs(angle) < 67.5) next.add("ArrowRight");
      }
      this.updateArrows(next);
    },
    updateArrows(next) {
      for (const key of this.heldArrows) {
        if (!next.has(key)) this.sendArrow(key, false);
      }
      for (const key of next) {
        if (!this.heldArrows.has(key)) {
          this.sendArrow(key, true);
          this.haptic();
        }
      }
      this.heldArrows = next;
    },
    // ---------- action buttons ----------
    btnDown(i) {
      if (this.editMode) return;
      this.$set(this.pressedBtns, i, true);
      this.haptic();
      this.sendKey(this.buttons[i], true);
    },
    btnUp(i) {
      if (this.editMode) return;
      if (!this.pressedBtns[i]) return;
      this.$set(this.pressedBtns, i, false);
      this.sendKey(this.buttons[i], false);
    },
    // ---------- swipe navigation ----------
    swipeStart(e) {
      if (!this.settings.touchSwipeNav || this.editMode) return;
      if (e.target.closest && e.target.closest("#touchControls")) return;
      const t = e.changedTouches[0];
      this._swipe = { x: t.clientX, y: t.clientY, at: Date.now() };
    },
    swipeEnd(e) {
      if (!this._swipe || !this.settings.touchSwipeNav) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - this._swipe.x;
      const dy = t.clientY - this._swipe.y;
      const dt = Date.now() - this._swipe.at;
      this._swipe = null;
      // fast, long, mostly-horizontal flick only
      if (dt < 600 && Math.abs(dx) > 70 && Math.abs(dx) > 2.5 * Math.abs(dy)) {
        this.navPage(dx > 0 ? "left" : "right");
      }
    },
    // ---------- page navigation ----------
    navPage(dir) {
      this.haptic();
      const app = this.$parent;
      const tf = app.activeTabComponent;
      if (tf && tf.$refs.page && tf.$refs.page.keyNavEvent) {
        tf.$refs.page.keyNavEvent(dir);
      }
    },
    // ---------- layout editing ----------
    posStyle(which) {
      const layout = this.settings.touchLayout || {};
      const pos =
        layout[which] ||
        (which === "joy" ? { x: 4, y: 78 } : { x: 82, y: 80 });
      return { left: pos.x + "%", top: pos.y + "%" };
    },
    startEdit() {
      this.editMode = true;
    },
    endEdit() {
      this.editMode = false;
      this.dragTarget = null;
    },
    dragStart(e, which) {
      this.dragTarget = which;
    },
    dragMove(e) {
      if (!this.dragTarget) return;
      const p = e.changedTouches ? e.changedTouches[0] : e;
      this.applyDrag(p);
    },
    applyDrag(p) {
      const x = Math.min(92, Math.max(0, (p.clientX / window.innerWidth) * 100 - 6));
      const y = Math.min(92, Math.max(0, (p.clientY / window.innerHeight) * 100 - 6));
      const layout = {
        ...(this.settings.touchLayout || {}),
        [this.dragTarget]: { x: Math.round(x), y: Math.round(y) }
      };
      this.$set(this.settings, "touchLayout", layout);
      this.$localData.VM.saveLocalStorage();
    },
    dragEnd() {
      this.dragTarget = null;
    },
    winMouseMove(e) {
      if (this.editMode && this.dragTarget) this.applyDrag(e);
      else if (this.mouseActive) this.joyTrack(e);
    },
    winMouseUp(e) {
      if (this.editMode) this.dragEnd();
      else if (this.mouseActive) this.joyEnd(e);
    }
  }
};
</script>

<style scoped lang="scss">
#touchControls {
  position: fixed;
  inset: 0;
  z-index: 20000;
  pointer-events: none;
  font-family: Verdana, Geneva, sans-serif;
}

%tc-interactive {
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: none;
}

.tcHandle {
  @extend %tc-interactive;
  position: fixed;
  right: 2px;
  top: 40%;
  width: 30px;
  height: 30px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.55);
  background: rgba(255, 255, 255, 0.55);
  opacity: calc(var(--tc-opacity) * 0.75);

  .hFill {
    fill: rgba(0, 0, 0, 0.65);
  }
  .hStroke {
    stroke: rgba(0, 0, 0, 0.65);
    fill: none;
  }
  &.active {
    background: rgba(120, 220, 120, 0.6);
  }
}

.tcNav {
  @extend %tc-interactive;
  position: fixed;
  top: 45%;
  width: 34px;
  height: 64px;
  border: 1px solid rgba(0, 0, 0, 0.4);
  background: rgba(255, 255, 255, 0.35);
  color: rgba(0, 0, 0, 0.7);
  font-size: 16px;
  opacity: var(--tc-opacity);
  border-radius: 8px;

  &.tcNavLeft {
    left: 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  &.tcNavRight {
    right: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
}

.tcPad {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.tcJoy,
.tcBtns {
  @extend %tc-interactive;
  position: fixed;
  opacity: var(--tc-opacity);
  transform: scale(var(--tc-scale));
  transform-origin: bottom left;
}

.tcJoyBase {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.55);
  background: rgba(255, 255, 255, 0.25);
  position: relative;
}

.tcJoyStick {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 48px;
  height: 48px;
  margin: -24px 0 0 -24px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.65);
  background: rgba(255, 255, 255, 0.7);
}

.tcBtns {
  display: flex;
  flex-direction: column;
  gap: 12px;
  transform-origin: bottom right;
}

.tcBtn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.6);
  background: rgba(255, 255, 255, 0.55);
  color: rgba(0, 0, 0, 0.8);
  font-size: 20px;
  font-weight: bold;

  &.pressed {
    background: rgba(120, 220, 120, 0.75);
  }
}

.tcEditTag {
  text-align: center;
  font-size: 11px;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  margin-top: 4px;
  padding: 1px 4px;
}

.tcEditBar {
  @extend %tc-interactive;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 13px;

  button {
    padding: 4px 14px;
  }
}
</style>
