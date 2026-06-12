# Minkyo Kim — Portfolio

A static, single-page portfolio built with **HTML, CSS and vanilla JavaScript**, animated with **GSAP 3.13** (loaded from CDN — no build step required).

## Run it

Any static server works. For example:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly also works in most browsers, but a local server is recommended.

## Structure

```
index.html      — all sections (hero, about, activities, photojournalism, rowing, contact)
css/style.css   — academic-navy theme, serif typography, responsive layout
js/main.js      — all GSAP animation and interaction logic
assets/         — placeholder résumé PDF (replace with the real one)
```

## Interactions

| Section | Interaction |
|---|---|
| Whole page | Heavy, momentum-based scrolling via **ScrollSmoother** — gradually eases to a stop |
| K-Environmentalism | 4 image cards on an infinite **conveyor belt moving right**; slows on hover, speeds up with scroll velocity |
| Photojournalism | 5 cards on a **3D ring** — neighbours peek in from the sides; drag to rotate on desktop, swipe on mobile |
| Rowing | **Drag the boat** along the waterway (mouse, touch, or arrow keys); 5 story cards fade in/out as the boat passes |
| Contact | Demo form + résumé download |

`prefers-reduced-motion` is respected: smoothing and looping animations are disabled.

## Replacing placeholder images

Every image card uses a styled placeholder (`<div class="img-ph">…</div>`). Swap it for a real photo:

```html
<figure class="img-card tone-1">
  <img src="assets/photos/busan.jpg" alt="Beach clean-up in Busan" />
  <figcaption>Beach clean-up — Busan</figcaption>
</figure>
```

Likewise replace the hero monogram with `<img src="assets/profile.jpg" alt="Minkyo Kim">` inside `.portrait`, and overwrite `assets/Minkyo_Kim_Resume.pdf` with the real résumé.
