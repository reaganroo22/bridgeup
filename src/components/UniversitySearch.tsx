"use client";

import { useState, useRef, useEffect } from 'react';
import { universities } from '@/data/universities';

interface UniversitySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function UniversitySearch({
  value,
  onChange,
  placeholder = "Search for your university...",
  className = "",
  required = false
}: UniversitySearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredUniversities = universities.filter(uni =>
    uni.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10); // Show max 10 results

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredUniversities.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredUniversities.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredUniversities[highlightedIndex]) {
          selectUniversity(filteredUniversities[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const selectUniversity = (university: string) => {
    setSearchTerm(university);
    onChange(university);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (!searchTerm) {
      setSearchTerm('');
    }
  };

  // Set search term when value changes externally
  useEffect(() => {
    if (value !== searchTerm) {
      setSearchTerm(value || '');
    }
  }, [value, searchTerm]);

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C147E9] focus:border-[#C147E9] text-base text-gray-900 bg-white ${className}`}
        required={required}
        autoComplete="off"
      />
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto text-gray-900">
          {filteredUniversities.length > 0 ? (
            <>
              {filteredUniversities.map((university, index) => (
                <div
                  key={university}
                  className={`px-3 py-2 cursor-pointer text-sm text-gray-900 ${
                    index === highlightedIndex
                      ? 'bg-[#C147E9] !text-white'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => selectUniversity(university)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {university}
                </div>
              ))}
              {searchTerm && !universities.some(uni => 
                uni.toLowerCase() === searchTerm.toLowerCase()
              ) && (
                <div className="px-3 py-2 text-xs text-gray-500 border-t">
                  Don't see your school? Select "Other" and we'll add it!
                </div>
              )}
            </>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No universities found. Try "Other" for unlisted schools.
            </div>
          )}
        </div>
      )}
    </div>
  );
}