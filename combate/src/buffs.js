import state from './state.js';

function memberBuffs(teamKey, memberIndex) {
  return state.teams[teamKey].members[memberIndex]?.buffs ?? [];
}

export function applyBuff(teamKey, memberIndex, buffDef) {
  const list = memberBuffs(teamKey, memberIndex);
  const existing = list.find(b => b.id === buffDef.id);
  if (existing) {
    existing.turnsLeft = 4;
    return;
  }
  if (buffDef.stat === 'precision' || buffDef.stat === 'evasion') {
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].stat === buffDef.stat) {
        list.splice(i, 1);
      }
    }
  }
  list.push({
    id: buffDef.id,
    name: buffDef.name,
    stat: buffDef.stat,
    value: buffDef.value,
    turnsLeft: 4,
    active: false
  });
}

export function processBuffs() {
  const expired = [];
  ['A', 'B'].forEach(teamKey => {
    state.teams[teamKey].members.forEach((member, idx) => {
      if (!member || member.currentHp <= 0) return;
      const list = member.buffs;
      for (let i = list.length - 1; i >= 0; i--) {
        const b = list[i];
        b.turnsLeft--;
        b.active = b.turnsLeft > 0;
        if (b.turnsLeft <= 0) {
          expired.push({ teamKey, memberIndex: idx, buffName: b.name });
          list.splice(i, 1);
        }
      }
    });
  });
  return expired;
}

export function getMultiplier(teamKey, memberIndex, stat) {
  const list = memberBuffs(teamKey, memberIndex);
  let sum = 0;
  list.forEach(b => { if (b.active && b.stat === stat) sum += b.value; });
  return 1 + sum;
}

export function getFlatBuffSum(teamKey, memberIndex, stat) {
  const list = memberBuffs(teamKey, memberIndex);
  let sum = 0;
  list.forEach(b => { if (b.active && b.stat === stat) sum += b.value; });
  return sum;
}

export function getPrecision(teamKey, memberIndex, basePrecision) {
  const list = memberBuffs(teamKey, memberIndex);
  const precBuff = list.find(b => b.active && b.stat === 'precision');
  if (!precBuff) return basePrecision;
  if (precBuff.value >= 1) return 100;
  return Math.round(basePrecision * Math.abs(precBuff.value));
}

export function getEvasion(teamKey, memberIndex, baseEvasion) {
  const list = memberBuffs(teamKey, memberIndex);
  const evaBuff = list.find(b => b.active && b.stat === 'evasion');
  if (!evaBuff) return baseEvasion;
  if (evaBuff.value === 0) return 0;
  return Math.min(100, baseEvasion + evaBuff.value);
}
