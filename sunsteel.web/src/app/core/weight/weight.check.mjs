// Quick check of the weight formulas against the specification's worked example and a few
// hand calculations. Run: npx esbuild src/app/core/weight/weight.ts --format=esm --outfile=/tmp/w.mjs && node src/app/core/weight/weight.check.mjs /tmp/w.mjs
import assert from 'node:assert/strict';
const w = await import(process.argv[2]);
const near = (a, b, tol = 0.05) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);
near(w.pieceKg('round', { D: 80 }, 500, 7.85) * 4, 78.9);                  // spec §3.1: EN24 Ø80 × 500 × 4 = 78.9 kg
near(w.pieceKg('round', { D: 25 }, 1000, 7.85), 3.85, 0.01);               // 25 mm round = 3.85 kg/m
near(w.pieceKg('flat', { W: 50, T: 10 }, 6000, 8.0) * 2, 48.0, 0.01);      // SS flat 50×10×6 m ×2
near(w.pieceKg('tube', { OD: 60.3, WT: 3.6 }, 1000, 7.85), 5.03, 0.01);    // 2″ medium pipe ≈ 5.03 kg/m
near(w.pieceKg('hex', { AF: 32 }, 1000, 8.5), 7.54, 0.01);                 // brass hex 32 A/F
near(w.pieceKg('beam', {}, 6000, 0, 44.2), 265.2, 0.01);                    // ISMB 300 × 6 m
assert.equal(w.pieceKg('tube', { OD: 20, WT: 10 }, 1000, 7.85), 0);         // impossible wall
assert.equal(w.validate('angle', { A: 50, B: 50, T: 60 }), 'Thickness must be less than the shorter leg.');
assert.equal(w.dimText('flat', { W: 75, T: 12 }), '75 × 12');
assert.deepEqual(w.rangeOf('Ø 6–150 mm, h9/h11'), [6, 150]);
console.log('weight formulas: all checks passed');
