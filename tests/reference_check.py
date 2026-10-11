#!/usr/bin/env python3
"""Optional independent NumPy cross-check. Core app and Node tests need no NumPy.
Run from any directory: python3 tests/reference_check.py
Use --out FILE to preserve the measured validation report.
"""
import argparse
import json
import pathlib
import subprocess
import sys
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
NODE = r"""
const E=require('./src/engine.js');
const cases=[];
for(const lab of E.SERIES){
 const s=new E.Simulation({lab:lab.id});s.step(319);
 const c={lab:lab.id,n:s.n,dt:s.config.dt,gamma:s.config.dephasing,
 h:Array.from(s.hamiltonian()),re:Array.from(s.rho.re),im:Array.from(s.rho.im)};
 s.step();c.nextRe=Array.from(s.rho.re);c.nextIm=Array.from(s.rho.im);cases.push(c);
}
const refine=[];
for(const dt of [.025,.0125,.00625,.003125]){
 const s=new E.Simulation({lab:'feedback',dt});s.step(Math.round(4/dt));
 refine.push({dt,re:Array.from(s.rho.re),im:Array.from(s.rho.im),phi:Array.from(s.field.phi)});
}
const waves=[];
for(const n of [64,128,256]){
 const c=E.validatedConfig({lab:'field',gridPoints:n,dt:.025*64/n,damping:0,sourceGain:0});
 const f=new E.WaveField(c),zero=new Float64Array(n),k=2*Math.PI*3/c.domainLength;
 for(let i=0;i<n;i++)f.phi[i]=Math.sin(k*i*f.dx);
 for(let s=0;s<Math.round(2/c.dt);s++)f.advance(c,zero,zero);
 waves.push({n,length:c.domainLength,phi:Array.from(f.phi)});
}
console.log(JSON.stringify({engine:E.VERSION,cases,refine,waves}));
"""

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=pathlib.Path)
    args = parser.parse_args()
    raw = subprocess.run(['node', '-e', NODE], cwd=ROOT, text=True, capture_output=True, check=True)
    data = json.loads(raw.stdout)
    checks = []
    for case in data['cases']:
        n = case['n']
        h = np.array(case['h']).reshape(n, n)
        rho = (np.array(case['re']) + 1j * np.array(case['im'])).reshape(n, n)
        actual = (np.array(case['nextRe']) + 1j * np.array(case['nextIm'])).reshape(n, n)
        values, vectors = np.linalg.eigh(h)
        u = (vectors * np.exp(-1j * values * case['dt'])) @ vectors.conj().T
        different = np.arange(n)[:, None] // 2 != np.arange(n)[None, :] // 2
        channel = np.where(different, np.exp(-case['gamma'] * case['dt'] / 2), 1)
        expected = (u @ (rho * channel) @ u.conj().T) * channel
        error = float(np.max(np.abs(actual - expected)))
        minimum = float(np.linalg.eigvalsh(actual).min())
        assert error < 1e-10, (case['lab'], error)
        assert minimum > -1e-10, (case['lab'], minimum)
        checks.append({'lab': case['lab'], 'numpy_step_max_error': error,
                       'minimum_density_eigenvalue': minimum,
                       'trace_error': float(abs(np.trace(actual) - 1))})
    wave_errors = []
    for wave in data['waves']:
        k = 2 * np.pi * 3 / wave['length']
        x = np.arange(wave['n']) * wave['length'] / wave['n']
        exact = np.sin(k*x) * np.cos(k*2)
        wave_errors.append(float(np.sqrt(np.mean((np.array(wave['phi']) - exact)**2))))
    ratios = [wave_errors[i] / wave_errors[i+1] for i in range(2)]
    assert min(ratios) > 3.5, ratios
    reference = data['refine'][-1]
    rref = np.array(reference['re']) + 1j*np.array(reference['im'])
    errors = [float(np.linalg.norm(np.array(x['re']) + 1j*np.array(x['im']) - rref)) for x in data['refine'][:-1]]
    hybrid_ratios = [errors[i]/errors[i+1] for i in range(2)]
    assert min(hybrid_ratios) > 1.5, hybrid_ratios
    report = {'engine': data['engine'], 'numpy_version': np.__version__, 'status': 'passed',
              'checks': checks, 'wave_rms_errors_64_128_256': wave_errors,
              'wave_error_ratios': ratios, 'hybrid_dt_values': [.025, .0125, .00625],
              'hybrid_reference_dt': .003125, 'hybrid_density_errors_at_t4': errors,
              'hybrid_error_ratios': hybrid_ratios,
              'scope': 'Implementation cross-check; not empirical validation. No browser rendering was exercised.'}
    text = json.dumps(report, indent=2) + '\n'
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text)
    sys.stdout.write(text)

if __name__ == '__main__':
    main()
