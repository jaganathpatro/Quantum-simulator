import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sun, Moon, RotateCcw, Download, Share2, Undo, Redo, Calculator, Eye, Settings, CheckCircle, AlertCircle, BookOpen, Zap, Target, Info } from 'lucide-react';

// Enhanced Complex number class with higher precision
class Complex {
  constructor(public re: number, public im: number = 0) {}
  
  static fromPolar(magnitude: number, phase: number): Complex {
    return new Complex(magnitude * Math.cos(phase), magnitude * Math.sin(phase));
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
  
  phase(): number {
    return Math.atan2(this.im, this.re);
  }
  
  // Enhanced string representation with better formatting
  toString(precision: number = 6): string {
    const re = Math.abs(this.re) < Math.pow(10, -precision) ? 0 : this.re;
    const im = Math.abs(this.im) < Math.pow(10, -precision) ? 0 : this.im;
    
    if (im === 0) return re.toFixed(precision);
    if (re === 0) return im === 1 ? 'i' : im === -1 ? '-i' : `${im.toFixed(precision)}i`;
    
    const sign = im >= 0 ? ' + ' : ' - ';
    const imStr = Math.abs(im) === 1 ? 'i' : `${Math.abs(im).toFixed(precision)}i`;
    return `${re.toFixed(precision)}${sign}${imStr}`;
  }
  
  // Polar form representation
  toPolar(precision: number = 6): string {
    const mag = this.magnitude();
    const phase = this.phase();
    return `${mag.toFixed(precision)} × e^(${phase.toFixed(precision)}i)`;
  }
}

// Matrix operations with enhanced precision
type Matrix2x2 = [[Complex, Complex], [Complex, Complex]];
type StateVector = [Complex, Complex];

// Enhanced quantum gate definitions with exact mathematical values
const GATES = {
  H: [
    [new Complex(1/Math.sqrt(2)), new Complex(1/Math.sqrt(2))],
    [new Complex(1/Math.sqrt(2)), new Complex(-1/Math.sqrt(2))]
  ] as Matrix2x2,
  
  X: [
    [new Complex(0), new Complex(1)],
    [new Complex(1), new Complex(0)]
  ] as Matrix2x2,
  
  Y: [
    [new Complex(0), new Complex(0, -1)],
    [new Complex(0, 1), new Complex(0)]
  ] as Matrix2x2,
  
  Z: [
    [new Complex(1), new Complex(0)],
    [new Complex(0), new Complex(-1)]
  ] as Matrix2x2,
  
  S: [
    [new Complex(1), new Complex(0)],
    [new Complex(0), new Complex(0, 1)]
  ] as Matrix2x2,
  
  T: [
    [new Complex(1), new Complex(0)],
    [new Complex(0), new Complex(Math.cos(Math.PI/4), Math.sin(Math.PI/4))]
  ] as Matrix2x2,
  
  // Additional educational gates
  'S†': [
    [new Complex(1), new Complex(0)],
    [new Complex(0), new Complex(0, -1)]
  ] as Matrix2x2,
  
  'T†': [
    [new Complex(1), new Complex(0)],
    [new Complex(0), new Complex(Math.cos(-Math.PI/4), Math.sin(-Math.PI/4))]
  ] as Matrix2x2
};

const GATE_DESCRIPTIONS = {
  H: 'Hadamard Gate - Creates equal superposition (|0⟩ + |1⟩)/√2',
  X: 'Pauli-X Gate - Bit flip operation (quantum NOT)',
  Y: 'Pauli-Y Gate - Bit flip + phase flip (iσₓσᵧ)',
  Z: 'Pauli-Z Gate - Phase flip (|1⟩ → -|1⟩)',
  S: 'S Gate - Quarter turn (π/2 phase shift)',
  T: 'T Gate - Eighth turn (π/4 phase shift)',
  'S†': 'S-dagger Gate - Inverse S gate (-π/2 phase shift)',
  'T†': 'T-dagger Gate - Inverse T gate (-π/4 phase shift)'
};

const GATE_COLORS = {
  H: 'from-blue-500 to-cyan-500',
  X: 'from-red-500 to-pink-500',
  Y: 'from-green-500 to-emerald-500',
  Z: 'from-purple-500 to-violet-500',
  S: 'from-orange-500 to-yellow-500',
  T: 'from-indigo-500 to-blue-500',
  'S†': 'from-yellow-500 to-orange-500',
  'T†': 'from-blue-500 to-indigo-500'
};

// Enhanced matrix operations with numerical stability
function multiplyMatrices(a: Matrix2x2, b: Matrix2x2): Matrix2x2 {
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

function applyMatrix(matrix: Matrix2x2, state: StateVector): StateVector {
  return [
    matrix[0][0].multiply(state[0]).add(matrix[0][1].multiply(state[1])),
    matrix[1][0].multiply(state[0]).add(matrix[1][1].multiply(state[1]))
  ];
}

// Enhanced validation with better tolerance handling
function isUnitary(matrix: Matrix2x2, tolerance: number = 1e-12): boolean {
  const conjugateTranspose: Matrix2x2 = [
    [matrix[0][0].conjugate(), matrix[1][0].conjugate()],
    [matrix[0][1].conjugate(), matrix[1][1].conjugate()]
  ];
  
  const product = multiplyMatrices(conjugateTranspose, matrix);
  
  const identity = [
    [new Complex(1), new Complex(0)],
    [new Complex(0), new Complex(1)]
  ] as Matrix2x2;
  
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const diff = product[i][j].subtract(identity[i][j]);
      if (diff.magnitude() > tolerance) {
        return false;
      }
    }
  }
  return true;
}

