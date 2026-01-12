import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { searchAddress, getPlaceDetails } from '../services/map';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: string, coords: { lat: number; lng: number }) => void;
  placeholder?: string;
}

export const AddressAutocomplete = ({ value, onChange, onSelect, placeholder }: Props) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce search otimizado
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length > 2 && showSuggestions) {
        setLoading(true);
        try {
            const results = await searchAddress(value);
            setSuggestions(results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 600); 

    return () => clearTimeout(timer);
  }, [value, showSuggestions]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = async (item: any) => {
    onChange(item.description);
    setShowSuggestions(false);
    setSuggestions([]);

    let coords = item.coords;
    
    if (!coords && item.placeId) {
        setLoading(true); 
        coords = await getPlaceDetails(item.placeId);
        setLoading(false);
    }

    if (coords) {
        onSelect(item.description, coords);
    } else {
        alert("Não foi possível obter a localização exata deste endereço.");
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative group">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder || "Digite o endereço"}
          className="w-full p-3.5 pl-10 bg-gray-50 border border-transparent focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-medium text-gray-800 shadow-sm group-hover:bg-white group-hover:shadow-md placeholder:text-gray-400 text-sm"
        />
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${loading ? 'text-orange-500' : 'text-gray-400 group-focus-within:text-orange-500'}`}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
        </div>
      </div>

      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-slide-up max-h-64 overflow-y-auto scrollbar-hide">
          
          {/* Mensagem de busca inicial se não houver sugestões prévias */}
          {loading && suggestions.length === 0 && (
             <div className="p-4 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={14} /> Buscando endereços...
             </div>
          )}

          {/* Lista de Sugestões com efeito Ghost/Opacity ao recarregar */}
          <div className={`transition-opacity duration-300 ${loading ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'}`}>
              {suggestions.map((item) => (
                <div
                  key={item.placeId}
                  onClick={() => handleSelect(item)}
                  className="flex items-center gap-3 p-3.5 hover:bg-orange-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className="bg-gray-100 p-2 rounded-full text-gray-500 flex-shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div className="truncate flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.description.split(',')[0]}</p>
                    <p className="text-xs text-gray-400 truncate">{item.description}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};