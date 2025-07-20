import React, { useState, useEffect } from 'react';
import { Sun, Moon, RotateCcw, Download, Share2, Undo, Redo, Calculator, Eye } from 'lucide-react';

// Complex number class for quantum calculations
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
  
  conjugate(): Complex {
    return new Complex(this.re, -this.im);
  }
  
  magnitude(): number {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }
  
  phase(): number {
    return Math.atan2(this.im, this.re);
  }
  
  toString(precision: number = 3): string {
    const re = Math.abs(this.re) < 1e-10 ? 0 : this.re;
    const im = Math.abs(this.im) < 1e-10 ? 0 : this.im;
    
    if (im === 0) return re.toFixed(precision);
    if (re === 0) return im === 1 ? 'i' : im === -1 ? '-i' : `${im.toFixed(precision)}i`;
    
    const sign = im >= 0 ? '+' : '-';
    const imStr = Math.abs(im) === 1 ? 'i' : `${Math.abs(im).toFixed(precision)}i`;
    return `${re.toFixed(precision)} ${sign} ${imStr}`;
  }
}

// Matrix operations
type Matrix2x2 = [[Complex, Complex], [Complex, Complex]];
type StateVector = [Complex, Complex];

// Quantum gate definitions
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
    [new Complex(0), new Complex(1/Math.sqrt(2), 1/Math.sqrt(2))]
  ] as Matrix2x2
};

const GATE_DESCRIPTIONS = {
  H: 'Hadamard Gate - Creates superposition',
  X: 'Pauli-X Gate - Bit flip (NOT gate)',
  Y: 'Pauli-Y Gate - Bit + phase flip',
  Z: 'Pauli-Z Gate - Phase flip',
  S: 'S Gate - π/2 phase gate',
  T: 'T Gate - π/4 phase gate'
};

// Matrix multiplication
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

// Apply matrix to state vector
function applyMatrix(matrix: Matrix2x2, state: StateVector): StateVector {
  return [
    matrix[0][0].multiply(state[0]).add(matrix[0][1].multiply(state[1])),
    matrix[1][0].multiply(state[0]).add(matrix[1][1].multiply(state[1]))
  ];
}

// Check if matrix is unitary
function isUnitary(matrix: Matrix2x2, tolerance: number = 1e-10): boolean {
  // Calculate U† × U
  const conjugateTranspose: Matrix2x2 = [
    [matrix[0][0].conjugate(), matrix[1][0].conjugate()],
    [matrix[0][1].conjugate(), matrix[1][1].conjugate()]
  ];
  
  const product = multiplyMatrices(conjugateTranspose, matrix);
  
  // Check if result is identity matrix
  const identity = [
    [new Complex(1), new Complex(0)],
    [new Complex(0), new Complex(1)]
  ] as Matrix2x2;
  
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const diff = product[i][j].re - identity[i][j].re;
      const diffIm = product[i][j].im - identity[i][j].im;
      if (Math.abs(diff) > tolerance || Math.abs(diffIm) > tolerance) {
        return false;
      }
    }
  }
  return true;
}

// Check if state is normalized
function isNormalized(state: StateVector, tolerance: number = 1e-10): boolean {
  const norm = state[0].magnitude() ** 2 + state[1].magnitude() ** 2;
  return Math.abs(norm - 1.0) < tolerance;
}

// Calculate probabilities
function calculateProbabilities(state: StateVector) {
  const prob0 = state[0].magnitude() ** 2;
  const prob1 = state[1].magnitude() ** 2;
  return { prob0, prob1 };
}

// Get identity matrix
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

function App() {
  const [isDark, setIsDark] = useState(true);
  const [operations, setOperations] = useState<GateOperation[]>([]);
  const [currentState, setCurrentState] = useState<StateVector>([new Complex(1), new Complex(0)]);
  const [compositeMatrix, setCompositeMatrix] = useState<Matrix2x2>(getIdentityMatrix());
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showProbabilities, setShowProbabilities] = useState(true);
  const [precision, setPrecision] = useState(3);

  // Save state to history
  const saveToHistory = (ops: GateOperation[], state: StateVector, matrix: Matrix2x2) => {
    const newState = { operations: ops, currentState: state, compositeMatrix: matrix };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Add gate operation
  const addGate = (gateName: keyof typeof GATES) => {
    const newOperation: GateOperation = {
      id: Date.now().toString(),
      gate: gateName,
      timestamp: Date.now()
    };
    
    const newOperations = [...operations, newOperation];
    
    // Apply gate to current state (right-to-left application)
    const gateMatrix = GATES[gateName];
    const newState = applyMatrix(gateMatrix, currentState);
    
    // Update composite matrix (multiply on the left for right-to-left application)
    const newCompositeMatrix = multiplyMatrices(gateMatrix, compositeMatrix);
    
    saveToHistory(newOperations, newState, newCompositeMatrix);
    setOperations(newOperations);
    setCurrentState(newState);
    setCompositeMatrix(newCompositeMatrix);
  };

  // Reset simulation
  const reset = () => {
    const initialState: StateVector = [new Complex(1), new Complex(0)];
    const initialMatrix = getIdentityMatrix();
    const initialOps: GateOperation[] = [];
    
    saveToHistory(initialOps, initialState, initialMatrix);
    setOperations(initialOps);
    setCurrentState(initialState);
    setCompositeMatrix(initialMatrix);
  };

  // Undo operation
  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setOperations(prevState.operations);
      setCurrentState(prevState.currentState);
      setCompositeMatrix(prevState.compositeMatrix);
    }
  };

  // Redo operation
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setOperations(nextState.operations);
      setCurrentState(nextState.currentState);
      setCompositeMatrix(nextState.compositeMatrix);
    }
  };

  // Remove operation
  const removeOperation = (operationId: string) => {
    const newOperations = operations.filter(op => op.id !== operationId);
    
    // Recalculate from scratch
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
  };

  // Export current state
  const exportState = () => {
    const data = {
      operations: operations.map(op => op.gate),
      finalState: {
        alpha: { re: currentState[0].re, im: currentState[0].im },
        beta: { re: currentState[1].re, im: currentState[1].im }
      },
      probabilities: calculateProbabilities(currentState),
      isNormalized: isNormalized(currentState),
      isUnitary: isUnitary(compositeMatrix)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantum-state.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Share functionality
  const shareState = async () => {
    const gateSequence = operations.map(op => op.gate).join('');
    const url = `${window.location.origin}${window.location.pathname}?gates=${gateSequence}`;
    
    if (navigator.share) {
      await navigator.share({
        title: 'Quantum Matrix State',
        text: `Quantum state after applying gates: ${gateSequence}`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  // Initialize from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gates = params.get('gates');
    if (gates) {
      // Apply gates from URL
      gates.split('').forEach(gate => {
        if (gate in GATES) {
          setTimeout(() => addGate(gate as keyof typeof GATES), 100);
        }
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
      {/* Header */}
      <header className={`${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-b px-4 py-4`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Quantum Simulator
              </h1>
            </div>
            <div className="text-sm opacity-70">
              Interactive quantum gate matrix operations
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowProbabilities(!showProbabilities)}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Toggle probability display"
            >
              <Eye className="h-5 w-5" />
            </button>
            
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className={`p-2 rounded-lg transition-colors ${
                historyIndex <= 0 
                  ? 'opacity-50 cursor-not-allowed' 
                  : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Undo"
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
              title="Redo"
            >
              <Redo className="h-5 w-5" />
            </button>
            
            <button
              onClick={reset}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Reset"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            
            <button
              onClick={exportState}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Export state"
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
              className={`p-2 rounded-l