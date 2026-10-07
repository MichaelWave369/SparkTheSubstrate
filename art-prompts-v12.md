# v0.12 duel fighter art

Generated with the built-in image generation tool. References inspected before generation: `public/spark-poster-v1.png`, `public/enemies-v4.webp`, and `public/sprites.webp`.

Asset: `public/duel-fighters-v12.webp`, **1254 × 1254**, lossless RGBA WebP. The file contains three columns and three rows of **418 × 418** cells. Order is Spark, Human, Animal / Tree, Rock, Computer / Collector, Archon, Cantor. All faces point right; the consuming view can mirror for player two. No character silhouette crosses a cell boundary. Very faint glow fringes reach two vertical seams (only four seam pixels above alpha 32, none above alpha 100); these do not include a limb or weapon.

Suggested local feet anchors within each 418px cell: Spark 383, Human 383, Animal 381, Tree 366, Rock 364, Computer 362, Collector 346, Archon 345, Cantor 339. Align these to the arena floor rather than the cell's bottom, so the grounded silhouettes have a shared floor line.

Format conversion preserved all generated pixels and transparency. No raster editing was performed.

## Generation prompt

Use case: style-transfer / stylized-concept.
Asset type: transparent game sprite atlas for Spark: The Substrate — Descent, a side-view round fighter.
Adapt the characters in the three inspected reference images into ONE production-ready square 3×3 fighter sheet. Reference 1 is the poster: use its gold flame, cloaked human, wolf, root tree, cracked basalt rock, cyan polyhedron silhouettes. Reference 2 is the enemy sheet: use existing spectral Collector character, armored winged Archon, and bronze/ivory Cantor bell guardian. Reference 3 is the vessel sprite sheet: preserve recognizable vessel materials and palette. Derive the art; do not reproduce poster text/background or the old top-down poses.

Composition: exactly NINE full-body figures, one per equal square cell, strict clean 3 columns × 3 rows, no extra figures. Square overall image. Every figure in side-view facing RIGHT, including the wolf's muzzle and humanoid heads. Each figure centered within its cell; feet/base aligned at 88% of its cell height; head/canopy/ring inside the top 12%; widest appendages inside central 80%. Clear TRANSPARENT gutters at least 8% of each cell on every side. No object crosses a cell boundary. No grid lines, frames, labels, text, floors, environment, cast shadow outside its cell, or floating unrelated effects. All figures equally readable at small gameplay scale.

ORDER exactly, reading left to right:
ROW 1: Spark — a modest dark hooded cloth figure whose extended cupped hand holds a bright golden flame; body of cloth with visible lower hem and two feet, gold-flame silhouette clearly visible, no orb avatar. Human — poster-like ivory hood, dark teal/gold layered light armor, two human arms and legs, holding a short cyan lumen blade forward. Animal — entire gray-black wolf in profile, four paws, gold-lit brow, muzzle facing right, tail trailing left.
ROW 2: Tree — an upright walking root-lit tree, distinct root legs, gnarled arms, broad teal leaf canopy and gold/teal heart light, branch gesture toward right. Rock — a heavy cracked black basalt walking boulder with two massive arms and two block-like legs, gold-lit fissures, face angled right. Computer — cyan luminous faceted polyhedron with bronze supports, two articulated mechanical legs and arm-like supports, central faceted cyan body fully visible, facing right.
ROW 3: Collector — the existing spectral dark teal scavenger with a forward hunch, hood-like upper silhouette, long lunging claw arms, tapering limb legs and recognizable curling teal spectral forms, facing right, a complete grounded silhouette. Archon — existing gold/bronze armored sentinel with angular folded luminous amber wing plates; upright articulated body and clear legs; one forward hand aimed to cast a cyan bolt. Cantor — existing ivory-and-bronze bell-armored guardian, with a large open bronze wind-up ring behind its upper shoulders, bell-like armored body, two clear articulated legs, one outstretched armored arm; entirely side-view, facing right.

Style: original painterly game art with crisp silhouette boundaries, teal, cyan, tarnished gold, charcoal, ivory. Match the existing game's poster rather than any other franchise. Slight rim light and readable material highlights. Actual transparent alpha background. No blood, gore, weapons from other games, names or move text, logos, watermark, or new lore.

## Targeted correction prompt

Edit only figure scale and positioning on this transparent fighter atlas; preserve every character's appearance, palette, pose, facing direction, and the exact nine-character order. The current oversized Tree canopy and Archon cyan hand effect overlap cell boundaries. Fix this for safe runtime sprite cropping.

Return one square image with a STRICT regular 3 columns × 3 rows. Treat every cell as the same size. Shrink EVERY full figure to occupy at most the central 74% of its cell horizontally and vertically, leaving truly TRANSPARENT padding on all four sides. Do not enlarge heads/effects or add content to use that padding. Every part of every figure, every cloak tail, branch, wing, claw, flame, cyan effect, and ring must remain inside its own cell, at least 12% of the cell width away from the four cell edges. Center each whole figure in its cell. Align feet/bases at 86% of cell height. No overlaps or pixels crossing cell boundaries. No grid lines/background/text. Exact order remains Spark, Human, Animal / Tree, Rock, Computer / Collector, Archon, Cantor. Preserve actual transparent alpha.
