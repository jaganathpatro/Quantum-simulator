import React from 'react';

interface GateOperation {
  id: string;
  gate: keyof typeof GATE_COLORS;
  timestamp: number;
}

const GATE_COLORS = {
  H: 'from-blue-500 to-cyan-500',
  X: 'from-red-500 to-pink-500',
  Y: 'from-green-500 to-emerald-500',
  Z: 'from-purple-500 to-violet-500',
  S: 'from-orange-500 to-yellow-500',
  T: 'from-indigo-500 to-blue-500',
  'S†': 'from-orange-400 to-yellow-400',
  'T†': 'from-indigo-400 to-blue-400'
};

interface QuantumCircuitProps {
  operations: GateOperation[];
  isDark: boolean;
  onRemove: (id: string) => void;
  className?: string;
}

const QuantumCircuit: React.FC<QuantumCircuitProps> = ({ 
  operations, 
  isDark, 
  onRemove, 
  className = '' 
}) => {
  return (
    <div className={`${className} ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <h3 className="text-lg font-semibold mb-4 text-center">Quantum Circuit</h3>
      
      <div className="relative">
        {/* Quantum wire */}
        <div className={`h-0.5 w-full ${isDark ? 'bg-gray-600' : 'bg-gray-400'} absolute top-1/2 transform -translate-y-1/2`} />
        
        {/* Initial state */}
        <div className="flex items-center space-x-4 relative z-10">
          <div className={`px-3 py-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'} font-mono text-sm`}>
            |0⟩
          </div>
          
          {/* Gates */}
          <div className="flex items-center space-x-2 flex-1">
            {operations.length === 0 ? (
              <div className="flex-1 text-center py-4 opacity-60">
                <div className="text-sm">No gates applied</div>
                <div className="text-xs mt-1">Circuit is empty</div>
              </div>
            ) : (
              operations.map((operation, index) => (
                <div key={operation.id} className="flex items-center space-x-2">
                  <button
                    onClick={() => onRemove(operation.id)}
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${GATE_COLORS[operation.gate]} 
                      flex items-center justify-center text-white font-bold text-sm
                      hover:scale-110 transition-all duration-200 relative group shadow-lg`}
                    title={`Remove ${operation.gate} gate`}
                  >
                    {operation.gate}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Click to remove
                    </div>
                  </button>
                  {index < operations.length - 1 && (
                    <div className={`w-4 h-0.5 ${isDark ? 'bg-gray-600' : 'bg-gray-400'}`} />
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Final state */}
          <div className={`px-3 py-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'} font-mono text-sm`}>
            |ψ⟩
          </div>
        </div>
      </div>
      
      {operations.length > 0 && (
        <div className="mt-4 text-xs text-center opacity-70">
          Circuit depth: {operations.length} | Gates applied left to right
        </div>
      )}
    </div>
  );
};

export default QuantumCircuit;