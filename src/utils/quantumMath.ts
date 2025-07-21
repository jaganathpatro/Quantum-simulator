// Enhanced Complex number class with better precision and methods
export class Complex {
  constructor(public re: number, public im: number = 0) {
    // Clean up tiny floating point errors
    this.re = Math.abs(this.re) < 1e-15 ? 0 : this.re;
    this.im = Math.abs(this.im) < 1e-15 ? 0 : this.im;
  }
  
  static fromPolar(magnitude: number, phase: number): Complex {
    return new Complex(magnitude * Math.cos(phase), magnitude * Math.sin(phase));
  }
  
  static zero(): Complex {
    return new Complex(0, 0);
  }
  
  static one(): Complex {
    return new Complex(1, 0);
  }
  
  static i(): Complex {
    return new Complex(0, 1);
  }
  
  multiply(other: Complex): Complex {
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re
    );
  }
  
  add(other: Complex): Complex {
    return new Complex(this.re + other.re, this.im + other.im);
  }
  
  subtract(other: Complex): Complex {
    return new Complex(this.re - other.re, this.im - other.im);
  }
  
  conjugate(): Complex {
    return new Complex(this.re, -this.im);
  }
  
  magnitude(): number {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }
  
  magnitudeSquared(): number {
    return this.re * this.re + this.im * this.im;
  }
  
  phase(): number {
    return Math.atan2(this.im, this.re);
  }
  
  normalize(): Complex {
    const mag = this.magnitude();
    if (mag === 0) return Complex.zero();
    return new Complex(this.re / mag, this.im / mag);
  }
  
  equals(other: Complex, tolerance: number = 1e-12): boolean {
    return Math.abs(this.re - other.re) < tolerance && 
           Math.abs(this.im - other.im) < tolerance;
  }
  
  toString(precision: number = 4): string {
    const re = Math.abs(this.re) < Math.pow(10, -precision) ? 0 : this.re;
    const im = Math.abs(this.im) < Math.pow(10, -precision) ? 0 : this.im;
    
    if (im === 0) return re.toFixed(precision);
    if (re === 0) {
      if (im === 1) return 'i';
      if (im === -1) return '-i';
      return `${im.toFixed(precision)}i`;
    }
    
    const sign = im >= 0 ? ' + ' : ' - ';
    const imStr = Math.abs(im) === 1 ? 'i' : `${Math.abs(im).toFixed(precision)}i`;
    return `${re.toFixed(precision)}${sign}${imStr}`;
  }
  
  toPolarString(precision: number = 4): string {
    const mag = this.magnitude();
    const phase = this.phase();
    if (mag === 0) return '0';
    if (Math.abs(phase) < Math.pow(10, -precision)) {
      return mag.toFixed(precision);
    }
    return `${mag.toFixed(precision)} × e^(${(phase).toFixed(precision)}i)`;
  }
}

// Matrix operations
export type Matrix2x2 = [[Complex, Complex], [Complex, Complex]];
export type StateVector = [Complex, Complex];

// Precise mathematical constants
const SQRT2 = Math.sqrt(2);
const SQRT2_INV = 1 / SQRT2;
const PI_4 = Math.PI / 4;
const PI_2 = Math.PI / 2;

// Enhanced quantum gate definitions with exact mathematical values
export const GATES = {
  H: [
    [new Complex(SQRT2_INV), new Complex(SQRT2_INV)],
    [new Complex(SQRT2_INV), new Complex(-SQRT2_INV)]
  ] as Matrix2x2,
  
  X: [
    [Complex.zero(), Complex.one()],
    [Complex.one(), Complex.zero()]
  ] as Matrix2x2,
  
  Y: [
    [Complex.zero(), new Complex(0, -1)],
    [Complex.i(), Complex.zero()]
  ] as Matrix2x2,
  
  Z: [
    [Complex.one(), Complex.zero()],
    [Complex.zero(), new Complex(-1)]
  ] as Matrix2x2,
  
  S: [
    [Complex.one(), Complex.zero()],
    [Complex.zero(), Complex.i()]
  ] as Matrix2x2,
  
  T: [
    [Complex.one(), Complex.zero()],
    [Complex.zero(), Complex.fromPolar(1, PI_4)]
  ] as Matrix2x2,
  
  'S†': [
    [Complex.one(), Complex.zero()],
    [Complex.zero(), new Complex(0, -1)]
  ] as Matrix2x2,
  
  'T†': [
    [Complex.one(), Complex.zero()],
    [Complex.zero(), Complex.fromPolar(1, -PI_4)]
  ] as Matrix2x2
};

