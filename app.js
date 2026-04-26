const baseRoster = {
  teamA: [
    {
      id: "a1",
      name: "蒼刃シオン",
      role: "アタッカー",
      hp: 120,
      attack: 28,
      defense: 8,
      speed: 17,
      ai: "aggressive",
      specialUsed: false,
    },
    {
      id: "a2",
      name: "光癒ミラ",
      role: "ヒーラー",
      hp: 95,
      attack: 16,
      defense: 10,
      speed: 14,
      ai: "support",
      specialUsed: false,
    },
  ],
  teamB: [
    {
      id: "b1",
      name: "黒盾ヴァル",
      role: "タンク",
      hp: 140,
      attack: 20,
      defense: 14,
      speed: 10,
      ai: "tank",
      specialUsed: false,
    },
    {
      id: "b2",
      name: "雷撃ノア",
      role: "スナイパー",
      hp: 88,
      attack: 30,
      defense: 6,
      speed: 18,
      ai: "aggressive",
      specialUsed: false,
    },
  ],
};

const arenaBuff = {
  ruins: { attackMultiplier: 1, healMultiplier: 1, label: "古代遺跡" },
  volcano: { attackMultiplier: 1.15, healMultiplier: 0.9, label: "火山地帯" },
  forest: { attackMultiplier: 0.95, healMultiplier: 1.25, label: "深緑の聖域" },
};

const arenaEl = document.getElementById("arena");
const roundLimitEl = document.getElementById("roundLimit");
const runBattleBtn = document.getElementById("runBattleBtn");
const resetBtn = document.getElementById("resetBtn");
const winnerText = document.getElementById("winnerText");
const battleLog = document.getElementById("battleLog");
const teamAStatus = document.getElementById("teamAStatus");
const teamBStatus = document.getElementById("teamBStatus");

let state = createInitialState();

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createInitialState() {
  return {
    teamA: clone(baseRoster.teamA),
    teamB: clone(baseRoster.teamB),
    turn: 1,
    logs: [],
    winner: null,
  };
}

function aliveMembers(team) {
  return team.filter((m) => m.hp > 0);
}

function randomOf(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pushLog(text) {
  state.logs.push(text);
}

function applyDamage(attacker, defender, multiplier = 1) {
  const variance = 0.85 + Math.random() * 0.3;
  const raw = attacker.attack * multiplier * variance;
  const reduced = raw - defender.defense * 0.7;
  const dmg = Math.max(4, Math.round(reduced));
  defender.hp = Math.max(0, defender.hp - dmg);
  return dmg;
}

function heal(target, power) {
  const amount = Math.round(power * (0.9 + Math.random() * 0.2));
  target.hp = Math.min(target.maxHp, target.hp + amount);
  return amount;
}

function selectAction(actor, allies, enemies, buffs) {
  if (actor.ai === "support") {
    const wounded = allies.filter((a) => a.hp > 0 && a.hp / a.maxHp < 0.65);
    if (wounded.length) {
      return { type: "heal", target: wounded.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] };
    }
  }

  if (!actor.specialUsed && actor.hp / actor.maxHp < 0.45) {
    return { type: "special", target: randomOf(aliveMembers(enemies)) };
  }

  if (actor.ai === "tank") {
    const enemyHighestAttack = aliveMembers(enemies).sort((a, b) => b.attack - a.attack)[0];
    return { type: "attack", target: enemyHighestAttack };
  }

  if (actor.ai === "aggressive" && Math.random() < 0.35) {
    return { type: "special", target: randomOf(aliveMembers(enemies)) };
  }

  return { type: "attack", target: randomOf(aliveMembers(enemies)) };
}

function performAction(actor, allies, enemies, buffs) {
  if (actor.hp <= 0) return;
  const action = selectAction(actor, allies, enemies, buffs);

  if (action.type === "heal") {
    const amount = heal(action.target, 24 * buffs.healMultiplier);
    pushLog(`${actor.name} が ${action.target.name} を ${amount} 回復した。`);
    return;
  }

  if (action.type === "special" && !actor.specialUsed) {
    actor.specialUsed = true;
    const damage = applyDamage(actor, action.target, 1.6 * buffs.attackMultiplier);
    pushLog(`✨ ${actor.name} の必殺！ ${action.target.name} に ${damage} ダメージ。`);
    return;
  }

  const damage = applyDamage(actor, action.target, 1 * buffs.attackMultiplier);
  pushLog(`${actor.name} の攻撃。${action.target.name} に ${damage} ダメージ。`);
}

function initializeMaxHp() {
  for (const team of [state.teamA, state.teamB]) {
    for (const member of team) {
      member.maxHp = member.hp;
    }
  }
}

function runBattle() {
  state = createInitialState();
  initializeMaxHp();

  const maxTurns = Math.max(5, Math.min(40, Number(roundLimitEl.value) || 20));
  const buffs = arenaBuff[arenaEl.value] || arenaBuff.ruins;

  pushLog(`戦場: ${buffs.label} / 最大ターン: ${maxTurns}`);

  while (!state.winner && state.turn <= maxTurns) {
    pushLog(`-- ターン ${state.turn} --`);

    const actionOrder = [...aliveMembers(state.teamA), ...aliveMembers(state.teamB)].sort((a, b) => b.speed - a.speed);

    for (const actor of actionOrder) {
      const allies = actor.id.startsWith("a") ? state.teamA : state.teamB;
      const enemies = actor.id.startsWith("a") ? state.teamB : state.teamA;

      if (!aliveMembers(enemies).length || !aliveMembers(allies).length) break;

      performAction(actor, allies, enemies, buffs);

      if (!aliveMembers(enemies).length) {
        state.winner = actor.id.startsWith("a") ? "チームA" : "チームB";
        break;
      }
    }

    state.turn += 1;
  }

  if (!state.winner) {
    const totalA = aliveMembers(state.teamA).reduce((sum, m) => sum + m.hp, 0);
    const totalB = aliveMembers(state.teamB).reduce((sum, m) => sum + m.hp, 0);
    if (totalA === totalB) {
      state.winner = "引き分け";
    } else {
      state.winner = totalA > totalB ? "チームA（判定勝ち）" : "チームB（判定勝ち）";
    }
  }

  winnerText.textContent = `勝者: ${state.winner}`;
  render();
}

function statusLine(member) {
  const hpClass = member.hp <= 0 ? "hp zero" : "hp";
  return `<strong>${member.name}</strong> (${member.role})<br><span class="${hpClass}">HP: ${member.hp}/${member.maxHp}</span> / ATK ${member.attack} / DEF ${member.defense} / SPD ${member.speed}`;
}

function render() {
  teamAStatus.innerHTML = state.teamA.map((m) => `<li>${statusLine(m)}</li>`).join("");
  teamBStatus.innerHTML = state.teamB.map((m) => `<li>${statusLine(m)}</li>`).join("");
  battleLog.innerHTML = state.logs.map((line) => `<li>${line}</li>`).join("");
}

function reset() {
  state = createInitialState();
  initializeMaxHp();
  winnerText.textContent = "「バトル開始」を押してください。";
  render();
}

runBattleBtn.addEventListener("click", runBattle);
resetBtn.addEventListener("click", reset);

reset();
