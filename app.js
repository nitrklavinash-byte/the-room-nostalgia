const scenes = [...document.querySelectorAll('.scene')];
const dots = [...document.querySelectorAll('.dot')];
const experience = document.querySelector('#experience');
const memory = document.querySelector('#memory');
const memoryText = document.querySelector('#memory-text');
const foundEl = document.querySelector('#found');
const finale = document.querySelector('[data-scene="finale"]');

let current = 'room';
let touchStartX = null;
let transitionLock = false;

const found = new Set(
  JSON.parse(localStorage.getItem('room-found') || '[]')
);

/* =========================================================
   CINEMATIC TRANSITION LAYER
   No external library. No additional hosting cost.
   ========================================================= */

(function createTransitionLayer(){

  const style = document.createElement('style');

  style.textContent = `
    #cinematic-transition {
      position: fixed;
      inset: 0;
      z-index: 99999;
      pointer-events: none;
      background:
        radial-gradient(
          ellipse at center,
          rgba(24,24,20,.12) 0%,
          rgba(0,0,0,.72) 72%,
          rgba(0,0,0,.94) 100%
        );
      opacity: 0;
      visibility: hidden;
      transition:
        opacity .42s cubic-bezier(.65,0,.35,1),
        visibility 0s linear .42s;
    }

    #cinematic-transition.active {
      opacity: 1;
      visibility: visible;
      transition:
        opacity .42s cubic-bezier(.65,0,.35,1),
        visibility 0s linear 0s;
    }

    #cinematic-transition::after {
      content: "";
      position: absolute;
      inset: 0;
      background:
        repeating-linear-gradient(
          0deg,
          rgba(255,255,255,.018) 0px,
          rgba(255,255,255,.018) 1px,
          transparent 1px,
          transparent 4px
        );
      opacity: .18;
      mix-blend-mode: soft-light;
    }

    @media (prefers-reduced-motion: reduce) {
      #cinematic-transition {
        transition: none !important;
      }
    }
  `;

  document.head.appendChild(style);

  const layer = document.createElement('div');
  layer.id = 'cinematic-transition';
  layer.setAttribute('aria-hidden', 'true');

  document.body.appendChild(layer);

})();

const transitionLayer = document.querySelector('#cinematic-transition');


/* =========================================================
   MEMORY / PROGRESS
   ========================================================= */

function updateFound(){

  foundEl.textContent = found.size;

  experience.classList.toggle(
    'complete',
    found.size === 9
  );

  if(found.size === 9){
    document.querySelector('.progress').textContent =
      '09 / 09 REMEMBERED';
  }
}

updateFound();


/* =========================================================
   SCENE ROUTING
   ========================================================= */

const nextScene = name => ({
  room: 'balcony',
  balcony: 'cricket',
  cricket: 'room'
}[name] || 'room');

const prevScene = name => ({
  room: 'cricket',
  balcony: 'room',
  cricket: 'balcony'
}[name] || 'room');


/* =========================================================
   SCENE CHANGE
   ========================================================= */

async function go(name){

  if(name === 'finale' && found.size < 9) return;

  if(name === current) return;

  if(transitionLock) return;

  transitionLock = true;

  const reducedMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;


  /* -------------------------------------------------------
     Reduced-motion users get an immediate transition.
     ------------------------------------------------------- */

  if(reducedMotion){

    scenes.forEach(s =>
      s.classList.toggle(
        'active',
        s.dataset.scene === name
      )
    );

    dots.forEach(d =>
      d.classList.toggle(
        'active',
        d.dataset.go === name
      )
    );

    current = name;
    experience.dataset.scene = name;

    transitionLock = false;

    return;
  }


  /* -------------------------------------------------------
     Cinematic dissolve
     ------------------------------------------------------- */

  transitionLayer.classList.add('active');


  /* Let the darkness arrive before changing scene. */

  await new Promise(resolve =>
    setTimeout(resolve, 360)
  );


  scenes.forEach(s =>
    s.classList.toggle(
      'active',
      s.dataset.scene === name
    )
  );

  dots.forEach(d =>
    d.classList.toggle(
      'active',
      d.dataset.go === name
    )
  );

  current = name;
  experience.dataset.scene = name;


  /* -------------------------------------------------------
     Hold the darkness very briefly, then reveal.
     ------------------------------------------------------- */

  await new Promise(resolve =>
    setTimeout(resolve, 180)
  );

  transitionLayer.classList.remove('active');


  /* Allow another navigation after transition completes. */

  setTimeout(() => {
    transitionLock = false;
  }, 450);
}


/* =========================================================
   NEXT BUTTONS
   ========================================================= */

document
  .querySelectorAll('[data-next]')
  .forEach(btn => {

    btn.addEventListener('click', () => {

      if(
        btn.dataset.next === 'finale' &&
        found.size < 9
      ) return;

      go(btn.dataset.next);

    });

  });


/* =========================================================
   NAVIGATION DOTS
   ========================================================= */

dots.forEach(d => {

  d.addEventListener('click', () => {

    go(d.dataset.go);

  });

});


/* =========================================================
   DISCOVERIES
   ========================================================= */

/*
   Discoveries remain text-only.
   This keeps the experience atmospheric
   without increasing hosting requirements.
*/

document
  .querySelectorAll('.hotspot')
  .forEach((spot, i) => {

    const id = `memory-${i + 1}`;

    spot.dataset.id = id;

    spot.addEventListener('click', () => {

      found.add(id);

      localStorage.setItem(
        'room-found',
        JSON.stringify([...found])
      );

      updateFound();

      memoryText.textContent =
        spot.dataset.memory;

      memory.classList.add('open');

      memory.setAttribute(
        'aria-hidden',
        'false'
      );

      if(found.size === 9){

        const label =
          document.querySelector('.object-label');

        if(label){

          label.textContent =
            'ALL 9 MEMORIES FOUND · THE LAST LIGHT IS OPEN';

        }

      }

    });

  });