export const GATE_DESCRIPTIONS = {
  H: 'Hadamard Gate - Creates superposition (|0⟩ + |1⟩)/√2',
  X: 'Pauli-X Gate - Bit flip (quantum NOT gate)',
  Y: 'Pauli-Y Gate - Bit flip + phase flip',
  Z: 'Pauli-Z Gate - Phase flip (|1⟩ → -|1⟩)',
  S: 'S Gate - π/2 phase gate (|1⟩ → i|1⟩)',
  T: 'T Gate - π/4 phase gate',
  'S†': 'S Dagger - Inverse of S gate (-π/2 phase)',
  'T†': 'T Dagger - Inverse of T gate (-π/4 phase)'
};

export const GATE_PROPERTIES = {
  H: { unitary: true, hermitian: true, selfInverse: true },
  X: { unitary: true, hermitian: true, selfInverse: true },
  Y: { unitary: true, hermitian: true, selfInverse: true },
  Z: { unitary: true, hermitian: true, selfInverse: true },
  S: { unitary: true, hermitian: false, selfInverse: false },
  T: { unitary: true, hermitian: false, selfInverse: false },
  'S†': { unitary: true, hermitian: false, selfInverse: false },
  'T†': { unitary: true, hermitian: false, selfInverse: false }
};

// Enhanced matrix multiplication with better numerical stability
export function multiplyMatrices(a: Matrix2x2, b: Matrix2x2): Matrix2x2 {
  return [
    [
      a[0][0].multiply(b[0][0]).add(a[0][1].multiply(b[1][0])),
      a[0][0].multiply(b[0][1]).add(a[0][1].multiply(b[1][1]))
    ],
    [
      a[1][0].multiply(b[0][0]).add(a[1][1].multiply(b[1][0])),
      a[1][0].multiply(b[0][1]).add(a[1][1].multiply(b[1][1]))
    ]
  ];
}

// Apply matrix to state vector
export function applyMatrix(matrix: Matrix2x2, state: StateVector): StateVector {
  return [
    matrix[0][0].multiply(state[0]).add(matrix[0][1].multiply(state[1])),
    matrix[1][0].multiply(state[0]).add(matrix[1][1].multiply(state[1]))
  ];
}

// Enhanced unitarity check with better tolerance
export function isUnitary(matrix: Matrix2x2, tolerance: number = 1e-12): boolean {
  const conjugateTranspose: Matrix2x2 = [
    [matrix[0][0].conjugate(), matrix[1][0].conjugate()],
    [matrix[0][1].conjugate(), matrix[1][1].conjugate()]
  ];
  
  const product = multiplyMatrices(conjugateTranspose, matrix);
  
  // Check if product is identity matrix
  const identity = getIdentityMatrix();
  
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      if (!product[i][j].equals(identity[i][j], tolerance)) {
        return false;
      }
    }
  }
  return true;
}

// Enhanced normalization check
export function isNormalized(state: StateVector, tolerance: number = 1e-12): boolean {
  const norm = state[0].magnitudeSquared() + state[1].magnitudeSquared();
  return Math.abs(norm - 1.0) < tolerance;
}

// Calculate measurement probabilities
export function calculateProbabilities(state: StateVector) {
  const prob0 = state[0].magnitudeSquared();
  const prob1 = state[1].magnitudeSquared();
  const total = prob0 + prob1;
  
  // Normalize probabilities to ensure they sum to 1
  return { 
    prob0: prob0 / total, 
    prob1: prob1 / total,
    isNormalized: Math.abs(total - 1.0) < 1e-12
  };
}

// Get identity matrix
export function getIdentityMatrix(): Matrix2x2 {
  return [
    [Complex.one(), Complex.zero()],
    [Complex.zero(), Complex.one()]
  ];
}

// Calculate matrix determinant
export function calculateDeterminant(matrix: Matrix2x2): Complex {
  return matrix[0][0].multiply(matrix[1][1]).subtract(
    matrix[0][1].multiply(matrix[1][0])
  );
}

// Calculate matrix trace
export function calculateTrace(matrix: Matrix2x2): Complex {
  return matrix[0][0].add(matrix[1][1]);
}

// Calculate von Neumann entropy
export function calculateEntropy(state: StateVector): number {
  const probs = calculateProbabilities(state);
  let entropy = 0;
  
  if (probs.prob0 > 1e-15) {
    entropy -= probs.prob0 * Math.log2(probs.prob0);
  }
  if (probs.prob1 > 1e-15) {
    entropy -= probs.prob1 * Math.log2(probs.prob1);
  }
  
  return entropy;
}

// Calculate state purity
export function calculatePurity(state: StateVector): number {
  const probs = calculateProbabilities(state);
  return probs.prob0 * probs.prob0 + probs.prob1 * probs.prob1;
}

// Normalize state vector
export function normalizeState(state: StateVector): StateVector {
  const norm = Math.sqrt(state[0].magnitudeSquared() + state[1].magnitudeSquared());
  if (norm === 0) return [Complex.one(), Complex.zero()];
  
  return [
    new Complex(state[0].re / norm, state[0].im / norm),
    new Complex(state[1].re / norm, state[1].im / norm)
  ];
}