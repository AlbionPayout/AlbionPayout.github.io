let memberId = 0;
let guildMembers = [];

async function searchGuilds(query) {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`https://corsproxy.io/?https://gameinfo-ams.albiononline.com/api/gameinfo/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.guilds || [];
  } catch {
    return [];
  }
}

async function fetchGuildMembers(guildName) {
  if (!guildName || guildName.trim() === "") {
    guildMembers = [];
    return false;
  }
  try {
    const guilds = await searchGuilds(guildName);
    const guild = guilds.find(g => g.Name.toLowerCase() === guildName.toLowerCase());
    if (!guild) {
      guildMembers = [];
      return false;
    }
    const memberRes = await fetch(`https://corsproxy.io/?https://gameinfo-ams.albiononline.com/api/gameinfo/guilds/${guild.Id}/members`);
    const members = await memberRes.json();
    guildMembers = members.map(m => m.Name).sort();
    return true;
  } catch {
    guildMembers = [];
    return false;
  }
}

function createAutocomplete(input, sourceList, onSelect) {
  let list;
  input.addEventListener("input", function () {
    const val = this.value.toLowerCase();
    if (list) list.remove();

    list = document.createElement("div");
    list.classList.add(sourceList === guildMembers ? "autocomplete-list" : "guild-autocomplete");
    this.parentNode.appendChild(list);

    const matches = sourceList
      .filter(name => name.toLowerCase().includes(val))
      .slice(0, 20);

    if (matches.length === 0) {
      const noResult = document.createElement("div");
      noResult.classList.add("autocomplete-item");
      noResult.textContent = "Aucun résultat";
      noResult.style.color = "#888";
      noResult.style.cursor = "default";
      list.appendChild(noResult);
      return;
    }

    matches.forEach(name => {
      const item = document.createElement("div");
      item.classList.add("autocomplete-item");
      item.textContent = name;
      item.onclick = () => {
        input.value = name;
        list.remove();
        if (onSelect) onSelect(name);
      };
      list.appendChild(item);
    });
  });

  document.addEventListener("click", function (e) {
    if (list && e.target !== input) list.remove();
  });
}


function formatNumber(num) {
  return num.toLocaleString('fr-FR').replace(/\s/g, '\u00A0');
}

function addMember(name = '') {
  const membersList = document.getElementById('membersList');
  const div = document.createElement('div');
  div.className = 'member-entry';
  div.dataset.id = memberId;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Nom du membre';
  input.value = name;
  createAutocomplete(input, guildMembers, () => updateRepairDropdown());
  input.addEventListener('input', () => updateRepairDropdown());

  const remove = document.createElement('button');
  remove.textContent = 'X';
  remove.className = 'remove-btn';
  remove.onclick = () => div.remove();

  div.appendChild(input);
  div.appendChild(remove);
  membersList.appendChild(div);

  memberId++;
}

function updateRepairDropdown() {
  const select = document.getElementById('repairTarget');
  const memberInputs = document.querySelectorAll('#membersList input[type="text"]');
  const currentValue = select.value;
  select.innerHTML = '<option value="">-- Aucun --</option>';

  memberInputs.forEach(input => {
    const name = input.value.trim();
    if (name) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      if (name === currentValue) option.selected = true;
      select.appendChild(option);
    }
  });
}

function calculateSplit() {
  const total = parseFloat(document.getElementById('chestTotal').value);
  const repairCost = parseFloat(document.getElementById('repairCost').value) || 0;
  const repairTarget = document.getElementById('repairTarget').value;
  const result = document.getElementById('result');
  const memberInputs = document.querySelectorAll('#membersList input[type="text"]');

  result.innerHTML = '';

  const names = Array.from(memberInputs).map(input => input.value.trim()).filter(name => name);

  if (isNaN(total) || total <= 0 || names.length === 0) {
    result.innerHTML = '<p style="color: red;">Veuillez entrer un total valide et au moins un membre.</p>';
    return;
  }

  if (repairCost > total) {
    result.innerHTML = '<p style="color: red;">Le coût de réparation ne peut pas dépasser le total du coffre.</p>';
    return;
  }

  const totalAfterRepair = total - repairCost;
  const split = totalAfterRepair / names.length;
  const header = document.createElement('h2');
  result.appendChild(header);

  names.forEach((name, i) => {
    const div = document.createElement('div');
    div.className = 'member';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `pay-${i}`;

    const label = document.createElement('label');
    let payout = split;
    if (repairTarget && name === repairTarget) payout += repairCost;

    label.textContent = `${name}${repairTarget && name === repairTarget ? ' (Remboursé)' : ''} - ${formatNumber(Math.round(payout))} Silver`;
    label.htmlFor = checkbox.id;

    checkbox.addEventListener('change', () => {
      label.classList.toggle('paid', checkbox.checked);
    });

    div.appendChild(checkbox);
    div.appendChild(label);
    result.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const guildInput = document.getElementById("guildName");
  const guildStatus = document.getElementById("guildStatus");

  let timeout;
  guildInput.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      const guildList = await searchGuilds(guildInput.value);
      createAutocomplete(guildInput, guildList.map(g => g.Name), async (selected) => {
        guildInput.value = selected;
        const valid = await fetchGuildMembers(selected);
        guildStatus.textContent = valid ? "✅" : "❌";
      });
      const valid = await fetchGuildMembers(guildInput.value);
      guildStatus.textContent = valid ? "✅" : "❌";
    }, 300);
  });
});
