import { calculate, Generations, Pokemon, Move } from '@smogon/calc';

const gen = Generations.get(9);

// Debounce function to limit requests
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

// Format Pokémon object properly
const createPokemon = (gen, name, role) => {
  if (!name) return null; // Ensure valid input
  return new Pokemon(gen, name, {
    item: role === 'attacker' ? 'Choice Specs' : 'Eviolite',
    nature: role === 'attacker' ? 'Timid' : 'Calm',
    evs: role === 'attacker' ? { spa: 252 } : { hp: 252, spd: 252 },
    boosts: role === 'attacker' ? { spa: 1 } : {},
  });
};

// Store selected Pokémon names
let attackerName = '';
let defenderName = '';
let availableMoves = [];

// Fetch Pokémon details
const fetchPokemon = async (name, role) => {
  try {
    if (!name.trim()) throw new Error('No Pokémon name provided');

    const url = `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`;
    console.log(`Fetching ${role}:`, url);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Pokémon "${name}" not found`);

    const {
      name: rawName,
      sprites,
      types,
      id,
      stats,
      moves,
    } = await res.json();

    const pokemon = {
      name: rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase(),
      image: sprites?.front_default || 'fallback.png',
      type: types?.map((t) => t.type.name).join(', ') || 'Unknown',
      id,
      stats,
      moves,
    };

    displayPokemon(pokemon, role);

    if (role === 'attacker') {
      availableMoves = moves.map((m) => m.move.name);
      populateMoves(availableMoves);
      attackerName = pokemon.name;
    } else {
      defenderName = pokemon.name;
    }
  } catch (error) {
    console.error(`Error fetching ${role}:`, error.message);
    document.getElementById(`${role}-details`).innerHTML =
      `<p style="color:red;">${error.message}</p>`;
  }
};

// Display Pokémon details
const displayPokemon = (pokemon, role) => {
  const detailsEl = document.getElementById(`${role}-details`);
  detailsEl.innerHTML = `
    <h2>${pokemon.name}</h2>
    <img src="${pokemon.image}" alt="${pokemon.name}" />
    <p><strong>Type:</strong> ${pokemon.type}</p>
    <p><strong>ID:</strong> ${pokemon.id}</p>
    <h3>Stats</h3>
    <ul>
      ${pokemon.stats
        .map(
          (stat) =>
            `<li><strong>${stat.stat.name}:</strong> ${stat.base_stat}</li>`,
        )
        .join('')}
    </ul>
  `;
};

// Populate move dropdown
const populateMoves = (moves) => {
  const movesList = document.getElementById('pokemon-moves');
  movesList.innerHTML = '<option value="">Select a move</option>'; // Reset
  const sortedMoves = moves.sort();
  sortedMoves.forEach((move) => {
    const moveEl = document.createElement('option');
    moveEl.value = move;
    moveEl.textContent = move;
    movesList.appendChild(moveEl);
  });
};

// Perform damage calculation
const calculateDamage = () => {
  const selectedMove = document.getElementById('pokemon-moves').value;

  if (!attackerName || !defenderName || !selectedMove) {
    console.error('Missing input for calculation');
    alert('Please select an attacker, defender, and move before calculating.');
    return;
  }

  const attacker = createPokemon(gen, attackerName, 'attacker');
  const defender = createPokemon(gen, defenderName, 'defender');
  const move = new Move(gen, selectedMove);

  if (!attacker || !defender) {
    console.error('Failed to create Pokémon objects');
    return;
  }

  const result = calculate(gen, attacker, defender, move);
  console.log('Calculation result:', result);

  if (!result || !result.damage) {
    console.error('Calculation failed.');
    return;
  }

  const damageEl = document.getElementById('damage');
  const rollEl = document.getElementById('roll');

  damageEl.innerText = `Damage: ${result.damage ? result.damage[0] + ' - ' + result.damage[result.damage.length - 1] : 'N/A'}`;

  const defenderHp = result.defender?.originalCurHP || 1;
  const damageRangeMin = (
    (result?.damage?.[0] / defenderHp) * 100 || 0
  ).toFixed(2);
  const damageRangeMax = (
    (result?.damage?.slice(-1)[0] / defenderHp) * 100 || 0
  ).toFixed(2);

  rollEl.innerText = `Damage Range: ${damageRangeMin}% - ${damageRangeMax}%`;
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-attacker-input').addEventListener(
    'input',
    debounce(() => {
      const name = document
        .getElementById('search-attacker-input')
        .value.trim();
      if (name) fetchPokemon(name, 'attacker');
    }, 300),
  );

  document.getElementById('search-defender-input').addEventListener(
    'input',
    debounce(() => {
      const name = document
        .getElementById('search-defender-input')
        .value.trim();
      if (name) fetchPokemon(name, 'defender');
    }, 300),
  );

  document
    .getElementById('pokemon-moves')
    .addEventListener('change', calculateDamage);
});