/* =========================================================
   MEMORY MODAL
   ========================================================= */

function closeMemory(){

  memory.classList.remove('open');

  memory.setAttribute(
    'aria-hidden',
    'true'
  );

}

document
  .querySelector('#close-memory')
  .addEventListener(
    'click',
    closeMemory
  );

memory.addEventListener(
  'click',
  e => {

    if(e.target === memory){
      closeMemory();
    }

  }
);


/* =========================================================
   KEYBOARD NAVIGATION
   ========================================================= */

document.addEventListener(
  'keydown',
  e => {

    if(e.key === 'Escape'){
      closeMemory();
    }

    if(memory.classList.contains('open')){
      return;
    }

    if(e.key === 'ArrowRight'){

      go(
        current === 'finale'
          ? 'room'
          : nextScene(current)
      );

    }

    if(e.key === 'ArrowLeft'){

      go(
        current === 'finale'
          ? 'cricket'
          : prevScene(current)
      );

    }

    if(
      e.key.toLowerCase() === 'r' &&
      found.size === 9
    ){

      go('finale');

    }

  }
);


/* =========================================================
   MOBILE SWIPE
   ========================================================= */

experience.addEventListener(
  'touchstart',
  e => {

    touchStartX =
      e.changedTouches[0].clientX;

  },
  { passive: true }
);


experience.addEventListener(
  'touchend',
  e => {

    if(
      touchStartX === null ||
      memory.classList.contains('open')
    ){
      return;
    }

    const dx =
      e.changedTouches[0].clientX -
      touchStartX;

    touchStartX = null;

    if(Math.abs(dx) < 55){
      return;
    }

    if(dx < 0){

      go(
        current === 'finale'
          ? 'room'
          : nextScene(current)
      );

    }
    else{

      go(
        current === 'finale'
          ? 'cricket'
          : prevScene(current)
      );

    }

  },
  { passive: true }
);


/* =========================================================
   POINTER PROXIMITY
   ========================================================= */

experience.addEventListener(
  'pointermove',
  e => {

    if(
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
    ){
      return;
    }

    document
      .querySelectorAll('.hotspot')
      .forEach(spot => {

        if(
          !spot.closest('.scene.active')
        ){
          return;
        }

        const r =
          spot.getBoundingClientRect();

        const dx =
          e.clientX -
          (r.left + r.width / 2);

        const dy =
          e.clientY -
          (r.top + r.height / 2);

        const d =
          Math.hypot(dx, dy);

        const near =
          Math.max(
            0,
            1 - d / 260
          );

        spot.style.setProperty(
          '--near',
          near.toFixed(2)
        );

      });

  }
);


/* =========================================================
   LIGHTWEIGHT BROWSER-GENERATED AMBIENCE
   ========================================================= */

let ctx;
let master;
let noise;
let playing = false;

const sound =
  document.querySelector('#sound');

function toggleSound(){

  if(!ctx){

    ctx =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

    master =
      ctx.createGain();

    master.gain.value = 0;

    master.connect(
      ctx.destination
    );

    const buffer =
      ctx.createBuffer(
        1,
        ctx.sampleRate * 2,
        ctx.sampleRate
      );

    const data =
      buffer.getChannelData(0);

    for(
      let i = 0;
      i < data.length;
      i++
    ){

      data[i] =
        (Math.random() * 2 - 1) * .14;

    }

    noise =
      ctx.createBufferSource();

    noise.buffer = buffer;
    noise.loop = true;

    const filter =
      ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = 900;

    const g =
      ctx.createGain();

    g.gain.value = .24;

    noise
      .connect(filter)
      .connect(g)
      .connect(master);

    noise.start();

  }


  if(playing){

    master.gain.linearRampToValueAtTime(
      0,
      ctx.currentTime + .35
    );

    sound.textContent =
      'SOUND · OFF';

  }
  else{

    ctx.resume();

    master.gain.linearRampToValueAtTime(
      .09,
      ctx.currentTime + .8
    );

    sound.textContent =
      'SOUND · ON';

  }

  playing = !playing;

}


/* =========================================================
   SOUND BUTTON
   ========================================================= */

sound.addEventListener(
  'click',
  toggleSound
);


/* =========================================================
   IMAGE PRELOADER
   ========================================================= */

(function(){

  const preload =
    document.getElementById('preload');

  const bar =
    document.getElementById('preloadBar');

  if(!preload || !bar){
    return;
  }

  const urls =
    [
      ...document.querySelectorAll(
        '.scene-img'
      )
    ].map(i => i.src);

  let loaded = 0;

  const finish = () => {

    loaded++;

    bar.style.width =
      Math.round(
        (loaded / urls.length) * 100
      ) + '%';

    if(loaded >= urls.length){

      setTimeout(
        () =>
          preload.classList.add('done'),
        350
      );

    }

  };

  urls.forEach(url => {

    const img =
      new Image();

    img.onload = finish;
    img.onerror = finish;
    img.src = url;

  });

})();


/* =========================================================
   DIALOG / ESCAPE BEHAVIOUR
   ========================================================= */

document.addEventListener(
  'keydown',
  e => {

    if(e.key === 'Escape'){

      document
        .querySelectorAll(
          'dialog[open]'
        )
        .forEach(d => d.close());

    }

  }
);
