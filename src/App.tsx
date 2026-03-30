import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchPokemonList,
  fetchPokemonDetails,
  PokemonListResult,
  PokemonDetails,
  GENERATIONS
} from './services/pokeApi';
import { getBestAvailableSet, getSetsForPokemon, SmogonMoveset } from './services/smogonApi';
import { calculateTeamWeaknesses, getPokemonMultiplier, ALL_TYPES_LIST } from './utils/typeMath';
import { t, Language } from './utils/i18n';
import sunImg from './resources/sun.png';
import moonImg from './resources/moon.png';
import { Search, Server, AlertTriangle, ShieldAlert, Swords } from 'lucide-react';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState('dark');
  const [generation, setGeneration] = useState(GENERATIONS[8]);
  const [format, setFormat] = useState('ou');
  const [pokemonList, setPokemonList] = useState<PokemonListResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const [team, setTeam] = useState<PokemonDetails[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<PokemonDetails | null>(null);

  const [movesets, setMovesets] = useState<Record<string, SmogonMoveset>>({});
  const [loadingSets, setLoadingSets] = useState(false);

  const [meta, setMeta] = useState<{
    format: string;
    gen: number;
    isOldGen: boolean;
  } | null>(null);

  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const REGION_RANGES: Record<string, [number, number]> = {
    kanto: [1, 151],
    johto: [152, 251],
    hoenn: [252, 386],
    sinnoh: [387, 493],
    unova: [494, 649],
    kalos: [650, 721],
    alola: [722, 809],
    galar: [810, 905],
    hisui: [899, 905],
    paldea: [906, 1025]
  };

  // Initial Data Load
  useEffect(() => {
    fetchPokemonList(generation.maxId).then(setPokemonList);
  }, [generation]);

  // Handler for adding/removing pokemon
  const addToTeam = async (pokemon: PokemonListResult) => {
    if (team.length >= 6) return;
    if (team.find(p => p.id === pokemon.id)) return;

    try {
      const details = await fetchPokemonDetails(pokemon.name);
      setTeam(prev => [...prev, details]);
    } catch (e) {
      console.error(e);
    }
  };

  const removeFromTeam = (index: number) => {
    setTeam(prev => prev.filter((_, i) => i !== index));
    if (selectedTeamMember?.id === team[index].id) {
      setSelectedTeamMember(null);
    }
  };

  // Fetch Smogon sets when selected team member or format changes
  useEffect(() => {
    if (!selectedTeamMember) {
      setMovesets({});
      setMeta(null);
      return;
    }

    setLoadingSets(true);

    getBestAvailableSet(
      generation.gen,
      format,
      selectedTeamMember.name
    ).then(result => {
      if (result) {
        setMovesets(result.sets);

        setMeta({
          format: result.formatUsed,
          gen: result.generationUsed,
          isOldGen: result.isFromPreviousGen
        });
      } else {
        setMovesets({});
        setMeta(null);
      }

      setLoadingSets(false);
    });

  }, [selectedTeamMember, format, generation]);

  const filteredList = useMemo(() => {
    return pokemonList.filter(p => {

      if (searchTerm && !p.name.includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (selectedRegion !== 'all') {
        const range = REGION_RANGES[selectedRegion];
        if (!range) return true;

        const [min, max] = range;
        if (p.id < min || p.id > max) return false;
      }

      if (selectedType !== 'all') {
        const cached = team.find(t => t.id === p.id);
        if (!cached) return false;

        const hasType = cached.types.some(t => t.type.name === selectedType);
        if (!hasType) return false;
      }

      return true;
    });
  }, [pokemonList, searchTerm, selectedRegion, selectedType, team]);

  // Apply body theme class
  useEffect(() => {
    if (theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
  }, [theme]);

  // Reset page when filtering or changing generation
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, generation]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = useMemo(() => {
    return filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredList, currentPage]);

  const teamWeaknessMatrix = useMemo(() => {
    const types = team.map(p => p.types.map(t => t.type.name));
    return calculateTeamWeaknesses(types);
  }, [team]);

  const criticalWeaknesses = Object.entries(teamWeaknessMatrix).filter(([_, count]) => count >= 3);

  const getTypeColor = (type: string) => `var(--type-${type})`;

  return (
    <div className="app-container">
      <header className="header glass-panel">
        <h1>
          <Server size={28} />
          <span>{t('appTitle', lang)}</span>
        </h1>

        <div className="controls">
          <button
            className="glass-button"
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <img src={sunImg} alt="Light Mode" style={{ width: 24, height: 24, objectFit: 'contain' }} />
            ) : (
              <img src={moonImg} alt="Dark Mode" style={{ width: 24, height: 24, objectFit: 'contain' }} />
            )}
          </button>

          <select
            className="glass-select"
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="ja">日本語</option>
          </select>

          <select
            className="glass-select"
            value={generation.gen}
            onChange={(e) => {
              const gen = GENERATIONS.find(g => g.gen === Number(e.target.value));
              if (gen) {
                setGeneration(gen);
                setTeam([]);
                setSelectedTeamMember(null);
              }
            }}
          >
            {GENERATIONS.map(g => (
              <option key={g.gen} value={g.gen}>{g.name}</option>
            ))}
          </select>

          <select
            className="glass-select"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="ou">{t('singlesLabel', lang)}</option>
            <option value="doublesou">{t('doublesLabel', lang)}</option>
            <option value="vgc">{t('vgcLabel', lang)}</option>
          </select>
        </div>
      </header>

      <main className="main-grid">
        {/* PC Box Panel (Search & Select) */}
        <section className="glass-panel pc-box animate-fade-in">
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--pc-text)', opacity: 0.4 }} />
            <input
              type="text"
              className="search-input"
              placeholder={t('searchPlaceholder', lang, { gen: generation.name })}
              style={{ paddingLeft: 38 }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>

              {/* TYPE FILTER */}
              <select
                className="glass-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">{t('typeAll', lang)}</option>
                {ALL_TYPES_LIST.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* REGION FILTER */}
              <select
                className="glass-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="all">{t('regionsAll', lang)}</option>

                {[
                  'kanto',
                  'johto',
                  'hoenn',
                  'sinnoh',
                  'unova',
                  'kalos',
                  'alola',
                  'galar',
                  'hisui',
                  'paldea'
                ].map(region => (
                  <option key={region} value={region}>
                    {t(region, lang)}
                  </option>
                ))}
              </select>

            </div>
          </div>
          <div className="box-grid">
            {paginatedList.map(p => (
              <div
                key={p.name}
                className={`box-cell ${team.find(t => t.id === p.id) ? 'selected' : ''}`}
                onClick={() => addToTeam(p)}
                title={p.name}
              >
                <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${p.id}.png`}
                  alt={p.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
                  }}
                />
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '6px 12px', background: currentPage === 1 ? 'transparent' : 'rgba(56, 189, 248, 0.2)', border: '1px solid var(--pc-border)', borderRadius: '6px', color: 'var(--pc-text)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
              >{t('prevBtn', lang)}</button>
              <span style={{ fontSize: '14px', color: 'var(--pc-text)' }}>
                {t('pageText', lang, { current: currentPage, total: totalPages })}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '6px 12px', background: currentPage === totalPages ? 'transparent' : 'rgba(56, 189, 248, 0.2)', border: '1px solid var(--pc-border)', borderRadius: '6px', color: 'var(--pc-text)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
              >{t('nextBtn', lang)}</button>
            </div>
          )}
        </section>

        {/* Team Roster Panel */}
        <section className="glass-panel team-roster">
          {[0, 1, 2, 3, 4, 5].map(i => {
            const member = team[i];
            return (
              <div
                key={i}
                className={`team-slot ${member ? 'filled animate-fade-in' : ''}`}
                onClick={() => member && setSelectedTeamMember(member)}
              >
                {member ? (
                  <>
                    <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFromTeam(i); }}>×</button>
                    <div className="pokeball-bg"></div>
                    <img
                      src={member.sprites.other["official-artwork"].front_default || member.sprites.front_default}
                      className="full-art"
                      alt={member.name}
                    />
                    <div className="pokemon-name">{member.name.replace('-', ' ')}</div>
                  </>
                ) : (
                  <>
                    <div className="team-slot-watermark" />
                    <span style={{ color: 'var(--pc-text)', opacity: 0.5, zIndex: 1, fontWeight: 'bold' }}>{t('slotText', lang, { n: i + 1 })}</span>
                  </>
                )}
              </div>
            );
          })}
        </section>

        {/* Analysis & Moveset Panel */}
        <section className="glass-panel analysis-panel">
          {selectedTeamMember ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* HEADER WITH CLOSE BUTTON */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${selectedTeamMember.id}.png`}
                    style={{ width: '64px', height: '64px', imageRendering: 'pixelated' }}
                  />
                  <div>
                    <h2 style={{ textTransform: 'capitalize', fontSize: '24px', marginBottom: '8px' }}>
                      {selectedTeamMember.name.replace('-', ' ')}
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {selectedTeamMember.types.map(t => (
                        <span key={t.type.name} className="type-badge" style={{ backgroundColor: getTypeColor(t.type.name) }}>
                          {t.type.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CLOSE BUTTON */}
                <button
                  onClick={() => setSelectedTeamMember(null)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--pc-border)',
                    borderRadius: '8px',
                    color: 'var(--pc-text)',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    fontSize: '16px',
                    opacity: 0.7
                  }}
                >
                  ✕
                </button>

              </div>

              {/* MOVESET PANEL */}
              <div style={{
                background: 'var(--pc-bg)',
                opacity: 0.9,
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--pc-border)'
              }}>

                <h3 style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '16px',
                  color: 'var(--pc-accent)'
                }}>
                  <Swords size={20} />
                  {t('smogonTitle', lang, { format: format.toUpperCase() })}
                </h3>

                {/* FALLBACK GEN NOTICE */}
                {meta?.isOldGen && (
                  <p style={{ color: '#facc15', fontSize: '12px', marginBottom: '8px' }}>
                    {t('fallbackGenNotice', lang, {
                      gen: meta.gen,
                      format: meta.format.toUpperCase()
                    })}
                  </p>
                )}

                {loadingSets ? (
                  <p style={{ color: 'var(--pc-text)', opacity: 0.6 }}>
                    {t('loadingSets', lang)}
                  </p>
                ) : Object.keys(movesets).length > 0 ? (

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {Object.entries(movesets).map(([setName, setDetails]) => (
                      <div key={setName} style={{ borderLeft: '2px solid var(--pc-accent)', paddingLeft: '12px' }}>

                        <h4 style={{ marginBottom: '8px' }}>{setName}</h4>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '8px',
                          fontSize: '14px'
                        }}>
                          <div>
                            <strong>{t('item', lang)}:</strong>
                            {Array.isArray(setDetails.item)
                              ? setDetails.item.join(' / ')
                              : (setDetails.item || 'None')}
                          </div>

                          <div>
                            <strong>{t('ability', lang)}:</strong>
                            {Array.isArray(setDetails.ability)
                              ? setDetails.ability.join(' / ')
                              : (setDetails.ability || 'Any')}
                          </div>

                          <div>
                            <strong>{t('nature', lang)}:</strong>
                            {Array.isArray(setDetails.nature)
                              ? setDetails.nature.join(' / ')
                              : (setDetails.nature || 'Any')}
                          </div>

                          {setDetails.evs && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <strong>{t('evs', lang)}:</strong>
                              {Object.entries(setDetails.evs)
                                .map(([stat, val]) => `${val} ${stat}`)
                                .join(' / ')}
                            </div>
                          )}

                          <div style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
                            <strong>{t('moves', lang)}:</strong>
                            <ul style={{ marginTop: '4px', paddingLeft: '16px' }}>
                              {setDetails.moves.map((m, i) => (
                                <li key={i}>
                                  {Array.isArray(m) ? m.join(' / ') : m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>

                ) : (
                  <p style={{ color: 'var(--pc-text)', opacity: 0.6 }}>
                    {t('noSets', lang)}
                  </p>
                )}
              </div>

            </div>
          ) : (
            <>
              {criticalWeaknesses.length > 0 && (
                <div className="alert-card animate-fade-in">
                  <AlertTriangle size={24} color="#f87171" style={{ flexShrink: 0 }} />
                  <div>
                    <h3>{t('criticalAlertTitle', lang)}</h3>
                    <p>{t('criticalAlertBody', lang, { count: criticalWeaknesses.length })}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {criticalWeaknesses.map(([type]) => (
                        <span key={type} className="type-badge" style={{ backgroundColor: getTypeColor(type) }}>
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                background: 'var(--pc-bg)',
                opacity: 0.9,
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--pc-border)',
                flex: 1
              }}>
                <h3 style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                  <ShieldAlert size={20} /> {t('teamWeaknesses', lang)}
                </h3>

                {team.length === 0 ? (
                  <p style={{
                    color: 'var(--pc-text)',
                    opacity: 0.6,
                    fontSize: '14px',
                    textAlign: 'center',
                    margin: '40px 10px'
                  }}>
                    {t('addPokemonPrompt', lang)}
                  </p>
                ) : (
                  <div className="tally-grid-container">
                    <div className="tally-grid">
                      {ALL_TYPES_LIST.map(type => (
                        <div key={type} className="tally-row">
                          <span className="type-icon" style={{ backgroundColor: getTypeColor(type) }}>
                            {type.slice(0, 3)}
                          </span>

                          {[0, 1, 2, 3, 4, 5].map(slotIdx => {
                            const p = team[slotIdx];
                            if (!p) return <div key={slotIdx} className="tally-mark" />;

                            const mult = getPokemonMultiplier(p.types.map(t => t.type.name), type);
                            let tallyClass = "tally-mark";

                            if (mult > 1) tallyClass += " weak";
                            else if (mult < 1) tallyClass += " resist";

                            return (
                              <div
                                key={slotIdx}
                                className={tallyClass}
                                title={`${p.name} vs ${type}: x${mult}`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '16px',
        fontSize: '13px',
        color: 'var(--pc-text)',
        opacity: 0.5,
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}>
        {t('madeWith', lang)}
      </footer>
    </div>
  );
};

export default App;