function isNormalized(state: StateVector, tolerance: number = 1e-12): boolean {
  const norm = state[0].magnitude() ** 2 + state[1].magnitude() ** 2;
  return Math.abs(norm - 1.0) < tolerance;
}

// Enhanced probability calculations
function calculateProbabilities(state: StateVector) {
  const prob0 = state[0].magnitude() ** 2;
  const prob1 = state[1].magnitude() ** 2;
  const total = prob0 + prob1;
  
  return { 
    prob0: prob0 / total, 
    prob1: prob1 / total,
    normalizationFactor: total
  };
}

function getIdentityMatrix(): Matrix2x2 {
  return [
    [new Complex(1), new Complex(0)],
    [new Complex(0), new Complex(1)]
  ];
}

interface GateOperation {
  id: string;
  gate: keyof typeof GATES;
  timestamp: number;
}

interface HistoryState {
  operations: GateOperation[];
  currentState: StateVector;
  compositeMatrix: Matrix2x2;
}

// Enhanced Bloch Sphere Visualization Component
const BlochSphere: React.FC<{
  state: StateVector;
  isDark: boolean;
  size?: number;
}> = ({ state, isDark, size = 200 }) => {
  const { theta, phi } = useMemo(() => {
    const alpha = state[0];
    const beta = state[1];
    
    // Convert to Bloch sphere coordinates
    const theta = 2 * Math.acos(Math.min(1, alpha.magnitude()));
    const phi = beta.magnitude() > 1e-10 ? beta.phase() - alpha.phase() : 0;
    
    return { theta, phi };
  }, [state]);
  
  const x = Math.sin(theta) * Math.cos(phi);
  const y = Math.sin(theta) * Math.sin(phi);
  const z = Math.cos(theta);
  
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;
  
  // Project 3D coordinates to 2D
  const projX = centerX + radius * x;
  const projY = centerY - radius * z; // Flip Y for screen coordinates
  
  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <h3 className="text-lg font-semibold mb-3 text-center">Bloch Sphere Representation</h3>
      
      <div className="flex justify-center">
        <svg width={size} height={size} className="border rounded">
          {/* Background */}
          <rect width={size} height={size} fill={isDark ? '#1f2937' : '#f9fafb'} />
          
          {/* Sphere outline */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke={isDark ? '#6b7280' : '#9ca3af'}
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          
          {/* Equator */}
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={radius}
            ry={radius * 0.3}
            fill="none"
            stroke={isDark ? '#4b5563' : '#d1d5db'}
            strokeWidth="1"
            strokeDasharray="3,3"
          />
          
          {/* Meridian */}
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={radius * 0.3}
            ry={radius}
            fill="none"
            stroke={isDark ? '#4b5563' : '#d1d5db'}
            strokeWidth="1"
            strokeDasharray="3,3"
          />
          
          {/* Axes */}
          <line x1={centerX - radius} y1={centerY} x2={centerX + radius} y2={centerY} 
                stroke={isDark ? '#6b7280' : '#9ca3af'} strokeWidth="1" />
          <line x1={centerX} y1={centerY - radius} x2={centerX} y2={centerY + radius} 
                stroke={isDark ? '#6b7280' : '#9ca3af'} strokeWidth="1" />
          
          {/* Axis labels */}
          <text x={centerX + radius + 10} y={centerY + 5} fill={isDark ? '#d1d5db' : '#374151'} fontSize="12">X</text>
          <text x={centerX - 5} y={centerY - radius - 5} fill={isDark ? '#d1d5db' : '#374151'} fontSize="12">Z</text>
          <text x={centerX - 10} y={centerY + radius + 15} fill={isDark ? '#d1d5db' : '#374151'} fontSize="12">Y</text>
          
          {/* State vector */}
          <line
            x1={centerX}
            y1={centerY}
            x2={projX}
            y2={projY}
            stroke="#3b82f6"
            strokeWidth="3"
            markerEnd="url(#arrowhead)"
          />
          
          {/* State point */}
          <circle
            cx={projX}
            cy={projY}
            r="6"
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth="2"
          />
          
          {/* Arrow marker */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                    refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
            </marker>
          </defs>
          
          {/* Pole labels */}
          <text x={centerX - 8} y={centerY - radius - 15} fill={isDark ? '#d1d5db' : '#374151'} fontSize="14" fontWeight="bold">|0⟩</text>
          <text x={centerX - 8} y={centerY + radius + 25} fill={isDark ? '#d1d5db' : '#374151'} fontSize="14" fontWeight="bold">|1⟩</text>
        </svg>
      </div>
      
      <div className="mt-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span>θ (polar):</span>
          <span className="font-mono">{(theta * 180 / Math.PI).toFixed(2)}°</span>
        </div>
        <div className="flex justify-between">
          <span>φ (azimuthal):</span>
          <span className="font-mono">{(phi * 180 / Math.PI).toFixed(2)}°</span>
        </div>
        <div className="flex justify-between">
          <span>Coordinates:</span>
          <span className="font-mono">({x.toFixed(3)}, {y.toFixed(3)}, {z.toFixed(3)})</span>
        </div>
      </div>
    </div>
  );
};

// Enhanced Probability Visualization
const ProbabilityVisualization: React.FC<{
  state: StateVector;
  isDark: boolean;
  showPhase: boolean;
}> = ({ state, isDark, showPhase }) => {
  const probabilities = calculateProbabilities(state);
  const alpha = state[0];
  const beta = state[1];
  
  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <h3 className="text-lg font-semibold mb-3 text-center">Probability Amplitudes</h3>
      
      {/* Amplitude bars */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">|0⟩ amplitude (α)</span>
            <span className="text-xs font-mono">{alpha.toString(4)}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs w-12">|α|²:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${probabilities.prob0 * 100}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                  {(probabilities.prob0 * 100).toFixed(2)}%
                </span>
              </div>
            </div>
            {showPhase && (
              <div className="flex items-center space-x-2">
                <span className="text-xs w-12">Phase:</span>
                <div className="flex-1 text-xs font-mono">
                  {(alpha.phase() * 180 / Math.PI).toFixed(2)}° = {alpha.toPolar(4)}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">|1⟩ amplitude (β)</span>
            <span className="text-xs font-mono">{beta.toString(4)}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs w-12">|β|²:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${probabilities.prob1 * 100}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                  {(probabilities.prob1 * 100).toFixed(2)}%
                </span>
              </div>
            </div>
            {showPhase && (
              <div className="flex items-center space-x-2">
                <span className="text-xs w-12">Phase:</span>
                <div className="flex-1 text-xs font-mono">
                  {(beta.phase() * 180 / Math.PI).toFixed(2)}° = {beta.toPolar(4)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Relative phase */}
      {showPhase && (
        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Relative Phase (β - α):</span>
            <span className="text-xs font-mono">
              {((beta.phase() - alpha.phase()) * 180 / Math.PI).toFixed(2)}°
            </span>
          </div>
        </div>
      )}
      
      {/* Normalization check */}
      <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-sm">Normalization:</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono">
              {probabilities.normalizationFactor.toFixed(6)}
            </span>
            {Math.abs(probabilities.normalizationFactor - 1.0) < 1e-10 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Educational Information Panel
const EducationalPanel: React.FC<{
  currentGate?: keyof typeof GATES;
  isDark: boolean;
}> = ({ currentGate, isDark }) => {
  const gateInfo = currentGate ? {
    name: currentGate,
    description: GATE_DESCRIPTIONS[currentGate],
    matrix: GATES[currentGate],
    properties: getGateProperties(currentGate)
  } : null;
  
  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className="flex items-center space-x-2 mb-3">
        <BookOpen className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Educational Information</h3>
      </div>
      
      {gateInfo ? (
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-blue-500">{gateInfo.name} Gate</h4>
            <p className="text-sm opacity-80">{gateInfo.description}</p>
          </div>
          
          <div>
            <h5 className="font-medium mb-2">Matrix Representation:</h5>
            <div className="font-mono text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
              <div className="grid grid-cols-2 gap-2 text-center">
                {gateInfo.matrix.map((row, i) =>
                  row.map((cell, j) => (
                    <div key={`${i}-${j}`} className="p-1">
                      {cell.toString(3)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium mb-2">Properties:</h5>
            <ul className="text-sm space-y-1">
              {gateInfo.properties.map((prop, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>{prop}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 opacity-60">
          <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Select a gate to see detailed information</p>
        </div>
      )}
    </div>
  );
};

function getGateProperties(gate: keyof typeof GATES): string[] {
  const properties: { [key: string]: string[] } = {
    H: ['Unitary', 'Hermitian', 'Creates superposition', 'Self-inverse (H² = I)'],
    X: ['Unitary', 'Hermitian', 'Pauli gate', 'Self-inverse (X² = I)', 'Bit flip'],
    Y: ['Unitary', 'Hermitian', 'Pauli gate', 'Self-inverse (Y² = I)', 'Bit + phase flip'],
    Z: ['Unitary', 'Hermitian', 'Pauli gate', 'Self-inverse (Z² = I)', 'Phase flip'],
    S: ['Unitary', 'Phase gate', 'S² = Z', 'Quarter turn'],
    T: ['Unitary', 'Phase gate', 'T² = S', 'Eighth turn'],
    'S†': ['Unitary', 'Inverse of S gate', 'S†S = I'],
    'T†': ['Unitary', 'Inverse of T gate', 'T†T = I']
  };
  
  return properties[gate] || ['Unitary'];
}

// Enhanced Matrix Display with better formatting
const MatrixDisplay: React.FC<{
  matrix: Matrix2x2;
  title: string;
  precision: number;
  isDark: boolean;
  showPolar?: boolean;
  className?: string;
}> = ({ matrix, title, precision, isDark, showPolar = false, className = '' }) => (
  <div className={`${className} ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${
    isDark ? 'border-gray-700' : 'border-gray-200'
  }`}>
    <h3 className="text-lg font-semibold mb-3 text-center">{title}</h3>
    <div className="font-mono text-sm">
      <div className="flex items-center justify-center space-x-2">
        <span className="text-xl">[</span>
        <div className="grid grid-cols-2 gap-3">
          {matrix.map((row, i) =>
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className={`p-3 rounded text-center min-w-[120px] ${
                  isDark ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <div className="space-y-1">
                  <div>
                    <span className="text-blue-400">{cell.re.toFixed(precision)}</span>
                    {Math.abs(cell.im) > Math.pow(10, -precision) && (
                      <>
                        <span className="mx-1">{cell.im >= 0 ? ' + ' : ' - '}</span>
                        <span className="text-red-400">{Math.abs(cell.im).toFixed(precision)}i</span>
                      </>
                    )}
                  </div>
                  {showPolar && cell.magnitude() > Math.pow(10, -precision) && (
                    <div className="text-xs opacity-70">
                      {cell.toPolar(precision)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <span className="text-xl">]</span>
      </div>
    </div>
    
    {/* Matrix properties */}
    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <span>Determinant:</span>
          <span className="font-mono">
            {(matrix[0][0].multiply(matrix[1][1]).subtract(matrix[0][1].multiply(matrix[1][0]))).toString(precision)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Trace:</span>
          <span className="font-mono">
            {matrix[0][0].add(matrix[1][1]).toString(precision)}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Enhanced State Vector Display
const StateVectorDisplay: React.FC<{
  state: StateVector;
  precision: number;
  isDark: boolean;
  showProbabilities: boolean;
  showPhase: boolean;
}> = ({ state, precision, isDark, showProbabilities, showPhase }) => {
  return (
    <div className="space-y-4">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <h3 className="text-lg font-semibold mb-3 text-center">Quantum State Vector</h3>
        
        <div className="font-mono text-sm mb-4">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xl">|ψ⟩ = </span>
            <div className="space-y-2">
              <div className={`p-3 rounded text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="space-y-1">
                  <div>
                    <span className="text-blue-400">{state[0].re.toFixed(precision)}</span>
                    {Math.abs(state[0].im) > Math.pow(10, -precision) && (
                      <>
                        <span className="mx-1">{state[0].im >= 0 ? ' + ' : ' - '}</span>
                        <span className="text-red-400">{Math.abs(state[0].im).toFixed(precision)}i</span>
                      </>
                    )}
                    <span className="ml-2">|0⟩</span>
                  </div>
                  {showPhase && (
                    <div className="text-xs opacity-70">
                      {state[0].toPolar(precision)}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center text-lg">+</div>
              <div className={`p-3 rounded text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="space-y-1">
                  <div>
                    <span className="text-blue-400">{state[1].re.toFixed(precision)}</span>
                    {Math.abs(state[1].im) > Math.pow(10, -precision) && (
                      <>
                        <span className="mx-1">{state[1].im >= 0 ? ' + ' : ' - '}</span>
                        <span className="text-red-400">{Math.abs(state[1].im).toFixed(precision)}i</span>
                      </>
                    )}
                    <span className="ml-2">|1⟩</span>
                  </div>
                  {showPhase && (
                    <div className="text-xs opacity-70">
                      {state[1].toPolar(precision)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showProbabilities && (
        <ProbabilityVisualization 
          state={state} 
          isDark={isDark} 
          showPhase={showPhase}
        />
      )}
    </div>
  );
};

// Enhanced Gate Card with hover effects and detailed info
const GateCard: React.FC<{
  gateName: keyof typeof GATES;
  onSelect: (gate: keyof typeof GATES) => void;
  onHover: (gate: keyof typeof GATES | null) => void;
  precision: number;
  isDark: boolean;
  isSelected?: boolean;
}> = ({ gateName, onSelect, onHover, precision, isDark, isSelected = false }) => {
  const matrix = GATES[gateName];
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={() => onSelect(gateName)}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover(gateName);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHover(null);
      }}
      className={`${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} 
        rounded-lg p-4 border transition-all duration-300 transform ${
        isHovered || isSelected ? 'scale-105 shadow-lg' : 'scale-100'
      } ${isDark ? 'border-gray-700' : 'border-gray-200'} ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      aria-label={`Apply ${gateName} gate: ${GATE_DESCRIPTIONS[gateName]}`}
    >
      <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${GATE_COLORS[gateName]} 
        flex items-center justify-center text-white font-bold text-lg mb-3 mx-auto`}>
        {gateName}
      </div>
      
      <div className="font-mono text-xs mb-3">
        <div className="grid grid-cols-2 gap-1">
          {matrix.map((row, i) =>
            row.map((cell, j) => (
              <div key={`${i}-${j}`} className="text-center p-1">
                <span className="text-blue-400">{cell.re.toFixed(2)}</span>
                {Math.abs(cell.im) > 0.01 && (
                  <>
                    <span className="mx-1">{cell.im >= 0 ? '+' : ''}</span>
                    <span className="text-red-400">{cell.im.toFixed(2)}i</span>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="text-xs opacity-70 text-center leading-tight">
        {GATE_DESCRIPTIONS[gateName]}
      </div>
    </button>
  );
};

// Enhanced Operation Sequence with better visualization
const OperationSequence: React.FC<{
  operations: GateOperation[];
  onRemove: (id: string) => void;
  isDark: boolean;
}> = ({ operations, onRemove, isDark }) => (
  <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${
    isDark ? 'border-gray-700' : 'border-gray-200'
  }`}>
    <h3 className="text-lg font-semibold mb-3 text-center">
      <div className="flex items-center justify-center space-x-2">
        <Zap className="h-5 w-5 text-yellow-500" />
        <span>Gate Sequence (Right-to-Left Application)</span>
      </div>
    </h3>
    
    {operations.length === 0 ? (
      <div className="text-center py-8 opacity-60">
        <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No gates applied yet</p>
        <p className="text-sm">Click a gate below to start building your quantum circuit</p>
      </div>
    ) : (
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2 flex-wrap gap-2">
          <span className="font-mono text-lg">|ψ₀⟩</span>
          {operations.map((operation, index) => (
            <React.Fragment key={operation.id}>
              <span className="text-gray-400 text-xl">→</span>
              <button
                onClick={() => onRemove(operation.id)}
                className={`w-10 h-10 rounded-full bg-gradient-to-r ${GATE_COLORS[operation.gate]} 
                  flex items-center justify-center text-white font-bold text-sm
                  hover:scale-110 transition-transform duration-200 relative group shadow-lg`}
                title={`Remove ${operation.gate} gate`}
                aria-label={`Remove ${operation.gate} gate from sequence`}
              >
                {operation.gate}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Click to remove
                </div>
              </button>
              <span className="font-mono text-sm">|ψ₊{index + 1}⟩</span>
            </React.Fragment>
          ))}
        </div>
        
        {/* Circuit diagram */}
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-semibold mb-2 text-center">Quantum Circuit Diagram</h4>
          <div className="flex items-center justify-center space-x-1">
            <span className="text-sm">|0⟩ ——</span>
            {operations.map((operation, index) => (
              <React.Fragment key={operation.id}>
                <div className={`w-8 h-8 rounded bg-gradient-to-r ${GATE_COLORS[operation.gate]} 
                  flex items-center justify-center text-white font-bold text-xs`}>
                  {operation.gate}
                </div>
                {index < operations.length - 1 && <span>——</span>}
              </React.Fragment>
            ))}
            <span className="text-sm">—— Measurement</span>
          </div>
        </div>
      </div>
    )}
  </div>
);

function App() {
  const [isDark, setIsDark] = useState(true);
  const [operations, setOperations] = useState<GateOperation[]>([]);
  const [currentState, setCurrentState] = useState<StateVector>([new Complex(1), new Complex(0)]);
  const [compositeMatrix, setCompositeMatrix] = useState<Matrix2x2>(getIdentityMatrix());
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showProbabilities, setShowProbabilities] = useState(true);
  const [showPhase, setShowPhase] = useState(true);
  const [precision, setPrecision] = useState(4);
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredGate, setHoveredGate] = useState<keyof typeof GATES | null>(null);
  const [selectedGate, setSelectedGate] = useState<keyof typeof GATES | null>(null);

  // Save state to history
  const saveToHistory = useCallback((ops: GateOperation[], state: StateVector, matrix: Matrix2x2) => {
    const newState = { 
      operations: [...ops], 
      currentState: [...state] as StateVector, 
      compositeMatrix: matrix.map(row => [...row]) as Matrix2x2 
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 100) newHistory.shift(); // Increased history size
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Add gate operation with enhanced precision
  const addGate = useCallback((gateName: keyof typeof GATES) => {
    const newOperation: GateOperation = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      gate: gateName,
      timestamp: Date.now()
    };
    
    const newOperations = [...operations, newOperation];
    
    // Apply gate to current state with enhanced precision
    const gateMatrix = GATES[gateName];
    const newState = applyMatrix(gateMatrix, currentState);
    
    // Update composite matrix
    const newCompositeMatrix = multiplyMatrices(gateMatrix, compositeMatrix);
    
    saveToHistory(newOperations, newState, newCompositeMatrix);
    setOperations(newOperations);
    setCurrentState(newState);
    setCompositeMatrix(newCompositeMatrix);
    setSelectedGate(gateName);
  }, [operations, currentState, compositeMatrix, saveToHistory]);

  // Reset simulation
  const reset = useCallback(() => {
    const initialState: StateVector = [new Complex(1), new Complex(0)];
    const initialMatrix = getIdentityMatrix();
    const initialOps: GateOperation[] = [];
    
    saveToHistory(initialOps, initialState, initialMatrix);
    setOperations(initialOps);
    setCurrentState(initialState);
    setCompositeMatrix(initialMatrix);
    setSelectedGate(null);
  }, [saveToHistory]);

  // Undo operation
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setOperations([...prevState.operations]);
      setCurrentState([...prevState.currentState] as StateVector);
      setCompositeMatrix(prevState.compositeMatrix.map(row => [...row]) as Matrix2x2);
    }
  }, [history, historyIndex]);

  // Redo operation
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setOperations([...nextState.operations]);
      setCurrentState([...nextState.currentState] as StateVector);
      setCompositeMatrix(nextState.compositeMatrix.map(row => [...row]) as Matrix2x2);
    }
  }, [history, historyIndex]);

  // Remove operation with recalculation
  const removeOperation = useCallback((operationId: string) => {
    const newOperations = operations.filter(op => op.id !== operationId);
    
    // Recalculate from scratch for accuracy
    let newState: StateVector = [new Complex(1), new Complex(0)];
    let newMatrix = getIdentityMatrix();
    
    // Apply operations in reverse order (right-to-left)
    for (let i = newOperations.length - 1; i >= 0; i--) {
      const gateMatrix = GATES[newOperations[i].gate];
      newMatrix = multiplyMatrices(gateMatrix, newMatrix);
    }
    
    // Apply final matrix to initial state
    newState = applyMatrix(newMatrix, [new Complex(1), new Complex(0)]);
    
    saveToHistory(newOperations, newState, newMatrix);
    setOperations(newOperations);
    setCurrentState(newState);
    setCompositeMatrix(newMatrix);
  }, [operations, saveToHistory]);

  // Enhanced export with more data
  const exportState = useCallback(() => {
    const probabilities = calculateProbabilities(currentState);
    const data = {
      version: "2.0",
      operations: operations.map(op => ({
        gate: op.gate,
        timestamp: op.timestamp,
        description: GATE_DESCRIPTIONS[op.gate]
      })),
      finalState: {
        alpha: { 
          re: currentState[0].re, 
          im: currentState[0].im,
          magnitude: currentState[0].magnitude(),
          phase: currentState[0].phase()
        },
        beta: { 
          re: currentState[1].re, 
          im: currentState[1].im,
          magnitude: currentState[1].magnitude(),
          phase: currentState[1].phase()
        }
      },
      probabilities: {
        prob0: probabilities.prob0,
        prob1: probabilities.prob1,
        normalizationFactor: probabilities.normalizationFactor
      },
      blochSphere: {
        theta: 2 * Math.acos(Math.min(1, currentState[0].magnitude())),
        phi: currentState[1].magnitude() > 1e-10 ? 
             currentState[1].phase() - currentState[0].phase() : 0
      },
      validation: {
        isNormalized: isNormalized(currentState),
        isUnitary: isUnitary(compositeMatrix),
        tolerance: 1e-12
      },
      compositeMatrix: {
        elements: compositeMatrix.map(row => 
          row.map(cell => ({
            re: cell.re,
            im: cell.im,
            magnitude: cell.magnitude(),
            phase: cell.phase()
          }))
        ),
        determinant: compositeMatrix[0][0].multiply(compositeMatrix[1][1])
                    .subtract(compositeMatrix[0][1].multiply(compositeMatrix[1][0])),
        trace: compositeMatrix[0][0].add(compositeMatrix[1][1])
      },
      timestamp: new Date().toISOString(),
      precision: precision
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum-state-enhanced-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [operations, currentState, compositeMatrix, precision]);

  // Enhanced share functionality
  const shareState = useCallback(async () => {
    const gateSequence = operations.map(op => op.gate).join('');
    const probabilities = calculateProbabilities(currentState);
    const url = `${window.location.origin}${window.location.pathname}?gates=${gateSequence}`;
    
    const shareText = `Quantum State: ${gateSequence || 'Initial state |0⟩'}
Probabilities: |0⟩=${(probabilities.prob0*100).toFixed(1)}%, |1⟩=${(probabilities.prob1*100).toFixed(1)}%
Gates applied: ${operations.length}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Quantum Matrix Simulator State',
          text: shareText,
          url: url
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      alert('State information and link copied to clipboard!');
    }
  }, [operations, currentState]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'r':
            e.preventDefault();
            reset();
            break;
          case 's':
            e.preventDefault();
            exportState();
            break;
          case 'p':
            e.preventDefault();
            setShowProbabilities(!showProbabilities);
            break;
        }
      } else {
        // Direct gate shortcuts
        const gateMap: { [key: string]: keyof typeof GATES } = {
          'h': 'H', 'x': 'X', 'y': 'Y', 'z': 'Z', 's': 'S', 't': 'T'
        };
        if (gateMap[e.key.toLowerCase()]) {
          addGate(gateMap[e.key.toLowerCase()]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [undo, redo, reset, exportState, addGate, showProbabilities]);

  // Initialize from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gates = params.get('gates');
    if (gates && operations.length === 0) {
      const gateArray = gates.split('').filter(gate => gate in GATES);
      gateArray.forEach((gate, index) => {
        setTimeout(() => {
          addGate(gate as keyof typeof GATES);
        }, index * 150);
      });
    }
  }, []);

  const probabilities = calculateProbabilities(currentState);
  const isStateNormalized = isNormalized(currentState);
  const isMatrixUnitary = isUnitary(compositeMatrix);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Enhanced Header */}
      <header className={`${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-b px-4 py-4 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Quantum Simulator
              </h1>
            </div>
            <div className="hidden md:block text-sm opacity-70">
              Interactive quantum computing with enhanced visualizations
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs">
              {isStateNormalized ? (
                <CheckCircle className="h-4 w-4 text-green-500" title="State is normalized" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" title="State is not normalized" />
              )}
              {isMatrixUnitary ? (
                <CheckCircle className="h-4 w-4 text-green-500" title="Matrix is unitary" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" title="Matrix is not unitary" />
              )}
            </div>
            
            <button
              onClick={() => setShowProbabilities(!showProbabilities)}
              className={`p-2 rounded-lg transition-colors ${
                showProbabilities ? 'bg-blue-500 text-white' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Toggle probability display (Ctrl+P)"
            >
              <Eye className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setShowPhase(!showPhase)}
              className={`p-2 rounded-lg transition-colors ${
                showPhase ? 'bg-purple-500 text-white' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Toggle phase information"
            >
              <Target className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings ? 'bg-blue-500 text-white' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className={`p-2 rounded-lg transition-colors ${
                historyIndex <= 0 
                  ? 'opacity-50 cursor-not-allowed' 
                  : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-5 w-5" />
            </button>
            
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className={`p-2 rounded-lg transition-colors ${
                historyIndex >= history.length - 1 
                  ? 'opacity-50 cursor-not-allowed' 
                  : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="h-5 w-5" />
            </button>
            
            <button
              onClick={reset}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Reset (Ctrl+R)"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            
            <button
              onClick={exportState}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Export enhanced state (Ctrl+S)"
            >
              <Download className="h-5 w-5" />
            </button>
            
            <button
              onClick={shareState}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Share state"
            >
              <Share2 className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Enhanced Settings Panel */}
      {showSettings && (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-4`}>
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Precision:</label>
                <select
                  value={precision}
                  onChange={(e) => setPrecision(Number(e.target.value))}
                  className={`rounded px-2 py-1 text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                  } border`}
                >
                  <option value={2}>2 decimals</option>
                  <option value={3}>3 decimals</option>
                  <option value={4}>4 decimals</option>
                  <option value={5}>5 decimals</option>
                  <option value={6}>6 decimals</option>
                  <option value={8}>8 decimals</option>
                </select>
              </div>
              
              <div className="text-xs opacity-70">
                <div className="space-y-1">
                  <div>Keyboard shortcuts:</div>
                  <div className="flex flex-wrap gap-1">
                    {['H', 'X', 'Y', 'Z', 'S', 'T'].map(key => (
                      <kbd key={key} className="px-1 rounded bg-gray-200 dark:bg-gray-700">{key}</kbd>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="text-xs opacity-70">
                <div className="space-y-1">
                  <div>System controls:</div>
                  <div>Ctrl+Z/Y: Undo/Redo | Ctrl+R: Reset | Ctrl+S: Export</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Enhanced Gate Palette */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-center">Quantum Gate Library</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {(Object.keys(GATES) as Array<keyof typeof GATES>).map(gateName => (
              <GateCard
                key={gateName}
                gateName={gateName}
                onSelect={addGate}
                onHover={setHoveredGate}
                precision={precision}
                isDark={isDark}
                isSelected={selectedGate === gateName}
              />
            ))}
          </div>
        </div>

        {/* Operation Sequence */}
        <OperationSequence
          operations={operations}
          onRemove={removeOperation}
          isDark={isDark}
        />

        {/* Main Content Grid - Enhanced Layout */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Column: State Vector and Bloch Sphere */}
          <div className="lg:col-span-1 space-y-6">
            <StateVectorDisplay
              state={currentState}
              precision={precision}
              isDark={isDark}
              showProbabilities={showProbabilities}
              showPhase={showPhase}
            />
            
            <BlochSphere
              state={currentState}
              isDark={isDark}
              size={250}
            />
          </div>

          {/* Middle Column: Matrices */}
          <div className="lg:col-span-2 space-y-6">
            <MatrixDisplay
              matrix={compositeMatrix}
              title="Composite Transformation Matrix"
              precision={precision}
              isDark={isDark}
              showPolar={showPhase}
            />
            
            {/* Enhanced Validation Status */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold mb-3 text-center">Mathematical Validation</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  {isStateNormalized ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  )}
                  <div>
                    <div className="font-semibold">State Normalization</div>
                    <div className="text-sm opacity-70 font-mono">
                      ||ψ||² = {probabilities.normalizationFactor.toFixed(8)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {isMatrixUnitary ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  )}
                  <div>
                    <div className="font-semibold">Matrix Unitarity</div>
                    <div className="text-sm opacity-70">
                      U†U = I check {isMatrixUnitary ? 'passed' : 'failed'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional mathematical properties */}
              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Determinant:</span>
                    <div className="font-mono text-xs">
                      {(compositeMatrix[0][0].multiply(compositeMatrix[1][1])
                        .subtract(compositeMatrix[0][1].multiply(compositeMatrix[1][0]))).toString(precision)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Trace:</span>
                    <div className="font-mono text-xs">
                      {compositeMatrix[0][0].add(compositeMatrix[1][1]).toString(precision)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Educational Panel */}
          <div className="lg:col-span-1">
            <EducationalPanel
              currentGate={hoveredGate || selectedGate || undefined}
              isDark={isDark}
            />
          </div>
        </div>

        {/* Enhanced Operation Analysis */}
        {operations.length > 0 && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-3 text-center">Detailed Operation Analysis</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Applied Gates:</h4>
                <div className="space-y-2 text-sm">
                  {operations.map((op, index) => (
                    <div key={op.id} className="flex items-center space-x-3 p-2 rounded bg-gray-100 dark:bg-gray-700">
                      <span className="opacity-60 w-6">{index + 1}.</span>
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${GATE_COLORS[op.gate]} 
                        flex items-center justify-center text-white text-xs font-bold`}>
                        {op.gate}
                      </div>
                      <span className="flex-1">{GATE_DESCRIPTIONS[op.gate]}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Quantum Properties:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Gates applied:</span>
                    <span className="font-mono">{operations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>|α| amplitude:</span>
                    <span className="font-mono">{currentState[0].magnitude().toFixed(precision)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>|β| amplitude:</span>
                    <span className="font-mono">{currentState[1].magnitude().toFixed(precision)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phase difference:</span>
                    <span className="font-mono">{((currentState[1].phase() - currentState[0].phase()) * 180 / Math.PI).toFixed(2)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entanglement:</span>
                    <span className="font-mono">
                      {Math.abs(currentState[0].magnitude() * currentState[1].magnitude()) > 0.01 ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Measurement Statistics:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>P(|0⟩):</span>
                    <span className="font-mono">{(probabilities.prob0 * 100).toFixed(4)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>P(|1⟩):</span>
                    <span className="font-mono">{(probabilities.prob1 * 100).toFixed(4)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entropy:</span>
                    <span className="font-mono">
                      {(-(probabilities.prob0 * Math.log2(probabilities.prob0 + 1e-10) + 
                         probabilities.prob1 * Math.log2(probabilities.prob1 + 1e-10))).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Purity:</span>
                    <span className="font-mono">
                      {(probabilities.prob0 ** 2 + probabilities.prob1 ** 2).toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Footer */}
        <footer className="text-center text-sm opacity-60 py-4 space-y-2">
          <p>Enhanced Quantum Matrix Simulator - Advanced educational quantum computing tool</p>
          <p>Gate application: Mₙ × ... × M₂ × M₁ × |ψ⟩ (right-to-left composition)</p>
          <p>Precision: {precision} decimal places | Tolerance: 10⁻¹² | Enhanced visualizations enabled</p>
        </footer>
      </div>
    </div>
  );
}

export default App;