'use client';

import React, { useState } from 'react';
import { SaveParser, PokemonData } from '@/lib/saveParser';

export default function AscensionPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pokemonList, setPokemonList] = useState<PokemonData[]>([]);
    const [loading, setLoading] = useState(false);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = event.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setLoading(true);

        const arrayBuffer = await uploadedFile.arrayBuffer();
        const parser = new SaveParser(arrayBuffer);
        
        // Find level 250 pokemon
        const eligiblePokemon = parser.findMaxLevelPokemon();
        setPokemonList(eligiblePokemon);
        setLoading(false);
    };

    const handleAscend = async (pokemon: PokemonData) => {
        if (!file) return;

        setLoading(true);
        const arrayBuffer = await file.arrayBuffer();
        const parser = new SaveParser(arrayBuffer);
        
        const newBuffer = parser.ascendPokemon(pokemon.boxIndex, pokemon.slotIndex);
        
        // Create a downloadable blob for the new save file
        const blob = new Blob([newBuffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace('.srm', '_ascended.srm');
        a.click();
        URL.revokeObjectURL(url);
        
        alert(`${pokemon.name} ha ascendido a Prestigio ${pokemon.prestige + 1}! Guarda tu nuevo archivo .srm`);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        Ascensión Dimensional
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Alcanza el pináculo del poder. Los Pokémon nivel 250 pueden ser reseteados al nivel 5 a cambio de un nivel de Prestigio, otorgando bonos permanentes de +5% a todos sus stats.
                    </p>
                </div>

                {/* Upload Section */}
                <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-xl p-10 hover:border-purple-500 transition-colors">
                        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <p className="text-gray-300 mb-2">Sube tu archivo <span className="font-mono text-purple-400">.srm</span> para comenzar</p>
                        <input 
                            type="file" 
                            accept=".srm" 
                            onChange={handleFileUpload} 
                            className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 transition-all cursor-pointer"
                        />
                    </div>
                </div>

                {/* Eligible Pokemon List */}
                {file && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold border-b border-gray-700 pb-2">Pokémon Elegibles</h2>
                        
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                            </div>
                        ) : pokemonList.length === 0 ? (
                            <div className="bg-gray-800 p-6 rounded-xl text-center text-gray-400">
                                No se encontraron Pokémon nivel 250 en tu partida.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {pokemonList.map((mon, idx) => (
                                    <div key={idx} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-purple-500 transition-all group shadow-lg">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{mon.name}</h3>
                                                <p className="text-sm text-gray-400">Box {mon.boxIndex + 1} - Slot {mon.slotIndex + 1}</p>
                                            </div>
                                            <div className="bg-purple-900/50 px-3 py-1 rounded-full border border-purple-500/30">
                                                <span className="text-purple-300 text-sm font-semibold">Prestigio {mon.prestige}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gray-900 rounded-lg p-4 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Nivel Actual</span>
                                                <span className="text-white font-mono">{mon.level}</span>
                                            </div>
                                            <div className="flex justify-between text-sm mt-2">
                                                <span className="text-gray-400">Bono de Stats Actual</span>
                                                <span className="text-green-400 font-mono">+{mon.prestige * 5}%</span>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => handleAscend(mon)}
                                            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-500 hover:to-pink-500 transform hover:scale-[1.02] transition-all shadow-lg shadow-purple-500/25"
                                        >
                                            Ascender a Prestigio {mon.prestige + 1}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
