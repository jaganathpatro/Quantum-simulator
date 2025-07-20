import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, RotateCcw, Download, Share2, Undo, Redo, Calculator, Eye, Settings, CheckCircle, AlertCircle } from 'lucide-react';

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

// Quantum gate definitions - mathematically verified
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

const GATE_COLORS = {
  H: 'from-blue-500 to-cyan-500',
  X: 'from-red-500 to-pink-500',
  Y: 'from-green-500 to-emerald-500',
  Z: 'from-purple-500 to-violet-500',
  S: 'from-orange-500 to-yellow-500',
  T: 'from-indigo-500 to-blue-500'
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

// Matrix display component
const MatrixDisplay: React.FC<{
  matrix: Matrix2x2;
  title: string;
  precision: number;
  isDark: boolean;
  className?: string;
}> = ({ matrix, title, precision, isDark, className = '' }) => (
  <div className={`${className} ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${
    isDark ? 'border-gray-700' : 'border-gray-200'
  }`}>
    <h3 className="text-lg font-semibold mb-3 text-center">{title}</h3>
    <div className="font-mono text-sm">
      <div className="flex items-center justify-center space-x-2">
        <span className="text-xl">[</span>
        <div className="grid grid-cols-2 gap-2">
          {matrix.map((row, i) =>
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className={`p-2 rounded text-center min-w-[80px] ${
                  isDark ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <span className="text-blue-400">{cell.re.toFixed(precision)}</span>
                {cell.im !== 0 && (
                  <>
                    <span className="mx-1">{cell.im >= 0 ? '+' : '-'}</span>
                    <span className="text-red-400">{Math.abs(cell.im).toFixed(precision)}i</span>
                  </>
                )}
              </div>
            ))
          )}
        </div>
        <span className="text-xl">]</span>
      </div>
    </div>
  </div>
);

// State vector display component
const StateVectorDisplay: React.FC<{
  state: StateVector;
  precision: number;
  isDark: boolean;
  showProbabilities: boolean;
}> = ({ state, precision, isDark, showProbabilities }) => {
  const probabilities = calculateProbabilities(state);
  
  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <h3 className="text-lg font-semibold mb-3 text-center">Current State Vector</h3>
      
      <div className="font-mono text-sm mb-4">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-xl">|ψ⟩ = [</span>
          <div className="space-y-2">
            <div className={`p-2 rounded text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <span className="text-blue-400">{state[0].re.toFixed(precision)}</span>
              {state[0].im !== 0 && (
                <>
                  <span className="mx-1">{state[0].im >= 0 ? '+' : '-'}</span>
                  <span className="text-red-400">{Math.abs(state[0].im).toFixed(precision)}i</span>
                </>
              )}
            </div>
            <div className={`p-2 rounded text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <span className="text-blue-400">{state[1].re.toFixed(precision)}</span>
              {state[1].im !== 0 && (
                <>
                  <span className="mx-1">{state[1].im >= 0 ? '+' : '-'}</span>
                  <span className="text-red-400">{Math.abs(state[1].im).toFixed(precision)}i</span>
                </>
              )}
            </div>
          </div>
          <span className="text-xl">]</span>
        </div>
      </div>

      {showProbabilities && (
        <div className="space-y-3">
          <h4 className="font-semibold text-center">Measurement Probabilities</h4>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-sm w-8">|0⟩:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${probabilities.prob0 * 100}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                  {(probabilities.prob0 * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm w-8">|1⟩:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${probabilities.prob1 * 100}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                  {(probabilities.prob1 * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Gate card component
const GateCard: React.FC<{
  gateName: keyof typeof GATES;
  onSelect: (gate: keyof typeof GATES) => void;
  precision: number;
  isDark: boolean;
}> = ({ gateName, onSelect, precision, isDark }) => {
  const matrix = GATES[gateName];
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={() => onSelect(gateName)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} 
        rounded-lg p-4 border transition-all duration-300 transform ${
        isHovered ? 'scale-105 shadow-lg' : 'scale-100'
      } ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
      aria-label={`Apply ${gateName} gate: ${GATE_DESCRIPTIONS[gateName]}`}
    >
      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${GATE_COLORS[gateName]} 
        flex items-center justify-center text-white font-bold text-lg mb-2 mx-auto`}>
        {gateName}
      </div>
      
      <div className="font-mono text-xs mb-2">
        <div className="grid grid-cols-2 gap-1">
          {matrix.map((row, i) =>
            row.map((cell, j) => (
              <div key={`${i}-${j}`} className="text-center">
                <span className="text-blue-400">{cell.re.toFixed(2)}</span>
                {cell.im !== 0 && (
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
      
      <div className="text-xs opacity-70 text-center">
        {GATE_DESCRIPTIONS[gateName]}
      </div>
    </button>
  );
};

// Operation sequence component
const OperationSequence: React.FC<{
  operations: GateOperation[];
  onRemove: (id: string) => void;
  isDark: boolean;
}> = ({ operations, onRemove, isDark }) => (
  <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${
    isDark ? 'border-gray-700' : 'border-gray-200'
  }`}>
    <h3 className="text-lg font-semibold mb-3 text-center">Gate Sequence (Right-to-Left Application)</h3>
    
    {operations.length === 0 ? (
      <div className="text-center py-8 opacity-60">
        <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No gates applied yet</p>
        <p className="text-sm">Click a gate below to start</p>
      </div>
    ) : (
      <div className="flex items-center justify-center space-x-2 flex-wrap gap-2">
        <span className="font-mono">|ψ₀⟩</span>
        {operations.map((operation, index) => (
          <React.Fragment key={operation.id}>
            <span className="text-gray-400">→</span>
            <button
              onClick={() => onRemove(operation.id)}
              className={`w-8 h-8 rounded-full bg-gradient-to-r ${GATE_COLORS[operation.gate]} 
                flex items-center justify-center text-white font-bold text-sm
                hover:scale-110 transition-transform duration-200 relative group`}
              title={`Remove ${operation.gate} gate`}
              aria-label={`Remove ${operation.gate} gate from sequence`}
            >
              {operation.gate}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Remove
              </div>
            </button>
            <span className="font-mono text-sm">|ψ₊{index + 1}⟩</span>
          </React.Fragment>
        ))}
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
  const [precision, setPrecision] = useState(3);
  const [showSettings, setShowSettings] = useState(false);

  // Save state to history
  const saveToHistory = useCallback((ops: GateOperation[], state: StateVector, matrix: Matrix2x2) => {
    const newState = { operations: [...ops], currentState: [...state] as StateVector, compositeMatrix: matrix.map(row => [...row]) as Matrix2x2 };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 50) newHistory.shift(); // Limit history size
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Add gate operation
  const addGate = useCallback((gateName: keyof typeof GATES) => {
    const newOperation: GateOperation = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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

  // Remove operation
  const removeOperation = useCallback((operationId: string) => {
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
  }, [operations, saveToHistory]);

  // Export current state
  const exportState = useCallback(() => {
    const data = {
      operations: operations.map(op => op.gate),
      finalState: {
        alpha: { re: currentState[0].re, im: currentState[0].im },
        beta: { re: currentState[1].re, im: currentState[1].im }
      },
      probabilities: calculateProbabilities(currentState),
      isNormalized: isNormalized(currentState),
      isUnitary: isUnitary(compositeMatrix),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum-state-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [operations, currentState, compositeMatrix]);

  // Share functionality
  const shareState = useCallback(async () => {
    const gateSequence = operations.map(op => op.gate).join('');
    const url = `${window.location.origin}${window.location.pathname}?gates=${gateSequence}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Quantum Matrix State',
          text: `Quantum state after applying gates: ${gateSequence || 'Initial state'}`,
          url: url
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  }, [operations]);

  // Keyboard shortcuts
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
  }, [undo, redo, reset, exportState, addGate]);

  // Initialize from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gates = params.get('gates');
    if (gates && operations.length === 0) {
      // Apply gates from URL with delay to ensure proper state updates
      const gateArray = gates.split('').filter(gate => gate in GATES);
      gateArray.forEach((gate, index) => {
        setTimeout(() => {
          addGate(gate as keyof typeof GATES);
        }, index * 100);
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
      } border-b px-4 py-4 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Quantum Matrix Simulator
              </h1>
            </div>
            <div className="hidden md:block text-sm opacity-70">
              Interactive quantum gate matrix operations
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
              title="Toggle probability display"
              aria-label="Toggle probability display"
            >
              <Eye className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings ? 'bg-blue-500 text-white' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Settings"
              aria-label="Open settings"
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
              aria-label="Undo last operation"
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
              aria-label="Redo last undone operation"
            >
              <Redo className="h-5 w-5" />
            </button>
            
            <button
              onClick={reset}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Reset (Ctrl+R)"
              aria-label="Reset to initial state"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            
            <button
              onClick={exportState}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Export state (Ctrl+S)"
              aria-label="Export current quantum state"
            >
              <Download className="h-5 w-5" />
            </button>
            
            <button
              onClick={shareState}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Share state"
              aria-label="Share current quantum state"
            >
              <Share2 className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Toggle theme"
              aria-label="Toggle dark/light theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-4`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Precision:</label>
                <select
                  value={precision}
                  onChange={(e) => setPrecision(Number(e.target.value))}
                  className={`rounded px-2 py-1 text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                  } border`}
                  aria-label="Select decimal precision"
                >
                  <option value={1}>1 decimal</option>
                  <option value={2}>2 decimals</option>
                  <option value={3}>3 decimals</option>
                  <option value={4}>4 decimals</option>
                  <option value={5}>5 decimals</option>
                </select>
              </div>
              
              <div className="text-xs opacity-70">
                <kbd className="px-1 rounded bg-gray-200 dark:bg-gray-700">H</kbd>,
                <kbd className="px-1 rounded bg-gray-200 dark:bg-gray-700 ml-1">X</kbd>,
                <kbd className="px-1 rounded bg-gray-200 dark:bg-gray-700 ml-1">Y</kbd>,
                <kbd className="px-1 rounded bg-gray-200 dark:bg-gray-700 ml-1">Z</kbd>,
                <kbd className="px-1 rounded bg-gray-200 dark:bg-gray-700 ml-1">S</kbd>,
                <kbd className="px-1 rounded bg-gray-200 dark:bg-gray-700 ml-1">T</kbd> for gates
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Gate Palette */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-center">Quantum Gates</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(Object.keys(GATES) as Array<keyof typeof GATES>).map(gateName => (
              <GateCard
                key={gateName}
                gateName={gateName}
                onSelect={addGate}
                precision={precision}
                isDark={isDark}
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

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: State Vector */}
          <div className="lg:col-span-1">
            <StateVectorDisplay
              state={currentState}
              precision={precision}
              isDark={isDark}
              showProbabilities={showProbabilities}
            />
          </div>

          {/* Right Columns: Matrices */}
          <div className="lg:col-span-2 space-y-6">
            <MatrixDisplay
              matrix={compositeMatrix}
              title="Composite Transformation Matrix"
              precision={precision}
              isDark={isDark}
            />
            
            {/* Validation Status */}
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
                    <div className="text-sm opacity-70">
                      ||ψ||² = {(currentState[0].magnitude() ** 2 + currentState[1].magnitude() ** 2).toFixed(6)}
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
            </div>
          </div>
        </div>

        {/* Operation Details */}
        {operations.length > 0 && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-3 text-center">Operation Analysis</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Applied Gates:</h4>
                <div className="space-y-1 text-sm font-mono">
                  {operations.map((op, index) => (
                    <div key={op.id} className="flex items-center space-x-2">
                      <span className="opacity-60">{index + 1}.</span>
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${GATE_COLORS[op.gate]} 
                        flex items-center justify-center text-white text-xs font-bold`}>
                        {op.gate}
                      </div>
                      <span>{GATE_DESCRIPTIONS[op.gate]}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Quantum Properties:</h4>
                <div className="space-y-1 text-sm">
                  <div>Gates applied: {operations.length}</div>
                  <div>Current amplitude |α|: {currentState[0].magnitude().toFixed(precision)}</div>
                  <div>Current amplitude |β|: {currentState[1].magnitude().toFixed(precision)}</div>
                  <div>Phase difference: {((currentState[1].phase() - currentState[0].phase()) * 180 / Math.PI).toFixed(1)}°</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-sm opacity-60 py-4">
          <p>Quantum Matrix Simulator - Educational quantum computing tool</p>
          <p>Gates apply right-to-left: Mₙ × ... × M₂ × M₁ × |ψ⟩</p>
        </footer>
      </div>
    </div>
  );
}

export default App;